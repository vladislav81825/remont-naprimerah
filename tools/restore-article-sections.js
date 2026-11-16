const fs = require('fs/promises');
const path = require('path');
const { extractExtraSections, cleanBody } = require('./scrape-chatium');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'articles.json');
const RAW_DIR = path.join(ROOT, 'content', 'chatium-raw');
const ARTICLE_DIR = path.join(ROOT, 'content', 'chatium');

function withSections(article, sources, disclaimer) {
  const result = {};
  for (const [key, value] of Object.entries(article)) {
    if (key === 'sourceUrl') {
      result.sources = sources;
      result.disclaimer = disclaimer;
    }
    result[key] = value;
  }
  if (!('sources' in result)) {
    result.sources = sources;
    result.disclaimer = disclaimer;
  }
  return result;
}

async function main() {
  const articles = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
  const missingRaw = [];
  const missingSources = [];
  const missingDisclaimer = [];
  const updated = [];

  for (const article of articles) {
    const rawFile = path.join(RAW_DIR, `${article.slug}.html`);
    let html;
    try {
      html = await fs.readFile(rawFile, 'utf8');
    } catch {
      missingRaw.push(article.slug);
      updated.push(article);
      continue;
    }

    const extras = extractExtraSections(html);
    const sources = extras.sources ? cleanBody(extras.sources) : null;
    const disclaimer = extras.disclaimer ? cleanBody(extras.disclaimer) : null;
    if (!sources) missingSources.push(article.slug);
    if (!disclaimer) missingDisclaimer.push(article.slug);

    const articleWithSections = withSections(article, sources, disclaimer);
    updated.push(articleWithSections);

    const articleFile = path.join(ARTICLE_DIR, `${article.slug}.json`);
    try {
      const source = JSON.parse(await fs.readFile(articleFile, 'utf8'));
      await fs.writeFile(articleFile, JSON.stringify(withSections(source, sources, disclaimer), null, 2) + '\n', 'utf8');
    } catch {}
  }

  await fs.writeFile(DATA_FILE, JSON.stringify(updated, null, 2) + '\n', 'utf8');

  console.log(`Статей обработано: ${updated.length}`);
  console.log(`Без raw-файла: ${missingRaw.length}`);
  console.log(`Без блока «Источники»: ${missingSources.length}`);
  console.log(`Без блока «Дисклеймер»: ${missingDisclaimer.length}`);
  if (missingRaw.length) console.log(`Нет raw: ${missingRaw.join(', ')}`);
  if (missingSources.length) console.log(`Нет источников: ${missingSources.join(', ')}`);
  if (missingDisclaimer.length) console.log(`Нет дисклеймера: ${missingDisclaimer.join(', ')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
