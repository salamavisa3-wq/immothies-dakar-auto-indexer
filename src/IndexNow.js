/**
 * IndexNow - Module pour Bing, Yandex, et autres moteurs
 * Protocole IndexNow pour notification instantanée
 */

const axios = require('axios');

class IndexNow {
  constructor(config) {
    this.host = config.host || 'immothies-dakar.com';
    this.key = config.key;
    this.keyLocation = config.keyLocation || `https://${this.host}/indexnow-key.txt`;
    this.endpoint = config.endpoint || 'https://api.indexnow.org/indexnow';
    this.bingEndpoint = 'https://www.bing.com/indexnow';
    this.yandexEndpoint = 'https://yandex.com/indexnow';
  }

  /**
   * Soumet une liste d'URLs à IndexNow
   * @param {Array} urls - Liste des URLs à indexer
   */
  async submit(urls) {
    if (!Array.isArray(urls)) {
      urls = [urls];
    }

    const payload = {
      host: this.host,
      key: this.key,
      keyLocation: this.keyLocation,
      urlList: urls
    };

    const results = [];

    // Soumission à l'API IndexNow (multi-moteurs)
    try {
      console.log('📤 Soumission IndexNow...');
      const response = await axios.post(this.endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      results.push({
        engine: 'IndexNow (Multi)',
        status: 'success',
        code: response.status,
        urls: urls.length
      });

      console.log(`✅ Soumis à IndexNow: ${urls.length} URLs`);
    } catch (error) {
      results.push({
        engine: 'IndexNow (Multi)',
        status: 'error',
        error: error.message
      });
      console.error('❌ Erreur IndexNow:', error.message);
    }

    // Soumission directe à Bing
    try {
      console.log('📤 Soumission Bing...');
      const bingResponse = await axios.post(this.bingEndpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      results.push({
        engine: 'Bing',
        status: 'success',
        code: bingResponse.status,
        urls: urls.length
      });

      console.log(`✅ Soumis à Bing: ${urls.length} URLs`);
    } catch (error) {
      results.push({
        engine: 'Bing',
        status: 'error',
        error: error.message
      });
    }

    return results;
  }

  /**
   * Génère le fichier de clé IndexNow
   */
  generateKeyFile() {
    return this.key;
  }

  /**
   * Vérifie si la clé est accessible
   */
  async verifyKey() {
    try {
      const response = await axios.get(this.keyLocation, {
        timeout: 10000
      });
      return response.data === this.key;
    } catch (error) {
      return false;
    }
  }
}

module.exports = IndexNow;
