/**
 * Indexer Principal
 * Orchestration complète de l'indexation
 */

const GoogleIndexer = require('./GoogleIndexer');
const IndexNow = require('./IndexNow');
const SitemapFetcher = require('./SitemapFetcher');
const ReportGenerator = require('./ReportGenerator');
const fs = require('fs').promises;
const path = require('path');

class Indexer {
  constructor(config = {}) {
    this.config = {
      site: config.site || 'https://immothies-dakar.com',
      batchSize: config.batchSize || 100,
      delay: config.delay || 1000,
      ...config
    };

    this.sitemapFetcher = new SitemapFetcher(this.config.site);
    this.reportGenerator = new ReportGenerator();
    this.googleIndexer = null;
    this.indexNow = null;
  }

  /**
   * Initialise les indexeurs avec les credentials
   */
  async initialize(googleCredentials, indexNowKey) {
    // Initialisation Google Indexing API
    if (googleCredentials) {
      this.googleIndexer = new GoogleIndexer(googleCredentials);
      await this.googleIndexer.authenticate();
    }

    // Initialisation IndexNow
    if (indexNowKey) {
      this.indexNow = new IndexNow({
        host: 'immothies-dakar.com',
        key: indexNowKey
      });
    }
  }

  /**
   * Indexe toutes les pages du site
   */
  async indexAllPages(options = {}) {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║     INDEXATION COMPLETE - IMMOTHIES-DAKAR.COM    ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    const startTime = Date.now();

    // 1. Récupération des URLs
    console.log('📋 ÉTAPE 1: Récupération des URLs');
    console.log('═══════════════════════════════════════════════════\n');

    let urls;
    if (options.priorityOnly) {
      urls = this.getPriorityUrls();
      console.log(`✅ ${urls.length} URLs prioritaires sélectionnées\n`);
    } else {
      urls = await this.sitemapFetcher.fetchAllUrls();
    }

    if (urls.length === 0) {
      throw new Error('Aucune URL trouvée');
    }

    // 2. Indexation Google
    let googleResults = [];
    if (this.googleIndexer && !options.skipGoogle) {
      console.log('🔍 ÉTAPE 2: Indexation Google');
      console.log('═══════════════════════════════════════════════════\n');
      googleResults = await this.indexWithGoogle(urls);
    }

    // 3. Indexation IndexNow (Bing/Yandex)
    let indexNowResults = [];
    if (this.indexNow && !options.skipIndexNow) {
      console.log('🔍 ÉTAPE 3: Indexation IndexNow (Bing/Yandex)');
      console.log('═══════════════════════════════════════════════════\n');
      indexNowResults = await this.indexWithIndexNow(urls);
    }

    // 4. Génération du rapport
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n📊 ÉTAPE 4: Génération du rapport');
    console.log('═══════════════════════════════════════════════════\n');

    const report = await this.reportGenerator.generate({
      site: this.config.site,
      urls: urls,
      googleResults,
      indexNowResults,
      duration,
      timestamp: new Date().toISOString()
    });

    // Affichage du résumé
    this.displaySummary(report);

    return report;
  }

  /**
   * Indexe avec Google Indexing API
   */
  async indexWithGoogle(urls) {
    if (!this.googleIndexer) {
      console.log('⚠️ Google Indexing API non configuré\n');
      return [];
    }

    // Limiter aux 200 premières URLs (limite API)
    const limitedUrls = urls.slice(0, 200);
    console.log(`📌 Limitation aux ${limitedUrls.length} premières URLs (quota API)\n`);

    const results = await this.googleIndexer.indexBatch(
      limitedUrls,
      this.config.delay
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Google: ${successCount}/${results.length} URLs indexées\n`);

    return results;
  }

  /**
   * Indexe avec IndexNow
   */
  async indexWithIndexNow(urls) {
    if (!this.indexNow) {
      console.log('⚠️ IndexNow non configuré\n');
      return [];
    }

    // IndexNow supporte jusqu'à 10,000 URLs par requête
    const batchSize = 10000;
    const results = [];

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      console.log(`📤 Soumission batch ${Math.floor(i / batchSize) + 1} (${batch.length} URLs)...`);

      const batchResults = await this.indexNow.submit(batch);
      results.push(...batchResults);
    }

    console.log(`✅ IndexNow: ${urls.length} URLs soumises\n`);
    return results;
  }

  /**
   * Récupère les URLs prioritaires
   */
  getPriorityUrls() {
    return [
      `${this.config.site}/`,
      `${this.config.site}/vente/`,
      `${this.config.site}/location/`,
      `${this.config.site}/terrains/`,
      `${this.config.site}/contact/`,
      `${this.config.site}/a-propos/`,
      `${this.config.site}/services/`,
      `${this.config.site}/nos-biens/`
    ];
  }

  /**
   * Affiche le résumé du rapport
   */
  displaySummary(report) {
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║              RAPPORT D\'INDEXATION               ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    console.log(`📅 Date: ${new Date(report.timestamp).toLocaleString()}`);
    console.log(`🌐 Site: ${report.site}`);
    console.log(`⏱️  Durée: ${report.duration}s`);
    console.log(`🔗 URLs traitées: ${report.urls.length}`);

    if (report.googleResults.length > 0) {
      const googleSuccess = report.googleResults.filter(r => r.success).length;
      console.log(`🔍 Google: ${googleSuccess}/${report.googleResults.length} ✅`);
    }

    if (report.indexNowResults.length > 0) {
      console.log(`🔍 IndexNow: Soumis ✅`);
    }

    console.log('\n📁 Rapport sauvegardé dans: reports/');
    console.log('\n✅ Indexation terminée avec succès!\n');
  }
}

// Export pour utilisation en module
module.exports = Indexer;

// Exécution si appelé directement
if (require.main === module) {
  const indexer = new Indexer();

  // Lecture des credentials depuis les variables d'environnement
  const googleCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
    : null;

  const indexNowKey = process.env.INDEXNOW_KEY;

  indexer.initialize(googleCredentials, indexNowKey)
    .then(() => indexer.indexAllPages({
      priorityOnly: process.env.PRIORITY_ONLY === 'true',
      skipGoogle: process.env.SKIP_GOOGLE === 'true',
      skipIndexNow: process.env.SKIP_INDEXNOW === 'true'
    }))
    .then(report => {
      console.log('✨ Tâche complétée');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}
