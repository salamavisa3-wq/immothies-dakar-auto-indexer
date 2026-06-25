/**
 * SitemapFetcher - Récupère et parse les sitemaps XML
 */

const axios = require('axios');
const xml2js = require('xml2js');

class SitemapFetcher {
  constructor(baseUrl = 'https://immothies-dakar.com') {
    this.baseUrl = baseUrl;
    this.sitemapUrl = `${baseUrl}/sitemap_index.xml`;
  }

  /**
   * Récupère le contenu XML d'une URL
   */
  async fetchXml(url) {
    try {
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; IndexerBot/1.0)'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Impossible de récupérer ${url}: ${error.message}`);
    }
  }

  /**
   * Parse un XML de sitemap
   */
  async parseXml(xml) {
    const parser = new xml2js.Parser({ explicitArray: false });
    return await parser.parseStringPromise(xml);
  }

  /**
   * Récupère tous les sitemaps depuis l'index
   */
  async fetchAllSitemaps() {
    console.log('🔍 Récupération des sitemaps...\n');

    try {
      const xml = await this.fetchXml(this.sitemapUrl);
      const parsed = await this.parseXml(xml);

      const sitemaps = [];

      // Gestion du sitemap index
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

      console.log(`✅ ${sitemaps.length} sitemaps trouvés:\n`);
      sitemaps.forEach((s, i) => console.log(`   ${i + 1}. ${s.url}`));
      console.log();

      return sitemaps;
    } catch (error) {
      console.error('❌ Erreur:', error.message);
      return [];
    }
  }

  /**
   * Récupère toutes les URLs d'un sitemap
   */
  async fetchUrlsFromSitemap(sitemapUrl) {
    try {
      const xml = await this.fetchXml(sitemapUrl);
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
