/**
 * Google Indexer - Module principal d'indexation
 * Utilise l'API Google Indexing pour notifier les changements
 */

const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

class GoogleIndexer {
  constructor(credentials) {
    this.credentials = credentials;
    this.indexing = null;
    this.auth = null;
  }

  /**
   * Initialise l'authentification Google
   */
  async authenticate() {
    try {
      this.auth = new google.auth.GoogleAuth({
        credentials: this.credentials,
        scopes: ['https://www.googleapis.com/auth/indexing']
      });

      this.indexing = google.indexing({
        version: 'v3',
        auth: this.auth
      });

      console.log('✅ Authentification Google réussie');
      return true;
    } catch (error) {
      console.error('❌ Erreur d\'authentification:', error.message);
      throw error;
    }
  }

  /**
   * Indexe une URL spécifique
   * @param {string} url - URL à indexer
   * @param {string} type - 'URL_UPDATED' ou 'URL_DELETED'
   */
  async indexUrl(url, type = 'URL_UPDATED') {
    try {
      const response = await this.indexing.urlNotifications.publish({
        requestBody: {
          url: url,
          type: type
        }
      });

      console.log(`✅ Indexé: ${url} (${type})`);
      return {
        success: true,
        url,
        type,
        timestamp: new Date().toISOString(),
        response: response.data
      };
    } catch (error) {
      console.error(`❌ Erreur d'indexation ${url}:`, error.message);
      return {
        success: false,
        url,
        type,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Indexe plusieurs URLs en batch
   * @param {Array} urls - Liste des URLs
   * @param {number} delay - Délai entre les requêtes (ms)
   */
  async indexBatch(urls, delay = 1000) {
    const results = [];

    console.log(`\n🚀 Démarrage de l'indexation de ${urls.length} URLs...\n`);

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const result = await this.indexUrl(url);
      results.push(result);

      // Progress indicator
      const progress = ((i + 1) / urls.length * 100).toFixed(1);
      process.stdout.write(`\r⏳ Progression: ${i + 1}/${urls.length} (${progress}%)`);

      // Rate limiting
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.log('\n');
    return results;
  }

  /**
   * Récupère le statut d'une URL
   * @param {string} url - URL à vérifier
   */
  async getStatus(url) {
    try {
      const response = await this.indexing.urlNotifications.getMetadata({
        url: url
      });

      return {
        url,
        status: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        url,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = GoogleIndexer;
