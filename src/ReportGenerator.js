/**
 * ReportGenerator - Génère les rapports d'indexation
 */

const fs = require('fs').promises;
const path = require('path');

class ReportGenerator {
  constructor() {
    this.reportsDir = path.join(process.cwd(), 'reports');
  }

  /**
   * Génère un rapport complet
   */
  async generate(data) {
    // Création du dossier reports
    await this.ensureDirectory(this.reportsDir);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `indexing-report-${timestamp}.json`;
    const filepath = path.join(this.reportsDir, filename);

    // Rapport JSON
    const report = {
      ...data,
      summary: {
        totalUrls: data.urls.length,
        googleSuccess: data.googleResults.filter(r => r.success).length,
        googleFailed: data.googleResults.filter(r => !r.success).length,
        indexNowEngines: data.indexNowResults.map(r => r.engine)
      }
    };

    await fs.writeFile(filepath, JSON.stringify(report, null, 2));

    // Rapport Markdown
    await this.generateMarkdownReport(report, timestamp);

    // Rapport HTML
    await this.generateHtmlReport(report, timestamp);

    return report;
  }

  /**
   * Génère un rapport Markdown
   */
  async generateMarkdownReport(report, timestamp) {
    const filename = `indexing-report-${timestamp}.md`;
    const filepath = path.join(this.reportsDir, filename);

    const markdown = `# Rapport d'Indexation - immothies-dakar.com

**Date:** ${new Date(report.timestamp).toLocaleString()}
**Site:** ${report.site}
**Durée:** ${report.duration}s

## Résumé

| Métrique | Valeur |
|----------|--------|
| URLs totales | ${report.summary.totalUrls} |
| Indexées sur Google | ${report.summary.googleSuccess}/${report.googleResults.length} |
| Échecs Google | ${report.summary.googleFailed} |
| Moteurs IndexNow | ${report.summary.indexNowEngines.join(', ') || 'N/A'} |

## URLs traitées

${report.urls.slice(0, 50).map(url => `- ${url}`).join('\n')}

${report.urls.length > 50 ? `\n... et ${report.urls.length - 50} autres URLs` : ''}

## Détails Google Indexing API

${report.googleResults.map(r => {
  const status = r.success ? '✅' : '❌';
  return `${status} \`${r.url}\` ${r.error || ''}`;
}).join('\n')}

## Détails IndexNow

${report.indexNowResults.map(r => {
  const status = r.status === 'success' ? '✅' : '❌';
  return `${status} ${r.engine}: ${r.status}${r.error ? ` (${r.error})` : ''}`;
}).join('\n')}

---
*Rapport généré automatiquement par immothies-dakar-auto-indexer*
`;

    await fs.writeFile(filepath, markdown);
  }

  /**
   * Génère un rapport HTML
   */
  async generateHtmlReport(report, timestamp) {
    const filename = `indexing-report-${timestamp}.html`;
    const filepath = path.join(this.reportsDir, filename);

    const successRate = report.googleResults.length > 0
      ? ((report.summary.googleSuccess / report.googleResults.length) * 100).toFixed(1)
      : 0;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rapport d'Indexation - immothies-dakar.com</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-value { font-size: 2em; font-weight: bold; color: #4CAF50; }
    .metric-label { color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #4CAF50; color: white; }
    tr:hover { background: #f5f5f5; }
    .success { color: #4CAF50; }
    .error { color: #f44336; }
    .url-list { max-height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; }
  </style>
</head>
<body>
  <h1>📊 Rapport d'Indexation</h1>

  <div class="summary">
    <div class="metric">
      <div class="metric-value">${report.summary.totalUrls}</div>
      <div class="metric-label">URLs totales</div>
    </div>
    <div class="metric">
      <div class="metric-value">${successRate}%</div>
      <div class="metric-label">Taux de succès Google</div>
    </div>
    <div class="metric">
      <div class="metric-value">${report.duration}s</div>
      <div class="metric-label">Durée</div>
    </div>
  </div>

  <h2>URLs indexées (${report.urls.length})</h2>
  <div class="url-list">
    <ul>
      ${report.urls.map(url => `<li>${url}</li>`).join('')}
    </ul>
  </div>

  <h2>Détails Google Indexing API</h2>
  <table>
    <thead>
      <tr>
        <th>Statut</th>
        <th>URL</th>
        <th>Horodatage</th>
      </tr>
    </thead>
    <tbody>
      ${report.googleResults.map(r => `
        <tr>
          <td class="${r.success ? 'success' : 'error'}">${r.success ? '✅ Succès' : '❌ Échec'}</td>
          <td>${r.url}</td>
          <td>${new Date(r.timestamp).toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <p><small>Généré le ${new Date().toLocaleString()}</small></p>
</body>
</html>`;

    await fs.writeFile(filepath, html);
  }

  /**
   * Crée un dossier s'il n'existe pas
   */
  async ensureDirectory(dir) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

module.exports = ReportGenerator;
