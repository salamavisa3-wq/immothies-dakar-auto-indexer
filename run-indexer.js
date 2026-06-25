/**
 * Script wrapper pour l'indexation avec nettoyage JSON
 */

const fs = require('fs');
const path = require('path');

// Nettoyer le JSON des caractères BOM et espaces
function cleanJson(jsonString) {
  if (!jsonString) return null;
  // Supprimer BOM et espaces
  return jsonString.replace(/^﻿/, '').trim();
}

// Lire les credentials
let googleCredentials = null;
if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  try {
    const cleanedJson = cleanJson(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    googleCredentials = JSON.parse(cleanedJson);
    console.log('✅ Credentials Google charges avec succes');
  } catch (err) {
    console.error('❌ Erreur parsing JSON:', err.message);
    process.exit(1);
  }
}

const indexNowKey = process.env.INDEXNOW_KEY;

// Charger et executer l'indexer
const Indexer = require('./src/indexer');
const indexer = new Indexer();

indexer.initialize(googleCredentials, indexNowKey)
  .then(() => {
    console.log('\n🚀 Demarrage de l\'indexation...\n');
    return indexer.indexAllPages({
      priorityOnly: process.env.PRIORITY_ONLY === 'true',
      skipGoogle: process.env.SKIP_GOOGLE === 'true',
      skipIndexNow: process.env.SKIP_INDEXNOW === 'true'
    });
  })
  .then(() => {
    console.log('\n✅ Indexation terminee!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Erreur:', err.message);
    process.exit(1);
  });
