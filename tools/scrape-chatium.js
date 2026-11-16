const fs = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://investmetod-2.chatium.ru/remont';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const CATEGORIES = [
  { slug: 'balkon', label: 'Балкон и лоджия' },
  { slug: 'budget', label: 'Бюджет ремонта' },
  { slug: 'elektrika', label: 'Электрика' },
  { slug: 'gostinaya', label: 'Гостиная' },
  { slug: 'kuhnya', label: 'Кухня' },
  { slug: 'materialy', label: 'Материалы' },
  { slug: 'santehnika', label: 'Сантехника' },
  { slug: 'vannaya', label: 'Ванная и санузел' }
];

const MONTHS = {
  января: 1, февраля: 2, марта: 3, апреля: 4, мая: 5, июня: 6,
  июля: 7, августа: 8, сентября: 9, октября: 10, ноября: 11, декабря: 12
};

const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : Infinity;
const onlyArg = args.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.split('=')[1] : null;
const FRESH = args.includes('--fresh');
const RAW_DIR = path.join(ROOT, 'content', 'chatium-raw');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url, tries = 4) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'ru-RU,ru;q=0.9' },
        signal: AbortSignal.timeout(40000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (i === tries) throw err;
      await sleep(600 * i);
    }
  }
}

async function getHtml(url, slug) {
  const file = path.join(RAW_DIR, `${slug}.html`);
  if (!FRESH) {
    try {
      const cached = await fs.readFile(file, 'utf8');
      if (cached.length > 1000) return cached;
    } catch {}
  }
  const html = await fetchText(url);
  await fs.mkdir(RAW_DIR, { recursive: true });
  await fs.writeFile(file, html, 'utf8');
  return html;
}

async function pool(items, limit, worker, delay = 120) {
  let index = 0;
  const results = new Array(items.length);
  async function run() {
    while (true) {
      const i = index++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
      await sleep(delay);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function decodeEntities(input) {
  if (!input) return '';
  const named = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    mdash: '—', ndash: '–', laquo: '«', raquo: '»', hellip: '…',
    copy: '©', reg: '®', trade: '™', deg: '°', plusmn: '±',
    times: '×', divide: '÷', frac12: '½', sup2: '²', sup3: '³',
    rarr: '→', larr: '←', harr: '↔', middot: '·', bull: '•'
  };
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z][a-z0-9]+);/gi, (m, name) => named[name.toLowerCase()] ?? m);
}

function stripTags(html) {
  return decodeEntities(String(html || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function parseDate(text) {
  if (!text) return null;
  const m = String(text).match(/(\d{1,2})\s+([а-яё]+)\s+(\d{4})/i);
  if (!m) return null;
  const month = MONTHS[m[2].toLowerCase()];
  if (!month) return null;
  const day = String(m[1]).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return `${m[3]}-${mm}-${day}T10:00:00+03:00`;
}

function imageExt(url) {
  const clean = url.split('?')[0].split('#')[0];
  const m = clean.match(/\.(jpe?g|png|webp|gif|avif)$/i);
  if (m) return m[1].toLowerCase().replace('jpeg', 'jpg');
  return 'jpg';
}

function absoluteImage(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return 'https:' + url;
  return 'https://fs.chatium.ru' + (url.startsWith('/') ? url : '/' + url);
}

async function downloadImage(url, dest, report) {
  try {
    await fs.access(dest);
    return true;
  } catch {}
  try {
    const res = await fetch(absoluteImage(url), {
      headers: { 'User-Agent': UA, Referer: BASE + '/' },
      signal: AbortSignal.timeout(60000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 200) throw new Error('too small');
    await fs.writeFile(dest, buf);
    return true;
  } catch (err) {
    report.imagesFailed.push({ url, dest, error: err.message });
    return false;
  }
}

function findMatchingDiv(html, divStart) {
  const re = /<div\b|<\/div>/gi;
  re.lastIndex = divStart;
  let depth = 0;
  let m;
  while ((m = re.exec(html))) {
    if (m[0].toLowerCase() === '<div') {
      depth += 1;
    } else {
      depth -= 1;
      if (depth === 0) {
        const innerStart = html.indexOf('>', divStart) + 1;
        return html.slice(innerStart, m.index);
      }
    }
  }
  return null;
}

function findMatchingSectionClose(html, sectionStart) {
  const re = /<section\b|<\/section>/gi;
  re.lastIndex = sectionStart;
  let depth = 0;
  let m;
  while ((m = re.exec(html))) {
    if (m[0].toLowerCase() === '<section') {
      depth += 1;
    } else {
      depth -= 1;
      if (depth === 0) return m.index;
    }
  }
  return -1;
}

function extractSectionInner(html, heading) {
  const re = new RegExp(`<(h2|p)\\b[^>]*>\\s*${heading}\\s*</\\1>`, 'i');
  const m = re.exec(html);
  if (!m) return null;
  const sectionStart = html.lastIndexOf('<section', m.index);
  if (sectionStart < 0) return null;
  const sectionClose = findMatchingSectionClose(html, sectionStart);
  if (sectionClose < 0) return null;
  const innerStart = html.indexOf('>', sectionStart) + 1;
  return html.slice(innerStart, sectionClose);
}

function extractExtraSections(html) {
  return {
    sources: extractSectionInner(html, 'Источники'),
    disclaimer: extractSectionInner(html, 'Дисклеймер')
  };
}

function extractRawBody(html) {
  const ah = html.indexOf('class="article-html');
  if (ah >= 0) {
    const aStart = html.indexOf('<article>', ah);
    if (aStart >= 0) {
      const aEnd = html.indexOf('</article>', aStart);
      if (aEnd > aStart) return html.slice(aStart + '<article>'.length, aEnd);
    }
  }

  const marker = html.search(/<div[^>]*data-srcloc="\/remont\/shared\/article-render\.tsx:\d+"/);
  if (marker >= 0) {
    const divStart = html.lastIndexOf('<div', marker);
    const inner = findMatchingDiv(html, divStart);
    if (inner && inner.trim().length > 80) return inner;
  }

  return null;
}

function cleanBody(body) {
  let html = body
    .replace(/\sdata-srcloc="[^"]*"/g, '')
    .replace(/\sdata-jsx-ugc[^=]*="[^"]*"/g, '');

  let prev;
  do {
    prev = html;
    html = html.replace(/<div\b[^>]*>\s*<\/div>/gi, '');
  } while (html !== prev);

  html = html.replace(/<\/?div\b[^>]*>/gi, '');
  html = html.replace(/\sclass="[^"]*"/gi, '');
  html = html.replace(/\sstyle="[^"]*"/gi, '');

  html = html.replace(/https?:\/\/investmetod-2\.chatium\.ru\/remont\/article\?slug=([^"&]+)/g,
    (_, s) => `${decodeURIComponent(s)}.html`);
  html = html.replace(/https?:\/\/investmetod-2\.chatium\.ru\/remont\/category\?slug=([^"&]+)/g,
    (_, s) => `../category/${decodeURIComponent(s)}.html`);
  html = html.replace(/https?:\/\/investmetod-2\.chatium\.ru\/remont\/about/g, '../about.html');
  html = html.replace(/https?:\/\/investmetod-2\.chatium\.ru\/remont(?=["'<\s])/g, '../index.html');
  html = html.replace(/\/remont\/article\?slug=([^"&]+)/g, (_, s) => `${decodeURIComponent(s)}.html`);
  html = html.replace(/\/remont\/category\?slug=([^"&]+)/g, (_, s) => `../category/${decodeURIComponent(s)}.html`);
  html = html.replace(/\/remont\/about/g, '../about.html');
  html = html.replace(/\/remont(?=["'<\s])/g, '../index.html');

  return html.trim();
}

function extractArticleSlugs(html) {
  const set = new Set();
  for (const m of html.matchAll(/article\?slug=([^"&]+)/g)) {
    if (m[1] === '1111111111111111111111111111') continue;
    set.add(decodeURIComponent(m[1]));
  }
  return [...set];
}

async function main() {
  const report = { startedAt: new Date().toISOString(), articles: [], imagesFailed: [], parseFailed: [], categories: {} };

  await fs.mkdir(path.join(ROOT, 'data'), { recursive: true });
  await fs.mkdir(path.join(ROOT, 'content', 'chatium'), { recursive: true });
  await fs.mkdir(path.join(ROOT, 'assets', 'images'), { recursive: true });

  console.log('Читаю рубрики...');
  const categoryPages = await pool(CATEGORIES, 3, async (cat) => {
    const html = await fetchText(`${BASE}/category?slug=${cat.slug}`);
    const slugs = extractArticleSlugs(html);
    return { ...cat, slugs };
  }, 150);

  const categoryBySlug = new Map();
  const order = [];
  for (const cat of categoryPages) {
    report.categories[cat.slug] = cat.slugs.length;
    console.log(`  ${cat.label}: ${cat.slugs.length}`);
    for (const slug of cat.slugs) {
      if (!categoryBySlug.has(slug)) {
        categoryBySlug.set(slug, cat);
        order.push(slug);
      }
    }
  }

  let slugs = order;
  if (ONLY) slugs = [ONLY];
  if (Number.isFinite(LIMIT)) slugs = slugs.slice(0, LIMIT);
  console.log(`Всего статей к обработке: ${slugs.length}`);

  const parsed = await pool(slugs, 4, async (slug, i) => {
    try {
      const url = `${BASE}/article?slug=${encodeURIComponent(slug)}`;
      const html = await getHtml(url, slug);
      const cat = categoryBySlug.get(slug) || CATEGORIES[0];

      const h1m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const title = stripTags(h1m ? h1m[1] : '');
      if (!title) throw new Error('нет H1');

      const descM = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
      const excerpt = stripTags(descM ? descM[1] : '');

      const coverM = html.match(/<img\s+src="([^"]+)"[^>]*class="aspect-video[^"]*"/i)
        || html.match(/<img\s+src="([^"]+)"\s+alt="[^"]*"\s+class="[^"]*aspect-video/i);
      const coverUrl = coverM ? coverM[1] : null;

      const pubM = html.match(/Опубликовано:\s*([^<·]+)/i);
      const updM = html.match(/Обновлено:\s*([^<·]+)/i);
      const date = parseDate(pubM && pubM[1]) || parseDate(updM && updM[1]);
      const updated = parseDate(updM && updM[1]);

      const readM = html.match(/fa-clock[^>]*><\/i>\s*([^<]+)/i);
      const readRaw = readM ? stripTags(readM[1]) : '';
      const readTime = readRaw ? readRaw.replace(/\s*минут[а-я]*/i, ' мин').trim() : '5 мин';

      const authorM = html.match(/<p\s+class="mt-0\.5[^"]*"[^>]*>([^<]+)<\/p>/i);
      const author = authorM ? stripTags(authorM[1]) : '';

      const extras = extractExtraSections(html);
      const rawBody = extractRawBody(html);
      if (!rawBody) throw new Error('не найден текст статьи');
      let body = cleanBody(rawBody);

      if (!body || body.length < 80) throw new Error('пустой текст');

      const imageMap = new Map();
      const imgs = [...body.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/gi)];
      let n = 0;
      for (const m of imgs) {
        const src = m[1];
        if (!src || imageMap.has(src)) continue;
        n += 1;
        const file = `${slug}-${n}.${imageExt(src)}`;
        imageMap.set(src, file);
        const ok = await downloadImage(src, path.join(ROOT, 'assets', 'images', file), report);
        if (!ok) imageMap.delete(src);
      }
      body = body.replace(/<img\b([^>]*?)\bsrc="([^"]+)"([^>]*)>/gi, (full, pre, src, post) => {
        const file = imageMap.get(src);
        if (!file) return full;
        return `<img${pre}src="../assets/images/${file}"${post}>`;
      });

      let coverFile = null;
      if (coverUrl) {
        coverFile = `${slug}-cover.${imageExt(coverUrl)}`;
        const ok = await downloadImage(coverUrl, path.join(ROOT, 'assets', 'images', coverFile), report);
        if (!ok) coverFile = null;
      }

      if (!coverFile) {
        const bodyCover = body.match(/<img[^>]*src="\.\.\/assets\/images\/([^"]+)"/i);
        if (bodyCover) coverFile = bodyCover[1];
      }

      const firstP = body.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      const lead = firstP ? stripTags(firstP[1]) : excerpt;

      const article = {
        slug,
        title,
        category: cat.slug,
        tags: [],
        date: date || null,
        updated: updated || null,
        readTime,
        author: author || null,
        excerpt,
        lead,
        cover: coverFile ? `assets/images/${coverFile}` : null,
        coverAlt: title,
        content: body,
        sources: extras.sources ? cleanBody(extras.sources) : null,
        disclaimer: extras.disclaimer ? cleanBody(extras.disclaimer) : null,
        sourceUrl: url
      };

      await fs.writeFile(
        path.join(ROOT, 'content', 'chatium', `${slug}.json`),
        JSON.stringify(article, null, 2),
        'utf8'
      );

      console.log(`  [${i + 1}/${slugs.length}] ${title}`);
      return article;
    } catch (err) {
      console.error(`  ! ${slug}: ${err.message}`);
      report.parseFailed.push({ slug, error: err.message });
      return null;
    }
  }, 120);

  const articles = parsed.filter(Boolean);
  articles.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  articles.forEach((a, i) => { a.id = i + 1; });

  await fs.writeFile(path.join(ROOT, 'data', 'articles.json'), JSON.stringify(articles, null, 2), 'utf8');
  report.finishedAt = new Date().toISOString();
  report.total = articles.length;
  await fs.writeFile(path.join(ROOT, 'content', 'chatium-report.json'), JSON.stringify(report, null, 2), 'utf8');

  console.log(`\nГотово: ${articles.length} статей, картинок с ошибкой: ${report.imagesFailed.length}, ошибок парсинга: ${report.parseFailed.length}`);
  console.log(`data/articles.json и content/chatium/*.json сохранены`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { extractRawBody, extractExtraSections, cleanBody };
