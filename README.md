# 🚀 immothies-dakar-auto-indexer

Automatisation complète de l'indexation Google et Bing pour **immothies-dakar.com**.

[![GitHub Actions](https://github.com/votre-username/immothies-indexer/workflows/🚀%20Index%20immothies-dakar.com/badge.svg)](https://github.com/votre-username/immothies-indexer/actions)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Démarrage rapide](#-démarrage-rapide)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [GitHub Actions](#-github-actions)
- [Documentation](#-documentation)

## ✨ Fonctionnalités

- 🔍 **Récupération automatique** des URLs depuis les sitemaps
- 🔗 **Indexation Google** via l'API Indexing officielle
- 🎯 **Indexation Bing/Yandex** via le protocole IndexNow
- 📊 **Rapports détaillés** (JSON, Markdown, HTML)
- 🤖 **Automatisation GitHub Actions** (quotidienne + manuelle)
- 🔄 **Batch processing** avec rate limiting
- 📈 **Monitoring et notifications**

## 🚀 Démarrage rapide

### 1. Créer le repository GitHub

```bash
# Cloner ce repository
git clone https://github.com/votre-username/immothies-indexer.git
cd immothies-indexer

# Installer les dépendances
npm install
```

### 2. Configurer les secrets

Dans votre repository GitHub, allez dans **Settings → Secrets and variables → Actions** :

| Secret | Description | Obtenir ici |
|--------|-------------|-------------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Clé JSON compte de service Google | [Google Cloud Console](https://console.cloud.google.com/) |
| `INDEXNOW_KEY` | Clé IndexNow pour Bing | [Bing IndexNow](https://www.bing.com/indexnow) |
| `DISCORD_WEBHOOK_URL` | Webhook Discord (optionnel) | Discord Server Settings |

### 3. Lancer l'indexation

```bash
# Mode local (nécessite les credentials)
export GOOGLE_SERVICE_ACCOUNT_JSON='$(cat credentials.json)'
export INDEXNOW_KEY='votre-clé-indexnow'
npm run index
```

Ou utilisez **GitHub Actions** pour l'automatisation cloud !

## 🔧 Configuration

### Configuration Google Indexing API

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un projet ou sélectionnez-en un existant
3. Activez l'**API Indexing** : APIs & Services → Library → Search "Indexing API"
4. Créez un compte de service : IAM & Admin → Service Accounts
5. Téléchargez la clé JSON
6. Ajoutez le compte de service dans [Search Console](https://search.google.com/search-console) comme propriétaire

### Configuration IndexNow

1. Générez une clé sur [Bing IndexNow](https://www.bing.com/indexnow)
2. Copiez la clé dans les secrets GitHub
3. Le workflow s'occupe du reste !

## 📖 Utilisation

### Scripts disponibles

```bash
# Indexation complète
npm run index

# Indexation Google uniquement
npm run index:google

# Indexation Bing uniquement
npm run index:bing

# Récupération du sitemap
npm run sitemap:fetch

# Génération du rapport
npm run report

# Test de configuration
npm test
```

### Utilisation programmatique

```javascript
const Indexer = require('./src/indexer');

const indexer = new Indexer({
  site: 'https://immothies-dakar.com',
  batchSize: 100,
  delay: 1000
});

// Initialisation
await indexer.initialize(
  require('./google-credentials.json'),
  'votre-clé-indexnow'
);

// Indexation complète
const report = await indexer.indexAllPages();

// Indexation URLs prioritaires uniquement
const report = await indexer.indexAllPages({ priorityOnly: true });
```

## 🤖 GitHub Actions

### Workflows disponibles

| Workflow | Déclencheur | Description |
|----------|-------------|-------------|
| `index-immothies.yml` | Schedule, push, manual | Indexation complète |
| `index-google` | Via parent | Indexation Google API |
| `index-bing` | Via parent | Indexation IndexNow |

### Exécution manuelle

1. Allez dans l'onglet **Actions** du repository
2. Sélectionnez **🚀 Index immothies-dakar.com**
3. Cliquez sur **Run workflow**
4. Choisissez les options :
   - `indexing_mode`: full, priority_only, google_only, bing_only
   - `custom_urls`: URLs spécifiques (optionnel)

### Planification automatique

Le workflow s'exécute automatiquement :
- ⏰ **Tous les jours à 6h UTC**
- 🔄 **Après chaque push sur `main`**
- 👆 **Manuellement** via l'interface GitHub

## 📊 Rapports

Les rapports sont générés automatiquement dans le dossier `reports/` :

- **JSON** : Données brutes pour intégration
- **Markdown** : Résumé lisible
- **HTML** : Visualisation interactive

Structure d'un rapport :

```json
{
  "site": "https://immothies-dakar.com",
  "timestamp": "2024-01-15T10:30:00Z",
  "urls": [...],
  "googleResults": [...],
  "indexNowResults": [...],
  "summary": {
    "totalUrls": 60,
    "googleSuccess": 58,
    "googleFailed": 2
  }
}
```

## 📚 Documentation

### Architecture

```
.
├── src/
│   ├── indexer.js           # Orchestrateur principal
│   ├── GoogleIndexer.js     # Module Google API
│   ├── IndexNow.js          # Module IndexNow
│   ├── SitemapFetcher.js    # Parser de sitemaps
│   └── ReportGenerator.js   # Générateur de rapports
├── .github/
│   └── workflows/
│       └── index-immothies.yml  # Workflow GitHub Actions
├── reports/                 # Rapports générés (gitignored)
├── package.json
└── README.md
```

### Sitemaps indexés

Le système récupère automatiquement les URLs depuis :

- ✅ `sitemap_index.xml` (index principal)
- ✅ `post-sitemap.xml` (articles blog)
- ✅ `page-sitemap.xml` (pages statiques)
- ✅ `immowp_gestion_immo-sitemap.xml` (biens immobiliers)
- ✅ `category-sitemap.xml` (catégories)
- ✅ `immowp_localisation-sitemap.xml` (localisations)
- ✅ `immowp_offre-sitemap.xml` (types d'offres)
- ✅ `author-sitemap.xml` (auteurs)

### Limites et quotas

| Service | Limite | Délai |
|---------|--------|-------|
| Google Indexing API | 200 URLs/jour | 1 seconde entre requêtes |
| IndexNow | 10,000 URLs/jour | Batch possible |

## 🔒 Sécurité

- ✅ **Pas de credentials en dur** dans le code
- ✅ **Secrets GitHub** pour stockage sécurisé
- ✅ **Rate limiting** intégré
- ✅ **Validation des URLs** avant indexation

## 🛠️ Développement

```bash
# Installation
npm install

# Test
npm test

# Lint
npm run lint
```

## 📞 Support

Pour toute question ou problème :

1. 📖 Consultez la [documentation complète](docs/)
2. 🐛 Ouvrez une [issue GitHub](../../issues)
3. 💬 Contactez l'équipe

## 📄 Licence

MIT License - voir [LICENSE](LICENSE) pour les détails.

---

**🎉 Fait avec ❤️ pour optimiser la visibilité de immothies-dakar.com !**
