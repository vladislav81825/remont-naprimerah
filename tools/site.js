/* ============================================================
   Общие данные и шаблоны сайта «Ремонт на примерах»
   ============================================================ */

'use strict';

const config = require('../data/site-config.json');

const SITE = {
  url: String(config.url || '').replace(/\/+$/, ''),
  name: config.brand,
  shortName: config.shortBrand,
  tagline: config.tagline,
  description: config.description,
  locale: config.locale || 'ru_RU',
  email: config.email || '',
  socials: Array.isArray(config.socials) ? config.socials : [],
  yandexMetrika: config.yandexMetrika || '',
  basePath: config.basePath || '/'
};

const NAV_LABELS = {
  balkon: 'Балкон',
  budget: 'Сметы',
  elektrika: 'Электрика',
  gostinaya: 'Гостиная',
  kuhnya: 'Кухня',
  materialy: 'Материалы',
  santehnika: 'Сантехника',
  vannaya: 'Ванная'
};

const CATEGORIES = config.categories.map((category) => ({
  slug: category.slug,
  name: category.label,
  title: category.label,
  navLabel: NAV_LABELS[category.slug] || category.label,
  desc: category.description,
  tagline: category.tagline,
  accent: category.color,
  icon: category.icon
}));

const ICONS = {
  logo: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 34V16.5L20 6l14 10.5V34"/><path d="M13 34V23h14v11"/><path d="M20 6v28"/><path d="M6 16.5h28"/><path d="M2 34h36"/><path d="M9 20v6M31 20v6"/></svg>`,
  balkon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21V9h16v12"/><path d="M4 13h16"/><path d="M8 21v-8M12 21v-8M16 21v-8"/><path d="M2 21h20"/><path d="M7 9V5h10v4"/></svg>`,
  budget: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><rect x="8" y="6" width="8" height="3" rx=".5"/><path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/></svg>`,
  elektrika: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>`,
  gostinaya: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><path d="M3 13a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5H3v-5Z"/><path d="M6 18v3M18 18v3"/><path d="M7 13v2h10v-2"/></svg>`,
  kuhnya: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 10h14v10H5z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/><path d="M5 14h14"/><path d="M8 5h8"/><path d="M9 17h6"/></svg>`,
  materialy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/></svg>`,
  santehnika: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3s5 6 5 10a5 5 0 0 1-10 0c0-4 5-10 5-10Z"/><path d="M4 21h16"/><path d="M7 18h10"/></svg>`,
  vannaya: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-4Z"/><path d="M6 12V6a2 2 0 0 1 4 0"/><path d="M6 20l-1 2M18 20l1 2"/><path d="M9 10V8M13 10V8"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15"/><path d="m13 6 6 6-6 6"/></svg>`,
  arrowUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="m6 11 6-6 6 6"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4 12 5 5L20 6"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>`,
  rss: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1.4" fill="currentColor" stroke="none"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  filter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>`,
  vk: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.8 17.9c-6.1 0-9.6-4.2-9.7-11.2h3c.1 5.2 2.4 7.4 4.2 7.9V6.7h2.9v4.4c1.7-.2 3.5-2.2 4.1-4.4h2.9c-.5 2.8-2.4 4.8-3.7 5.6 1.3.6 3.5 2.3 4.3 5.6h-3.2c-.6-1.9-2.1-3.4-4.4-3.6v3.6h-.4Z"/></svg>`,
  tg: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.6 4.2 3.4 11.3c-1.2.5-1.2 1.2-.2 1.5l4.6 1.4 1.8 5.4c.2.6.4.8 1 .8.5 0 .7-.2 1-.5l2.2-2.1 4.5 3.3c.8.5 1.4.2 1.6-.8l3-13.8c.3-1.2-.4-1.8-1.3-1.3Zm-3.2 3.2-6.4 5.8-.2 2.8-1.3-3.8 8-5.4c.4-.3.7-.1-.1.6Z"/></svg>`,
  pinterest: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21V5h4.3a4.5 4.5 0 0 1 0 9H9"/><circle cx="12" cy="12" r="10" opacity=".35"/></svg>`
};

function icon(name, className) {
  const svg = ICONS[name] || ICONS.elektrika;
  return className ? svg.replace('<svg ', `<svg class="${className}" `) : svg;
}

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function articleHref(slug, depth) {
  return `${depth ? '../' : ''}articles/${slug}.html`;
}

function asset(filePath, depth) {
  return `${depth ? '../' : ''}${String(filePath).replace(/^\/+/, '')}`;
}

function categoryBySlug(slug) {
  return CATEGORIES.find((category) => category.slug === slug) || CATEGORIES[0];
}

function initials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

function authorFor(article) {
  const raw = String(article.author || '').trim();
  const parts = raw.split('—');
  const name = (parts.shift() || '').trim() || 'Редакция «Ремонта на примерах»';
  const role = parts.join('—').trim() || 'Автор практических разборов';
  return {
    name,
    role,
    initials: initials(name)
  };
}

function authorProfiles(articles) {
  const map = new Map();
  for (const article of articles) {
    const author = authorFor(article);
    if (!map.has(author.name)) {
      map.set(author.name, {
        ...author,
        categories: new Set(),
        count: 0
      });
    }
    const profile = map.get(author.name);
    profile.categories.add(article.category);
    profile.count += 1;
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function formatDateShort(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getUTCDate()).padStart(2, '0')}.${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function formatDateDot(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getUTCDate()).padStart(2, '0')}.${String(date.getUTCMonth() + 1).padStart(2, '0')}.${date.getUTCFullYear()}`;
}

function plural(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function socialLinks(className) {
  return SITE.socials.map((social) => {
    const type = social.type || social.icon || '';
    const svg = ICONS[type];
    if (!svg || !social.url) return '';
    const label = social.label || type;
    return `<a class="${className || ''}" href="${esc(social.url)}" target="_blank" rel="noopener" aria-label="${esc(label)}">${svg}</a>`;
  }).filter(Boolean).join('\n');
}

/* ---------- Шапка / меню / поиск ---------- */

function header(depth, active) {
  const p = depth ? '../' : '';
  return `
<a class="skip-link" href="#main">Перейти к содержимому</a>
<header class="site-header" data-header>
  <div class="header-top">
    <div class="container header-top__inner">
      <span class="header-top__label">Практический журнал о ремонте</span>
      <div class="header-top__meta">
        <time datetime="2026-11-14" data-today>14 ноября 2026</time>
        <span class="dot" aria-hidden="true"></span>
        <a href="${p}rss.xml" target="_blank" rel="noopener">RSS</a>
      </div>
    </div>
  </div>
  <div class="container header-inner">
    <a class="logo" href="${p}index.html" aria-label="${esc(SITE.name)} — на главную">
      <span class="logo__mark">${ICONS.logo}</span>
      <span class="logo__text"><span class="logo__name">${esc(SITE.shortName)}</span><span class="logo__sub">на примерах</span></span>
    </a>
    <nav class="main-nav" aria-label="Рубрики">
      ${CATEGORIES.map((category) => `<a href="${p}category/${category.slug}.html"${active === category.slug ? ' class="is-active" aria-current="page"' : ''}>${esc(category.navLabel)}</a>`).join('\n      ')}
    </nav>
    <div class="header-actions">
      <button class="icon-btn" type="button" data-search-open aria-label="Открыть поиск" title="Поиск (Ctrl+K)">
        ${ICONS.search}
      </button>
      <a class="btn btn--ghost btn--small header-cta" href="${p}articles/index.html">Архив</a>
      <button class="burger" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mobileMenu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>
<div class="mobile-menu" id="mobileMenu" aria-hidden="true">
  <button class="mobile-menu__close" type="button" data-mobile-close aria-label="Закрыть меню">
    ${ICONS.close}
  </button>
  <nav class="mobile-menu__nav" aria-label="Мобильная навигация">
    ${CATEGORIES.map((category) => `<a href="${p}category/${category.slug}.html">${esc(category.name)}<span>${esc(category.tagline)}</span></a>`).join('\n    ')}
    <a href="${p}articles/index.html">Все статьи<span>Архив материалов</span></a>
    <a href="${p}about.html">О проекте<span>Редакция и авторы</span></a>
  </nav>
  <div class="mobile-menu__foot">
    <a class="btn btn--primary" href="${p}rss.xml" target="_blank" rel="noopener">${ICONS.rss} Подписаться на RSS</a>
  </div>
</div>
<div class="search-modal" data-search-modal role="dialog" aria-modal="true" aria-hidden="true" aria-label="Поиск по сайту">
  <div class="search-dialog">
    <div class="search-field">
      ${ICONS.search}
      <input type="search" data-search-input placeholder="Найти статью, рубрику или тему…" autocomplete="off" aria-label="Поисковый запрос">
      <button class="search-close" type="button" data-search-close>ESC</button>
    </div>
    <div class="search-results" data-search-results>
      <p class="search-hint">Начните вводить запрос — например, «смета», «плитка» или «розетки».</p>
    </div>
  </div>
</div>`;
}

/* ---------- Подвал ---------- */

function footer(depth) {
  const p = depth ? '../' : '';
  const socials = socialLinks('socials__link');
  return `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="logo logo--footer" href="${p}index.html" aria-label="${esc(SITE.name)} — на главную">
          <span class="logo__mark">${ICONS.logo}</span>
          <span class="logo__text"><span class="logo__name">${esc(SITE.shortName)}</span><span class="logo__sub">на примерах</span></span>
        </a>
        <p>Практический журнал о ремонте квартиры: технологии, планировки, сметы и ошибки, которые дорого стоят. Разбираем на примерах, а не пересказываем форумы.</p>
        ${socials ? `<div class="socials">${socials}<a class="socials__link" href="${p}rss.xml" target="_blank" rel="noopener" aria-label="RSS-лента">${ICONS.rss}</a></div>` : `<div class="socials"><a class="socials__link" href="${p}rss.xml" target="_blank" rel="noopener" aria-label="RSS-лента">${ICONS.rss}</a></div>`}
      </div>
      <div class="footer-col">
        <h3>Рубрики</h3>
        <ul>
          ${CATEGORIES.slice(0, 4).map((category) => `<li><a href="${p}category/${category.slug}.html">${esc(category.name)}</a></li>`).join('\n          ')}
        </ul>
      </div>
      <div class="footer-col">
        <h3>&nbsp;</h3>
        <ul>
          ${CATEGORIES.slice(4).map((category) => `<li><a href="${p}category/${category.slug}.html">${esc(category.name)}</a></li>`).join('\n          ')}
        </ul>
      </div>
      <div class="footer-col">
        <h3>Проект</h3>
        <ul>
          <li><a href="${p}articles/index.html">Все статьи</a></li>
          <li><a href="${p}about.html">О проекте</a></li>
          <li><a href="${p}rss.xml" target="_blank" rel="noopener">RSS-лента</a></li>
          <li><a href="${p}privacy.html">Политика конфиденциальности</a></li>
          ${SITE.email ? `<li><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></li>` : ''}
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© <span data-year>2026</span> «${esc(SITE.name)}». Все права защищены.</span>
      <div class="footer-bottom__links">
        <a href="${p}privacy.html">Конфиденциальность</a>
        <a href="${p}rss.xml" target="_blank" rel="noopener">RSS</a>
        <a href="${p}about.html">О проекте</a>
      </div>
    </div>
    <p class="footer-disclaimer">Материалы носят информационный характер. Перед работами с электрикой, газом и несущими конструкциями сверяйтесь с проектом и действующими нормами.</p>
  </div>
</footer>
<button class="back-to-top" type="button" aria-label="Наверх">${ICONS.arrowUp}</button>`;
}

/* ---------- Карточки ---------- */

function card(article, depth, options) {
  const opts = options || {};
  const category = categoryBySlug(article.category);
  const href = articleHref(article.slug, depth);
  const tags = (article.tags || []).map((tag) => tag.toLowerCase()).join('|');
  return `
<article class="card" data-article data-tags="${esc(tags)}" data-cat="${esc(article.category)}" style="--cat:${category.accent}"${opts.reveal ? ' data-reveal' : ''}>
  <a class="card__media" href="${href}" aria-label="${esc(article.title)}">
    <img src="${asset(article.cover, depth)}" alt="${esc(article.coverAlt || article.title)}" loading="lazy" width="1200" height="675">
    <span class="card__cat">${esc(category.name)}</span>
  </a>
  <div class="card__body">
    <div class="card__meta">
      <span>${formatDateShort(article.date)}</span>
      <span class="dot" aria-hidden="true"></span>
      <span>${esc(article.readTime || '')}</span>
    </div>
    <h3 class="card__title"><a href="${href}">${esc(article.title)}</a></h3>
    <p class="card__excerpt">${esc(article.excerpt)}</p>
    <span class="card__more">Читать разбор ${ICONS.arrow}</span>
  </div>
</article>`;
}

function categoryCard(category, count, depth, index) {
  const num = String((index || 0) + 1).padStart(2, '0');
  return `
<a class="cat-card" href="${depth ? '../' : ''}category/${category.slug}.html" style="--cat:${category.accent}" data-reveal>
  <span class="cat-card__top">
    <span class="cat-card__num">${num}</span>
    <span class="cat-card__icon">${icon(category.icon)}</span>
  </span>
  <span class="cat-card__name">${esc(category.name)}</span>
  <span class="cat-card__desc">${esc(category.tagline)}</span>
  <span class="cat-card__foot"><span>${count} ${plural(count, 'материал', 'материала', 'материалов')}</span><span class="cat-card__arrow" aria-hidden="true">${ICONS.arrow}</span></span>
</a>`;
}

/* ---------- Каркас страницы ---------- */

function layout(options) {
  const depth = options.depth || 0;
  const p = depth ? '../' : '';
  const canonical = `${SITE.url}/${String(options.canonicalPath || '').replace(/^\/+/, '')}`;
  const ogImage = `${SITE.url}/${String(options.ogImage || 'assets/images/logo-og.jpg').replace(/^\/+/, '')}`;
  const fullTitle = options.fullTitle || `${options.title} — ${SITE.name}`;
  const metrika = SITE.yandexMetrika ? `
<script>
  (function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * new Date();
    for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
    k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
  ym(${JSON.stringify(SITE.yandexMetrika)}, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/${esc(SITE.yandexMetrika)}" style="position:absolute; left:-9999px;" alt=""></div></noscript>` : '';

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(fullTitle)}</title>
  <meta name="description" content="${esc(options.description || SITE.description)}">
  <meta name="keywords" content="${esc(options.keywords || 'ремонт квартиры, ремонт своими руками, смета ремонта, планировка, электрика, сантехника, плитка, материалы')}">
  <meta name="author" content="${esc(options.author || SITE.name)}">
  <meta name="robots" content="${esc(options.robots || 'index, follow')}">
  <meta name="theme-color" content="#f5f1e9">
  <link rel="canonical" href="${esc(canonical)}">
  <link rel="icon" href="${p}assets/icons/favicon.svg" type="image/svg+xml">
  <link rel="alternate" type="application/rss+xml" title="${esc(SITE.name)} — RSS" href="${p}rss.xml">

  <meta property="og:type" content="${esc(options.ogType || 'website')}">
  <meta property="og:site_name" content="${esc(SITE.name)}">
  <meta property="og:title" content="${esc(options.title)}">
  <meta property="og:description" content="${esc(options.description || SITE.description)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="${esc(ogImage)}">
  <meta property="og:locale" content="${esc(SITE.locale)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(options.title)}">
  <meta name="twitter:description" content="${esc(options.description || SITE.description)}">
  <meta name="twitter:image" content="${esc(ogImage)}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,500;0,7..72,600;1,7..72,400;1,7..72,500&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="${p}css/style.css">
  <link rel="stylesheet" href="${p}css/animations.css">
  <link rel="stylesheet" href="${p}css/responsive.css">
  ${options.extraHead || ''}
</head>
<body data-depth="${depth ? 'sub' : 'root'}"${options.bodyClass ? ` class="${options.bodyClass}"` : ''}>
${header(depth, options.active || '')}
<main id="main">
${options.content}
</main>
${footer(depth)}
<script src="${p}js/search-index.js" defer></script>
<script src="${p}js/main.js" defer></script>${metrika}
</body>
</html>`;
}

module.exports = {
  SITE,
  CATEGORIES,
  ICONS,
  icon,
  esc,
  asset,
  articleHref,
  categoryBySlug,
  authorFor,
  authorProfiles,
  formatDate,
  formatDateShort,
  formatDateDot,
  plural,
  socialLinks,
  header,
  footer,
  card,
  categoryCard,
  layout
};
