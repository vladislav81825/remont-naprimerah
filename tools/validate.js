'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'data/site-config.json'), 'utf8'));
const articles = JSON.parse(fs.readFileSync(path.join(root, 'data/articles.json'), 'utf8'));
const errors = [];
const warnings = [];

function walk(directory, output) {
  const list = output || [];
  fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) return;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(full, list);
    } else if (entry.name.endsWith('.html')) {
      list.push(full);
    }
  });
  return list;
}

function relative(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function localTarget(reference, fromFile) {
  const clean = reference.split('#')[0].split('?')[0].trim();
  if (!clean) return null;
  if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(clean)) return null;
  let decoded = clean;
  try {
    decoded = decodeURIComponent(clean);
  } catch (error) {
    warnings.push(`${relative(fromFile)}: некорректный URL ${reference}`);
  }
  if (decoded.startsWith('/')) {
    return path.join(root, decoded.replace(/^\/+/, ''));
  }
  return path.resolve(path.dirname(fromFile), decoded);
}

function checkReference(reference, fromFile) {
  const target = localTarget(reference, fromFile);
  if (!target) return;
  let finalTarget = target;
  if (fs.existsSync(finalTarget) && fs.statSync(finalTarget).isDirectory()) {
    finalTarget = path.join(finalTarget, 'index.html');
  }
  if (!fs.existsSync(finalTarget)) {
    errors.push(`${relative(fromFile)}: не найден локальный файл ${reference}`);
  }
  if (!finalTarget.startsWith(root)) {
    errors.push(`${relative(fromFile)}: ссылка выходит за пределы сайта ${reference}`);
  }
}

const htmlFiles = walk(root).filter((file) => {
  const rel = relative(file);
  return !rel.startsWith('tools/') && !rel.startsWith('content/');
});

const expectedPages = 5 + articles.length + config.categories.length;
if (htmlFiles.length !== expectedPages) {
  errors.push(`Ожидалось ${expectedPages} HTML-страниц, найдено ${htmlFiles.length}`);
}

htmlFiles.forEach((file) => {
  const html = fs.readFileSync(file, 'utf8');
  const rel = relative(file);

  if (!/<title>[^<]{8,}<\/title>/i.test(html)) errors.push(`${rel}: нет корректного title`);
  if (!/<meta\s+name="description"\s+content="[^"]{20,}"/i.test(html)) errors.push(`${rel}: нет description`);
  if (!/<link\s+rel="canonical"\s+href="https:\/\/[^"]+"/i.test(html)) errors.push(`${rel}: нет canonical`);
  if (!/<h1[\s>]/i.test(html)) errors.push(`${rel}: нет h1`);

  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1Count !== 1) errors.push(`${rel}: найдено h1 — ${h1Count}`);

  if (!/css\/style\.css/.test(html)) errors.push(`${rel}: не подключён style.css`);
  if (!/js\/main\.js/.test(html)) errors.push(`${rel}: не подключён main.js`);
  if (!/assets\/icons\/favicon\.svg/.test(html)) errors.push(`${rel}: не подключён favicon`);

  if (/\b(undefined|NaN|null)\b/.test(html.replace(/<script[\s\S]*?<\/script>/gi, ''))) {
    warnings.push(`${rel}: в разметке встречается undefined/NaN/null`);
  }

  if (html.includes('src="./assets/')) {
    errors.push(`${rel}: найден путь src="./assets/", ожидается "../assets/" или "assets/"`);
  }

  const ids = new Set();
  const idRegex = /\sid="([^"]+)"/g;
  let idMatch;
  while ((idMatch = idRegex.exec(html))) {
    if (ids.has(idMatch[1])) errors.push(`${rel}: повторяется id="${idMatch[1]}"`);
    ids.add(idMatch[1]);
  }

  const referenceRegex = /\s(?:href|src)="([^"]+)"/g;
  let match;
  while ((match = referenceRegex.exec(html))) {
    const reference = match[1];
    checkReference(reference, file);
    if (reference.startsWith('#') && reference.length > 1 && !ids.has(reference.slice(1))) {
      errors.push(`${rel}: нет якоря ${reference}`);
    }
  }

  const withoutNoscript = html.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
  const emptyAlts = (withoutNoscript.match(/<img[^>]*\salt=""/gi) || []).length;
  if (emptyAlts) warnings.push(`${rel}: изображений с пустым alt — ${emptyAlts}`);
});

const requiredFiles = [
  'index.html',
  'about.html',
  'privacy.html',
  '404.html',
  'articles/index.html',
  'rss.xml',
  'sitemap.xml',
  'robots.txt',
  'js/main.js',
  'js/rss.js',
  'js/search-index.js',
  'css/style.css',
  'css/animations.css',
  'css/responsive.css',
  'assets/icons/favicon.svg',
  'assets/images/logo-og.jpg',
  '.htaccess'
];

requiredFiles.forEach((file) => {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Отсутствует обязательный файл ${file}`);
});

articles.forEach((article) => {
  const page = path.join(root, 'articles', `${article.slug}.html`);
  if (!fs.existsSync(page)) errors.push(`Нет страницы статьи ${article.slug}.html`);
  if (!fs.existsSync(path.join(root, article.cover))) errors.push(`Нет обложки ${article.cover}`);
  if (!Array.isArray(article.tags) || article.tags.length === 0) warnings.push(`Статья без тегов: ${article.slug}`);
});

config.categories.forEach((category) => {
  const page = path.join(root, 'category', `${category.slug}.html`);
  if (!fs.existsSync(page)) errors.push(`Нет страницы рубрики ${category.slug}.html`);
});

const rssPath = path.join(root, 'rss.xml');
if (fs.existsSync(rssPath)) {
  const rss = fs.readFileSync(rssPath, 'utf8');
  if (!/^<\?xml version="1\.0" encoding="UTF-8"\?>/.test(rss)) errors.push('rss.xml: неверный XML-заголовок');
  if (!rss.includes('<rss version="2.0"')) errors.push('rss.xml: нет корневого rss');
  if (!rss.includes('<content:encoded>')) errors.push('rss.xml: нет content:encoded');
  const items = (rss.match(/<item>/g) || []).length;
  if (items < 1) errors.push('rss.xml: нет item');
  if (items > 40) errors.push(`rss.xml: слишком много item (${items})`);
  if (/src="\.\.\/assets/.test(rss)) errors.push('rss.xml: относительные пути к картинкам');
}

const sitemapPath = path.join(root, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const locations = (sitemap.match(/<loc>/g) || []).length;
  const expected = 4 + config.categories.length + articles.length;
  if (locations !== expected) errors.push(`sitemap.xml: ожидалось ${expected} URL, найдено ${locations}`);
}

const searchPath = path.join(root, 'js/search-index.js');
if (fs.existsSync(searchPath)) {
  const search = fs.readFileSync(searchPath, 'utf8');
  const match = search.match(/window\.SITE_ARTICLES\s*=\s*([\s\S]+?);\s*$/);
  if (!match) {
    errors.push('search-index.js: не найден массив SITE_ARTICLES');
  } else {
    try {
      const index = JSON.parse(match[1]);
      if (index.length !== articles.length) errors.push(`search-index.js: ${index.length} записей вместо ${articles.length}`);
      index.forEach((entry) => {
        if (!entry.title || !entry.url || !entry.cover) errors.push('search-index.js: неполная запись');
      });
    } catch (error) {
      errors.push(`search-index.js: ошибка JSON — ${error.message}`);
    }
  }
}

if (!fs.existsSync(path.join(root, 'assets/images/logo-og.jpg'))) {
  errors.push('Нет дефолтного OG-изображения assets/images/logo-og.jpg');
}

const og = path.join(root, 'assets/images/logo-og.jpg');
if (fs.existsSync(og) && fs.statSync(og).size < 10000) {
  warnings.push('logo-og.jpg подозрительно маленький');
}

warnings.slice(0, 12).forEach((warning) => console.log(`  ! ${warning}`));
if (warnings.length > 12) console.log(`  ! … ещё предупреждений: ${warnings.length - 12}`);

if (errors.length) {
  console.error(`\nОшибок: ${errors.length}`);
  errors.forEach((error) => console.error(`  × ${error}`));
  process.exit(1);
}

console.log(`\nПроверка пройдена: ${htmlFiles.length} HTML-страниц, ${articles.length} статей, ${config.categories.length} рубрик.`);
if (warnings.length) console.log(`Предупреждений: ${warnings.length}`);
