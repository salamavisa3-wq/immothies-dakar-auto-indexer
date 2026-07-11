/**
 * SitemapFetcher - Récupère et parse les sitemaps XML
 */

const axios = require('axios');
const xml2js = require('xml2js');

class SitemapFetcher {
  constructor(baseUrl = 'https://immothies-dakar.com') {
    this.baseUrl = baseUrl;
    this.sitemapUrls = [
      `${baseUrl}/sitemap_index.xml`,
      `${baseUrl}/sitemap.xml`
    ];
  }

  async fetchXml(url, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await axios.get(url, {
          timeout: 30000,
          responseType: 'text',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/xml, text/xml, */*'
          }
        });
        let data = typeof response.data === 'string' ? response.data : String(response.data);
        // Strip BOM
        data = data.replace(/^﻿/, '');
        // Strip any content before the first XML tag (PHP notices, whitespace)
        const xmlStart = data.indexOf('<?xml');
        if (xmlStart > 0) {
          console.warn(`⚠️ ${data.substring(0, xmlStart).length} caractères non-XML ignorés avant <?xml`);
          data = data.substring(xmlStart);
        } else if (xmlStart === -1) {
          const tagStart = data.indexOf('<');
          if (tagStart > 0) {
            data = data.substring(tagStart);
          } else if (tagStart === -1) {
            throw new Error(`Réponse non-XML de ${url} (début: ${data.substring(0, 80)})`);
          }
        }
        return data;
      } catch (error) {
        if (attempt < retries) {
          const delay = attempt * 2000;
          console.warn(`⚠️ Tentative ${attempt}/${retries} échouée pour ${url}, retry dans ${delay/1000}s...`);
          await new Promise(r => setTimeout(r, delay));
        } else {
          throw new Error(`Impossible de récupérer ${url} après ${retries} tentatives: ${error.message}`);
        }
      }
    }
  }

  async parseXml(xml) {
    const parser = new xml2js.Parser({ explicitArray: false });
    return await parser.parseStringPromise(xml);
  }

  async fetchAllSitemaps() {
    console.log('🔍 Récupération des sitemaps...\n');

    for (const sitemapUrl of this.sitemapUrls) {
      try {
        console.log(`📡 Essai: ${sitemapUrl}`);
        const xml = await this.fetchXml(sitemapUrl);
        const parsed = await this.parseXml(xml);

        const sitemaps = [];

        if (parsed.sitemapindex && parsed.sitemapindex.sitemap) {
          const sitemapList = Array.isArray(parsed.sitemapindex.sitemap)
            ? parsed.sitemapindex.sitemap
            : [parsed.sitemapindex.sitemap];

          for (const sitemap of sitemapList) {
            sitemaps.push({
              url: sitemap.loc,
              lastmod: sitemap.lastmod
            });
          }
        }

        if (sitemaps.length > 0) {
          console.log(`✅ ${sitemaps.length} sitemaps trouvés:\n`);
          sitemaps.forEach((s, i) => console.log(`   ${i + 1}. ${s.url}`));
          console.log();
          return sitemaps;
        }

        console.warn(`⚠️ Aucun sitemap dans ${sitemapUrl}, essai suivant...`);
      } catch (error) {
        console.error(`❌ Erreur ${sitemapUrl}: ${error.message}`);
      }
    }

    console.error('❌ Aucun sitemap index accessible');
    return [];
  }

  /**
   * Récupère toutes les URLs d'un sitemap
   */
  async fetchUrlsFromSitemap(sitemapUrl) {
    try {
      const xml = await this.fetchXml(sitemapUrl, 2);
      const parsed = await this.parseXml(xml);

      const urls = [];

      if (parsed.urlset && parsed.urlset.url) {
        const urlList = Array.isArray(parsed.urlset.url)
          ? parsed.urlset.url
          : [parsed.urlset.url];

        for (const url of urlList) {
          urls.push({
            loc: url.loc,
            lastmod: url.lastmod,
            changefreq: url.changefreq,
            priority: url.priority
          });
        }
      }

      return urls;
    } catch (error) {
      console.error(`❌ Erreur ${sitemapUrl}:`, error.message);
      return [];
    }
  }

  /**
   * Récupère toutes les URLs de tous les sitemaps
   */
  async fetchAllUrls() {
    const sitemaps = await this.fetchAllSitemaps();
    const allUrls = [];

    for (const sitemap of sitemaps) {
      console.log(`📄 Analyse de ${sitemap.url}...`);
      const urls = await this.fetchUrlsFromSitemap(sitemap.url);
      allUrls.push(...urls.map(u => u.loc));
      console.log(`   ✅ ${urls.length} URLs trouvées\n`);
    }

    // Déduplication
    const uniqueUrls = [...new Set(allUrls)];
    console.log(`📊 Total: ${uniqueUrls.length} URLs uniques\n`);

    return uniqueUrls;
  }

  /**
   * Récupère les URLs par type (pages, posts, etc.)
   */
  async fetchUrlsByType() {
    const sitemaps = await this.fetchAllSitemaps();
    const urlsByType = {};

    for (const sitemap of sitemaps) {
      const type = this.getSitemapType(sitemap.url);
      const urls = await this.fetchUrlsFromSitemap(sitemap.url);
      urlsByType[type] = urls.map(u => u.loc);
    }

    return urlsByType;
  }

  /**
   * Détermine le type de sitemap
   */
  getSitemapType(url) {
    if (url.includes('post')) return 'posts';
    if (url.includes('page')) return 'pages';
    if (url.includes('immowp_gestion_immo')) return 'properties';
    if (url.includes('category')) return 'categories';
    if (url.includes('localisation')) return 'locations';
    if (url.includes('offre')) return 'offers';
    if (url.includes('author')) return 'authors';
    return 'other';
  }
}

module.exports = SitemapFetcher;
