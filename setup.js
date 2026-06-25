/**
 * Setup script pour immothies-dakar-auto-indexer
 * Guide l'utilisateur à travers la configuration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

console.log('╔══════════════════════════════════════════════════╗');
console.log('║  SETUP - immothies-dakar-auto-indexer             ║');
console.log('╚══════════════════════════════════════════════════╝\n');

async function setup() {
  console.log('Cet assistant va vous aider à configurer l\'indexation automatique.\n');

  // Vérification des dépendances
  console.log('📦 Vérification des dépendances...');
  try {
    require('googleapis');
    require('axios');
    require('xml2js');
    console.log('✅ Toutes les dépendances sont installées\n');
  } catch {
    console.log('❌ Dépendances manquantes. Exécutez: npm install\n');
    process.exit(1);
  }

  // Configuration Google
  console.log('═══════════════════════════════════════════════════');
  console.log('🔐 CONFIGURATION GOOGLE INDEXING API');
  console.log('═══════════════════════════════════════════════════\n');
  console.log('1. Allez sur https://console.cloud.google.com/');
  console.log('2. Créez un projet ou utilisez-en un existant');
  console.log('3. Activez "API Indexing" dans APIs & Services → Library');
  console.log('4. Créez un compte de service dans IAM & Admin');
  console.log('5. Téléchargez la clé JSON\n');

  const googleCredsPath = await question('📁 Chemin vers le fichier JSON Google: ');

  if (fs.existsSync(googleCredsPath)) {
    const googleCreds = fs.readFileSync(googleCredsPath, 'utf8');
    fs.writeFileSync('.env', `GOOGLE_SERVICE_ACCOUNT_JSON=${googleCreds}\n`, { flag: 'a' });
    console.log('✅ Credentials Google sauvegardés\n');
  } else {
    console.log('⚠️ Fichier non trouvé. Vous devrez l\'ajouter manuellement.\n');
  }

  // Configuration IndexNow
  console.log('═══════════════════════════════════════════════════');
  console.log('🔐 CONFIGURATION INDEXNOW (BING)');
  console.log('═══════════════════════════════════════════════════\n');
  console.log('1. Allez sur https://www.bing.com/indexnow');
  console.log('2. Générez une clé');
  console.log('3. Copiez la clé ci-dessous\n');

  const indexnowKey = await question('🔑 Clé IndexNow: ');

  if (indexnowKey) {
    fs.writeFileSync('.env', `INDEXNOW_KEY=${indexnowKey}\n`, { flag: 'a' });
    console.log('✅ Clé IndexNow sauvegardée\n');
  }

  // Configuration site
  console.log('═══════════════════════════════════════════════════');
  console.log('🌐 CONFIGURATION DU SITE');
  console.log('═══════════════════════════════════════════════════\n');

  const siteUrl = await question('🌐 URL du site [https://immothies-dakar.com]: ');
  fs.writeFileSync('.env', `SITE_URL=${siteUrl || 'https://immothies-dakar.com'}\n`, { flag: 'a' });

  // Finalisation
  console.log('\n═══════════════════════════════════════════════════');
  console.log('✅ CONFIGURATION TERMINÉE !');
  console.log('═══════════════════════════════════════════════════\n');

  console.log('📋 Prochaines étapes:');
  console.log('   1. Vérifiez le fichier .env créé');
  console.log('   2. Ajoutez le compte de service Google dans Search Console');
  console.log('   3. Hébergez la clé IndexNow sur votre site');
  console.log('   4. Testez avec: npm run index\n');

  console.log('📖 Documentation:');
  console.log('   README.md - Guide complet\n');

  rl.close();
}

setup().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
