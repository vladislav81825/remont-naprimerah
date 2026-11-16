/* ============================================================
   Генератор статических страниц «Ремонт на примерах»
   Запуск: node tools/generate.js
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const {
  SITE, CATEGORIES, ICONS, icon, esc, asset, articleHref, categoryBySlug,
  authorFor, authorProfiles, formatDate, formatDateShort, formatDateDot,
  plural, card, categoryCard, layout
} = require('./site');
const buildRss = require('../js/rss');

const root = path.resolve(__dirname, '..');
const articles = JSON.parse(fs.readFileSync(path.join(root, 'data/articles.json'), 'utf8'));
const byDate = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));
const byCategory = (slug) => byDate.filter((article) => article.category === slug);
const countByCat = (slug) => articles.filter((article) => article.category === slug).length;
const authors = authorProfiles(articles);

const write = (file, content) => {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
  console.log('  ✓', file);
};

/* ============================================================
   ПОДГОТОВКА HTML СТАТЬИ
   ============================================================ */

function stripTags(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeEntities(text) {
  return String(text || '')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function plainText(html) {
  return decodeEntities(stripTags(html)).replace(/\s+([.,;:!?])/g, '$1').trim();
}

function prepareContent(article) {
  let html = String(article.content || '');
  const fallbackAlt = `${article.title} — иллюстрация`;

  html = html.replace(/<img([^>]*?)\salt=""([^>]*)>/gi, (match, before, after) => {
    return `<img${before} alt="${esc(fallbackAlt)}"${after}>`;
  });
  html = html.replace(/<img(?![^>]*\bloading=)([^>]*)>/gi, '<img loading="lazy"$1>');
  html = html.replace(/<img(?![^>]*\bdecoding=)([^>]*)>/gi, '<img decoding="async"$1>');
  html = html.replace(/<p>\s*<\/p>/gi, '');
  html = html.replace(/<table>/gi, '<div class="table-wrap"><table>');
  html = html.replace(/<\/table>/gi, '</table></div>');

  html = html.replace(
    /^\s*<p>\s*<strong>Коротко:<\/strong>\s*([\s\S]*?)<\/p>/i,
    (match, inner) => `<div class="article-summary"><span class="article-summary__label">Коротко</span><p>${inner}</p></div>`
  );

  const toc = [];
  html = html.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/gi, (match, attrs, inner) => {
    const id = `section-${toc.length + 1}`;
    toc.push({
      id,
      num: String(toc.length + 1).padStart(2, '0'),
      text: plainText(inner)
    });
    return `<h2${attrs || ''} id="${id}">${inner}</h2>`;
  });

  return { html, toc };
}

function extractFaq(html) {
  const faq = [];
  String(html || '').replace(
    /<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>\s*([\s\S]*?)<\/details>/gi,
    (match, question, answer) => {
      const q = plainText(question);
      const a = plainText(answer);
      if (q && a) faq.push({ q, a });
      return match;
    }
  );
  return faq;
}

/* ============================================================
   ГЛАВНАЯ
   ============================================================ */

const featured = byDate[0];
const budgetArticles = byCategory('budget');
const estimateArticles = budgetArticles.slice(0, 6);

function heroSheet(article) {
  const category = categoryBySlug(article.category);
  return `
      <a class="hero-sheet" href="${articleHref(article.slug, 0)}" style="--cat:${category.accent}">
        <span class="hero-sheet__frame" aria-hidden="true"></span>
        <span class="hero-sheet__top">
          <span>Чертёж № 01</span>
          <span>${esc(category.name)}</span>
        </span>
        <span class="hero-sheet__media">
          <img src="${asset(article.cover, 0)}" alt="${esc(article.coverAlt || article.title)}" width="1200" height="675" fetchpriority="high">
          <span class="hero-sheet__cat">${esc(category.name)}</span>
        </span>
        <span class="hero-sheet__body">
          <span class="hero-sheet__title">${esc(article.title)}</span>
          <span class="hero-sheet__meta">${formatDate(article.date)} · ${esc(article.readTime || '')}</span>
        </span>
        <span class="hero-sheet__bottom">
          <span>Ремонт на примерах</span>
          <span>${esc(article.tags.slice(0, 2).join(' · '))}</span>
        </span>
      </a>`;
}

function heroFloat(article, variant) {
  const category = categoryBySlug(article.category);
  return `
      <a class="hero-float hero-float--${variant}" href="${articleHref(article.slug, 0)}" style="--cat:${category.accent}">
        <img src="${asset(article.cover, 0)}" alt="${esc(article.coverAlt || article.title)}" loading="lazy" width="1200" height="675">
        <span class="hero-float__body">
          <span class="hero-float__cat">${esc(category.name)}</span>
          <span class="hero-float__title">${esc(article.title)}</span>
        </span>
      </a>`;
}

function freshRow(article, index) {
  const category = categoryBySlug(article.category);
  return `
        <a class="fresh-row" href="${articleHref(article.slug, 0)}" style="--cat:${category.accent}">
          <span class="fresh-row__num">${String(index + 2).padStart(2, '0')}</span>
          <span class="fresh-row__body">
            <span class="fresh-row__cat">${esc(category.name)}</span>
            <span class="fresh-row__title">${esc(article.title)}</span>
          </span>
          <span class="fresh-row__date">${formatDateShort(article.date)}</span>
        </a>`;
}

function estimateRow(article, index) {
  const category = categoryBySlug(article.category);
  return `
        <a class="estimate-row" href="${articleHref(article.slug, 0)}">
          <span class="estimate-row__num">${String(index + 1).padStart(2, '0')}</span>
          <span class="estimate-row__body">
            <span class="estimate-row__title">${esc(article.title)}</span>
            <span class="estimate-row__meta">${esc(article.readTime || '')} · ${formatDate(article.date)}</span>
          </span>
          <span class="estimate-row__arrow" aria-hidden="true">${ICONS.arrow}</span>
        </a>`;
}

const homeContent = `
<section class="hero" aria-labelledby="hero-title">
  <div class="hero__bg" aria-hidden="true"></div>
  <div class="container hero__grid">
    <div class="hero__content">
      <span class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>Практический журнал о ремонте</span>
      <h1 class="hero__title" id="hero-title">Ремонт<br><em>без переделок</em></h1>
      <p class="hero__sub">Разбираем технологии, планировки и сметы на реальных примерах. Показываем, где начинаются дорогие ошибки, и как их не допустить.</p>
      <div class="hero__actions">
        <a class="btn btn--primary" href="articles/index.html">Смотреть разборы ${ICONS.arrow}</a>
        <a class="btn btn--ghost" href="category/budget.html">Сметы 2026</a>
      </div>
      <dl class="hero__stats">
        <div class="hero-stat"><dt>${articles.length}</dt><dd>разборов в архиве</dd></div>
        <div class="hero-stat"><dt>${CATEGORIES.length}</dt><dd>рубрик о ремонте</dd></div>
        <div class="hero-stat"><dt>${budgetArticles.length}</dt><dd>смет на 2026 год</dd></div>
      </dl>
    </div>
    <div class="hero__visual" aria-hidden="true">
      <span class="hero__dim">${articles.length} разборов · 8 рубрик</span>
      ${heroSheet(featured)}
      ${heroFloat(byDate[3], 'one')}
      ${heroFloat(byDate[6], 'two')}
      <span class="hero__stamp"><span>Сметы</span><strong>2026</strong></span>
      <span class="hero__note">Чертёж № 01 · практический разбор</span>
    </div>
  </div>
</section>

<div class="topic-strip" aria-hidden="true">
  <div class="topic-strip__track">
    ${['Сметы 2026', 'Утепление', 'Гидроизоляция', 'Плитка', 'Электрика', 'Сантехника', 'Планировка', 'Материалы', 'Балконы', 'Кухни', 'Ванные', 'Гостиные'].map((topic) => `<span>${topic}</span>`).join('')}
    ${['Сметы 2026', 'Утепление', 'Гидроизоляция', 'Плитка', 'Электрика', 'Сантехника', 'Планировка', 'Материалы', 'Балконы', 'Кухни', 'Ванные', 'Гостиные'].map((topic) => `<span>${topic}</span>`).join('')}
  </div>
</div>

<section class="section" id="fresh">
  <div class="container">
    <div class="section-head" data-reveal>
      <div class="section-head__text">
        <span class="eyebrow">Свежие разборы</span>
        <h2>Что разобрали <em>на примерах</em></h2>
        <p>Новые материалы о технологиях, узлах и решениях, которые проверены практикой. Без обзоров «всё о ремонте за 5 минут».</p>
      </div>
      <a class="text-link" href="articles/index.html">Все ${articles.length} материалов ${ICONS.arrow}</a>
    </div>

    <div class="fresh-grid">
      <a class="feature-card" href="${articleHref(featured.slug, 0)}" data-reveal>
        <span class="feature-card__media">
          <img src="${asset(featured.cover, 0)}" alt="${esc(featured.coverAlt || featured.title)}" width="1200" height="675">
          <span class="feature-card__cat">${esc(categoryBySlug(featured.category).name)}</span>
          <span class="feature-card__num">01</span>
        </span>
        <span class="feature-card__body">
          <span class="feature-card__meta">${formatDate(featured.date)} <span class="dot"></span> ${esc(featured.readTime || '')}</span>
          <span class="feature-card__title">${esc(featured.title)}</span>
          <span class="feature-card__excerpt">${esc(featured.excerpt)}</span>
          <span class="feature-card__more">Читать материал ${ICONS.arrow}</span>
        </span>
      </a>

      <div class="fresh-list" data-reveal>
        <div class="fresh-list__top">
          <span class="fresh-list__label">Свежий номер</span>
          <span class="fresh-list__date">${formatDateDot(featured.date)}</span>
        </div>
        ${byDate.slice(1, 6).map((article, index) => freshRow(article, index)).join('')}
        <a class="fresh-list__all" href="articles/index.html">Смотреть весь архив ${ICONS.arrow}</a>
      </div>
    </div>

    <div class="articles-grid articles-grid--home" data-reveal-group>
      ${byDate.slice(6, 10).map((article) => card(article, 0, { reveal: true })).join('\n')}
    </div>
  </div>
</section>

<section class="section section--tight" id="categories">
  <div class="container">
    <div class="section-head" data-reveal>
      <div class="section-head__text">
        <span class="eyebrow">Навигация по ремонту</span>
        <h2>Восемь рубрик — <em>один порядок</em></h2>
        <p>От черновых работ до финишной отделки. Выберите тему, чтобы не читать всё подряд.</p>
      </div>
      <a class="text-link" href="articles/index.html">Смотреть всё ${ICONS.arrow}</a>
    </div>
    <div class="category-grid" data-reveal-group>
      ${CATEGORIES.map((category, index) => categoryCard(category, countByCat(category.slug), 0, index)).join('\n')}
    </div>
  </div>
</section>

<section class="section section--dark" id="estimates">
  <div class="container">
    <div class="estimate-head" data-reveal>
      <div>
        <span class="eyebrow">Сметы 2026</span>
        <h2>Сколько это стоит <em>на самом деле</em></h2>
        <p>${budgetArticles.length} разборов бюджета: расценки по этапам, скрытые доплаты и места, где экономить безопасно.</p>
      </div>
      <div class="estimate-badge" aria-hidden="true">
        <strong>${budgetArticles.length}</strong>
        <span>смет<br>2026</span>
      </div>
    </div>
    <div class="estimate-grid" data-reveal-group>
      ${estimateArticles.map((article, index) => estimateRow(article, index)).join('')}
    </div>
    <div class="estimate-foot" data-reveal>
      <a class="btn btn--light" href="category/budget.html">Все сметы и расценки ${ICONS.arrow}</a>
      <span class="estimate-foot__note">Обновляем цифры по мере выхода новых расценок</span>
    </div>
  </div>
</section>

<section class="section" id="about-teaser">
  <div class="container">
    <div class="about-teaser">
      <div class="about-teaser__text" data-reveal>
        <span class="eyebrow">Редакция</span>
        <h2>Каждый разбор — <em>проверенная технология</em>, а не пересказ форумов</h2>
        <p>«Ремонт на примерах» пишут практикующие мастера: электрики, сантехники, плиточники, сметчики и дизайнеры. Мы объясняем, почему решение работает, сколько оно стоит и где начинаются переделки.</p>
        <ol class="principles">
          <li><span>01</span><div><b>Сначала узел, потом декор</b><p>Разбираем конструкцию и последовательность работ, а не только красивую картинку.</p></div></li>
          <li><span>02</span><div><b>Цифры вместо обещаний</b><p>Расценки, размеры, допуски и запасы материалов — с диапазонами и оговорками.</p></div></li>
          <li><span>03</span><div><b>Ошибки — часть материала</b><p>Показываем, что обычно идёт не так и сколько стоит исправление.</p></div></li>
        </ol>
        <div class="hero__actions">
          <a class="btn btn--ghost" href="about.html">О проекте и авторах ${ICONS.arrow}</a>
        </div>
      </div>
      <aside class="about-teaser__side" data-reveal>
        <div class="author-mini">
          <div class="author-mini__top">
            <span class="author-mini__label">Авторы</span>
            <span class="author-mini__count">${authors.length}</span>
          </div>
          <p>Практикующие мастера и специалисты с опытом от 9 до 16 лет.</p>
          <div class="author-mini__list">
            ${authors.slice(0, 4).map((author) => `<span><b>${esc(author.name)}</b><i>${esc(author.role.split(',')[0])}</i></span>`).join('')}
          </div>
        </div>
        <div class="rss-card">
          <span class="rss-card__icon">${ICONS.rss}</span>
          <h3>RSS-лента</h3>
          <p>Все новые разборы в одном потоке. Удобно для читалок и тематических площадок.</p>
          <button class="copy-btn" type="button" data-copy-rss>${ICONS.copy} Скопировать ссылку</button>
          <a class="text-link" href="rss.xml" target="_blank" rel="noopener">Открыть rss.xml ${ICONS.arrow}</a>
        </div>
      </aside>
    </div>
  </div>
</section>`;

write('index.html', layout({
  depth: 0,
  title: 'Ремонт на примерах — практический журнал о ремонте квартиры',
  fullTitle: 'Ремонт на примерах — практический журнал о ремонте квартиры',
  description: SITE.description,
  canonicalPath: '',
  ogImage: featured.cover,
  content: homeContent,
  extraHead: `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: `${SITE.url}/`,
    description: SITE.description,
    inLanguage: 'ru',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE.url}/articles/index.html?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  })}</script>`
}));

/* ============================================================
   СТРАНИЦЫ СТАТЕЙ
   ============================================================ */

function relatedFor(article) {
  const same = byCategory(article.category).filter((item) => item.slug !== article.slug);
  const other = byDate.filter((item) => item.slug !== article.slug && item.category !== article.category);
  return [...same, ...other].slice(0, 3);
}

function neighbours(article) {
  const list = byCategory(article.category);
  const index = list.findIndex((item) => item.slug === article.slug);
  return {
    prev: index > 0 ? list[index - 1] : null,
    next: index >= 0 && index < list.length - 1 ? list[index + 1] : null
  };
}

const shareButtons = `
  <button class="share-btn" type="button" data-share="vk" aria-label="Поделиться во ВКонтакте">${ICONS.vk}</button>
  <button class="share-btn" type="button" data-share="tg" aria-label="Поделиться в Telegram">${ICONS.tg}</button>
  <button class="share-btn" type="button" data-share="copy" aria-label="Скопировать ссылку">${ICONS.copy}</button>`;

function tocBox(toc) {
  if (toc.length < 2) return '';
  return `
      <nav class="toc" aria-label="Содержание статьи">
        <span class="toc__label">Содержание</span>
        <ol>
          ${toc.map((item) => `<li><a href="#${item.id}"><span>${item.num}</span>${esc(item.text)}</a></li>`).join('\n          ')}
        </ol>
      </nav>`;
}

function articleNoteBlocks(article) {
  const sources = article.sources
    ? `<section class="article-sources" aria-labelledby="article-sources-title">${article.sources.replace(/<h2>Источники<\/h2>/i, '<h2 id="article-sources-title">Источники</h2>')}</section>`
    : '';
  const disclaimer = article.disclaimer
    ? `<section class="article-disclaimer" aria-labelledby="article-disclaimer-title">${article.disclaimer.replace(/^<p>\s*Дисклеймер\s*<\/p>/i, '<h2 id="article-disclaimer-title">Дисклеймер</h2>')}</section>`
    : '';
  return sources + disclaimer;
}

function prevNext(article) {
  const { prev, next } = neighbours(article);
  if (!prev && !next) {
    return `<div class="article-nav"><a class="article-nav__link" href="../articles/index.html"><span>Архив</span><b>Все материалы ${ICONS.arrow}</b></a></div>`;
  }
  return `
      <nav class="article-nav" aria-label="Другие статьи рубрики">
        ${prev ? `<a class="article-nav__link" href="../articles/${prev.slug}.html"><span>Предыдущий разбор</span><b>${esc(prev.title)}</b></a>` : '<span></span>'}
        ${next ? `<a class="article-nav__link article-nav__link--next" href="../articles/${next.slug}.html"><span>Следующий разбор</span><b>${esc(next.title)}</b></a>` : ''}
      </nav>`;
}

articles.forEach((article, articleIndex) => {
  const category = categoryBySlug(article.category);
  const author = authorFor(article);
  const related = relatedFor(article);
  const { html, toc } = prepareContent(article);
  const faq = extractFaq(article.content);
  const canonical = `${SITE.url}/articles/${article.slug}.html`;
  const articleNumber = String(articleIndex + 1).padStart(3, '0');

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: [`${SITE.url}/${article.cover}`],
    datePublished: article.date,
    dateModified: article.updated || article.date,
    articleSection: category.name,
    keywords: (article.tags || []).join(', '),
    wordCount: plainText(article.content).split(/\s+/).length,
    inLanguage: 'ru',
    author: { '@type': 'Person', name: author.name, jobTitle: author.role },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: { '@type': 'ImageObject', url: `${SITE.url}/assets/icons/favicon.svg` }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical }
  };

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: `${SITE.url}/` },
      { '@type': 'ListItem', position: 2, name: category.name, item: `${SITE.url}/category/${category.slug}.html` },
      { '@type': 'ListItem', position: 3, name: article.title }
    ]
  };

  const schemas = [ld, breadcrumbs];
  if (faq.length >= 2) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a }
      }))
    });
  }

  const content = `
<div class="reading-progress" data-reading-progress aria-hidden="true"></div>
<article class="article">
  <header class="article-hero">
    <div class="container">
      <nav class="breadcrumbs" aria-label="Хлебные крошки">
        <a href="../index.html">Главная</a><span>/</span>
        <a href="../category/${category.slug}.html">${esc(category.name)}</a><span>/</span>
        <span class="current">${esc(article.title)}</span>
      </nav>
      <div class="article-hero__top">
        <a class="cat-pill" href="../category/${category.slug}.html" style="--cat:${category.accent}">${esc(category.name)}</a>
        <span class="article-hero__num">Материал ${articleNumber} / ${articles.length}</span>
      </div>
      <h1>${esc(article.title)}</h1>
      <p class="article-hero__lead">${esc(article.excerpt)}</p>
      <div class="article-meta">
        <span class="article-meta__author">
          <span class="avatar" aria-hidden="true">${esc(author.initials)}</span>
          <span class="article-meta__person"><b>${esc(author.name)}</b><i>${esc(author.role)}</i></span>
        </span>
        <span class="article-meta__sep" aria-hidden="true"></span>
        <time datetime="${esc(article.date)}">${formatDate(article.date)}</time>
        <span class="article-meta__sep" aria-hidden="true"></span>
        <span class="article-meta__time">${ICONS.clock} ${esc(article.readTime || '')} чтения</span>
      </div>
    </div>
    <div class="container article-cover-wrap">
      <figure class="article-cover">
        <img src="../${esc(article.cover)}" alt="${esc(article.coverAlt || article.title)}" width="1200" height="675" fetchpriority="high">
        <figcaption>${esc(category.name)} · «Ремонт на примерах»</figcaption>
      </figure>
    </div>
  </header>

  <div class="container article-layout">
    <div class="article-body" data-article-body>
      <div class="prose">
        ${html}
      </div>

      ${articleNoteBlocks(article)}

      ${(article.tags || []).length ? `<div class="article-tags" aria-label="Теги статьи">
        ${(article.tags || []).map((tag) => `<a class="tag" href="../category/${category.slug}.html?tag=${encodeURIComponent(tag.toLowerCase())}">#${esc(tag.toLowerCase())}</a>`).join('')}
      </div>` : ''}

      <div class="share-inline">
        <span>Поделиться разбором:</span>
        ${shareButtons}
      </div>

      <div class="author-box">
        <span class="avatar avatar--lg" aria-hidden="true">${esc(author.initials)}</span>
        <div>
          <span class="author-box__label">Автор материала</span>
          <h3>${esc(author.name)}</h3>
          <p>${esc(author.role)}. Материал основан на практическом опыте и типовых узлах, а не на рекламных обещаниях.</p>
        </div>
      </div>

      ${prevNext(article)}
    </div>

    <aside class="article-side">
      ${tocBox(toc)}
      <div class="side-card">
        <span class="side-card__label">Поделиться</span>
        <div class="share-row">${shareButtons}</div>
        <a class="side-card__rss" href="../rss.xml" target="_blank" rel="noopener">${ICONS.rss} RSS-лента</a>
      </div>
      <div class="side-card side-card--accent">
        <span class="side-card__label">Сметы 2026</span>
        <p>${budgetArticles.length} разборов бюджета: расценки, скрытые доплаты и безопасная экономия.</p>
        <a class="text-link" href="../category/budget.html">Смотреть сметы ${ICONS.arrow}</a>
      </div>
    </aside>
  </div>

  <section class="related container">
    <div class="related__head">
      <h2>Читайте также</h2>
      <a class="text-link" href="../category/${category.slug}.html">Ещё в рубрике «${esc(category.name)}» ${ICONS.arrow}</a>
    </div>
    <div class="articles-grid" data-reveal-group>
      ${related.map((item) => card(item, 1, { reveal: true })).join('\n')}
    </div>
  </section>
</article>`;

  write(`articles/${article.slug}.html`, layout({
    depth: 1,
    active: category.slug,
    title: article.title,
    description: article.excerpt,
    keywords: `${(article.tags || []).join(', ')}, ${category.name.toLowerCase()}, ремонт`,
    canonicalPath: `articles/${article.slug}.html`,
    ogType: 'article',
    ogImage: article.cover,
    author: author.name,
    content,
    extraHead: schemas.map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`).join('\n  ')
  }));
});

/* ============================================================
   РУБРИКИ
   ============================================================ */

function filterChips(tags) {
  return `<button class="chip is-active" type="button" data-filter="all">Все</button>
      ${tags.map((tag) => `<button class="chip" type="button" data-filter="${esc(tag.toLowerCase())}">${esc(tag)}</button>`).join('\n      ')}`;
}

function categorySwitcher(activeSlug, depth) {
  return `
    <div class="category-switch">
      <span class="category-switch__label">Другие рубрики</span>
      <nav aria-label="Переход по рубрикам">
        ${CATEGORIES.filter((category) => category.slug !== activeSlug).map((category) => `<a href="${depth ? '../' : ''}category/${category.slug}.html" style="--cat:${category.accent}">${esc(category.navLabel)}</a>`).join('')}
      </nav>
    </div>`;
}

CATEGORIES.forEach((category, categoryIndex) => {
  const list = byCategory(category.slug);
  const tagCounts = new Map();
  list.forEach((article) => (article.tags || []).forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)));
  const tags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ru'))
    .map(([tag]) => tag);

  const content = `
<section class="page-hero category-hero" style="--cat:${category.accent}">
  <div class="container">
    <nav class="breadcrumbs" aria-label="Хлебные крошки">
      <a href="../index.html">Главная</a><span>/</span><span class="current">${esc(category.name)}</span>
    </nav>
    <div class="category-hero__grid">
      <div class="category-hero__text">
        <span class="eyebrow">Рубрика ${String(categoryIndex + 1).padStart(2, '0')}</span>
        <h1>${esc(category.title)}</h1>
        <p>${esc(category.desc)}</p>
      </div>
      <div class="category-hero__badge" aria-hidden="true">
        <span class="category-hero__icon">${icon(category.icon)}</span>
        <strong>${list.length}</strong>
        <span>${plural(list.length, 'материал', 'материала', 'материалов')}</span>
      </div>
    </div>
    <div class="category-hero__meta">
      <span>${esc(category.tagline)}</span>
      <span class="dot" aria-hidden="true"></span>
      <span>Обновлено ${formatDate(list[0] ? list[0].date : new Date().toISOString())}</span>
    </div>
  </div>
</section>

<section class="section section--tight">
  <div class="container">
    <div class="filters" aria-label="Фильтр по темам">
      <span class="filters__label">${ICONS.filter} Темы</span>
      ${filterChips(tags)}
    </div>
    <div class="results-line">
      <span data-results-count>Найдено материалов: ${list.length}</span>
      <span>Сначала новые</span>
    </div>
    <div class="articles-grid" data-filter-grid data-reveal-group>
      ${list.map((article) => card(article, 1, { reveal: true })).join('\n')}
    </div>
    <div class="empty-state" data-empty hidden>По этой теме пока нет материалов. Попробуйте другой фильтр.</div>
    <div class="pagination" data-pagination aria-label="Пагинация"></div>
    ${categorySwitcher(category.slug, 1)}
  </div>
</section>`;

  write(`category/${category.slug}.html`, layout({
    depth: 1,
    active: category.slug,
    title: `${category.title} — разборы и инструкции`,
    description: `${category.desc} Материалы рубрики «${category.name}» на «Ремонте на примерах».`,
    keywords: `${category.name.toLowerCase()}, ремонт, ${category.tagline.toLowerCase()}`,
    canonicalPath: `category/${category.slug}.html`,
    ogImage: list[0] ? list[0].cover : featured.cover,
    content
  }));
});

/* ============================================================
   ВСЕ СТАТЬИ
   ============================================================ */

const archiveContent = `
<section class="page-hero">
  <div class="container">
    <nav class="breadcrumbs" aria-label="Хлебные крошки">
      <a href="../index.html">Главная</a><span>/</span><span class="current">Все статьи</span>
    </nav>
    <span class="eyebrow">Архив журнала</span>
    <h1>Все разборы <em>в одном месте</em></h1>
    <p>${articles.length} материалов о ремонте: от планировки и электрики до плитки, сантехники и смет. Фильтруйте по рубрикам или ищите через поиск в шапке сайта.</p>
    <div class="archive-stats">
      <span><b>${articles.length}</b> материалов</span>
      <span><b>${CATEGORIES.length}</b> рубрик</span>
      <span><b>${budgetArticles.length}</b> смет 2026</span>
    </div>
  </div>
</section>

<section class="section section--tight">
  <div class="container">
    <div class="filters" aria-label="Фильтр по рубрикам">
      <span class="filters__label">${ICONS.filter} Рубрика</span>
      <button class="chip is-active" type="button" data-filter="all">Все</button>
      ${CATEGORIES.map((category) => `<button class="chip" type="button" data-filter="${category.slug}">${esc(category.navLabel)}</button>`).join('\n      ')}
    </div>
    <div class="results-line">
      <span data-results-count>Найдено материалов: ${articles.length}</span>
      <span>Сначала новые</span>
    </div>
    <div class="articles-grid" data-filter-grid data-reveal-group>
      ${byDate.map((article) => card(article, 1, { reveal: true })).join('\n')}
    </div>
    <div class="empty-state" data-empty hidden>В этой рубрике пока нет статей.</div>
    <div class="pagination" data-pagination aria-label="Пагинация"></div>
  </div>
</section>`;

write('articles/index.html', layout({
  depth: 1,
  title: 'Все статьи — архив журнала',
  description: 'Полный архив «Ремонта на примерах»: планировки, электрика, сантехника, плитка, материалы и сметы ремонта.',
  canonicalPath: 'articles/index.html',
  ogImage: featured.cover,
  content: archiveContent
}));

/* ============================================================
   О ПРОЕКТЕ
   ============================================================ */

const contactBlock = SITE.email
  ? `<article class="content-card">
          <h2>Контакты</h2>
          <p>Идеи тем, вопросы и предложения о сотрудничестве: <a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a>. Мы отвечаем в течение двух рабочих дней.</p>
          <div class="contact-strip">
            <a class="btn btn--ghost btn--small" href="mailto:${esc(SITE.email)}">Написать письмо ${ICONS.arrow}</a>
          </div>
        </article>`
  : '';

const aboutContent = `
<section class="page-hero">
  <div class="container">
    <nav class="breadcrumbs" aria-label="Хлебные крошки">
      <a href="index.html">Главная</a><span>/</span><span class="current">О проекте</span>
    </nav>
    <span class="eyebrow">О проекте</span>
    <h1>Ремонт — это <em>последовательность</em>,<br>а не набор красивых картинок</h1>
    <p>«Ремонт на примерах» — практический журнал для тех, кто делает ремонт своими руками или хочет понимать, за что платит подрядчику. Мы разбираем узлы, технологии, размеры и сметы на конкретных примерах.</p>
    <div class="archive-stats">
      <span><b>${articles.length}</b> разборов</span>
      <span><b>${CATEGORIES.length}</b> рубрик</span>
      <span><b>${authors.length}</b> практикующих авторов</span>
    </div>
  </div>
</section>

<section class="section section--tight">
  <div class="container">
    <div class="values-grid" data-reveal-group>
      <div class="value-card" data-reveal>
        <span class="value-card__num">01</span>
        <h3>Сначала конструкция</h3>
        <p>Пирог стены, уклон, вентиляция и нагрузки важнее цвета плитки. Если узел собран неправильно, декор не спасёт.</p>
      </div>
      <div class="value-card" data-reveal>
        <span class="value-card__num">02</span>
        <h3>Цифры и допуски</h3>
        <p>Размеры, расценки, расход материалов и запас — с диапазонами. Без «примерно» и «как у всех».</p>
      </div>
      <div class="value-card" data-reveal>
        <span class="value-card__num">03</span>
        <h3>Ошибки без прикрас</h3>
        <p>Показываем, где обычно ломается технология и сколько стоит переделка. Это честнее, чем обещать «ремонт за месяц».</p>
      </div>
    </div>

    <div class="content-grid" style="margin-top:64px">
      <div>
        <article class="content-card">
          <h2>Зачем этот сайт</h2>
          <p>Большая часть переделок начинается не из-за плохих материалов, а из-за пропущенного этапа: не посчитали проходы, не заложили вентиляцию, поставили розетку за корпусом техники или сэкономили на гидроизоляции. Потом это стоит в разы дороже, чем сделать сразу.</p>
          <p>Мы собираем практические разборы: как устроен узел, какие размеры критичны, что проверить до закупки и где заканчивается разумная экономия. Материалы рассчитаны на обычную квартиру, а не на выставочный проект.</p>
        </article>

        <article class="content-card">
          <h2>Как мы выбираем темы</h2>
          <p>Берём вопросы, которые возникают в реальном ремонте, и разбираем их по шагам:</p>
          <ul>
            <li>какие размеры и допуски определяют удобство;</li>
            <li>какие работы нельзя менять местами;</li>
            <li>где начинаются скрытые доплаты;</li>
            <li>какие решения работают в типовой квартире, а какие — только в проекте.</li>
          </ul>
          <p>Сметы и расценки ориентированы на 2026 год и Москву с Подмосковьем; для регионов применяйте поправку на стоимость работ.</p>
        </article>

        <article class="content-card">
          <h2>Авторы</h2>
          <p>Над материалами работают практикующие специалисты. У каждого — своя зона ответственности: электрика, сантехника, плитка, балконы, кухни, сметы, материалы и планировки.</p>
          <div class="authors-grid">
            ${authors.map((author) => `
              <div class="author-card">
                <span class="avatar" aria-hidden="true">${esc(author.initials)}</span>
                <div>
                  <b>${esc(author.name)}</b>
                  <p>${esc(author.role)}</p>
                  <span class="author-card__meta">${author.count} ${plural(author.count, 'материал', 'материала', 'материалов')} · ${[...author.categories].map((slug) => esc(categoryBySlug(slug).navLabel)).join(', ')}</span>
                </div>
              </div>`).join('')}
          </div>
        </article>

        ${contactBlock}
      </div>

      <aside>
        <div class="author-profile">
          <span class="avatar avatar--lg" aria-hidden="true">РП</span>
          <h2>Редакция «Ремонта на примерах»</h2>
          <p>Коллективный проект практикующих мастеров и авторов. Проверяем технологии, размеры и сметы, чтобы разборы помогали принимать решения, а не просто вдохновляли.</p>
          <div class="socials" style="margin-top:18px">
            <a class="socials__link" href="rss.xml" target="_blank" rel="noopener" aria-label="RSS-лента">${ICONS.rss}</a>
          </div>
        </div>

        <div class="rss-card" style="margin-top:20px">
          <span class="rss-card__icon">${ICONS.rss}</span>
          <h3>RSS-лента</h3>
          <p>Все новые разборы — в одном потоке. Подходит для читалок и тематических площадок.</p>
          <button class="copy-btn" type="button" data-copy-rss>${ICONS.copy} Скопировать ссылку</button>
          <a class="btn btn--small copy-btn" href="rss.xml" target="_blank" rel="noopener">Открыть rss.xml ${ICONS.arrow}</a>
        </div>
      </aside>
    </div>
  </div>
</section>`;

write('about.html', layout({
  depth: 0,
  title: 'О проекте',
  description: 'О журнале «Ремонт на примерах»: зачем мы разбираем технологии и сметы, как выбираем темы и кто пишет материалы.',
  canonicalPath: 'about.html',
  ogImage: featured.cover,
  content: aboutContent
}));

/* ============================================================
   ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ
   ============================================================ */

const privacyContent = `
<section class="page-hero">
  <div class="container">
    <nav class="breadcrumbs" aria-label="Хлебные крошки">
      <a href="index.html">Главная</a><span>/</span><span class="current">Политика конфиденциальности</span>
    </nav>
    <span class="eyebrow">Документы</span>
    <h1>Политика конфиденциальности</h1>
    <p>Настоящая политика описывает, как сайт «Ремонт на примерах» обрабатывает и защищает информацию посетителей.</p>
  </div>
</section>

<section class="section section--tight">
  <div class="container">
    <div class="article-body" style="max-width:820px">
      <p class="privacy-note">Редакция от 1 ноября 2026 года. Используя сайт, вы соглашаетесь с условиями этой политики.</p>
      <div class="prose">
        <h2>1. Общие положения</h2>
        <p>Политика конфиденциальности действует в отношении сайта «Ремонт на примерах» (далее — Сайт) и всей информации, которую Сайт может получить о посетителе во время использования.</p>
        <p>Использование Сайта означает безоговорочное согласие с настоящей Политикой и указанными в ней условиями обработки информации. В случае несогласия посетитель должен воздержаться от использования Сайта.</p>

        <h2>2. Какие данные мы собираем</h2>
        <p>Сайт может обрабатывать следующие категории данных:</p>
        <ul>
          <li>обезличенные технические данные: тип браузера, устройство, разрешение экрана, источник перехода;</li>
          <li>данные о посещениях: просмотренные страницы, время визита, действия на сайте;</li>
          <li>данные, которые посетитель добровольно сообщает при обращении по электронной почте или в социальных сетях.</li>
        </ul>
        <p>Сайт не собирает специальные категории персональных данных и не запрашивает документы, удостоверяющие личность.</p>

        <h2>3. Цели обработки</h2>
        <p>Информация используется для того, чтобы:</p>
        <ul>
          <li>обеспечивать работу Сайта и улучшать его содержание;</li>
          <li>понимать, какие материалы востребованы, и планировать новые темы;</li>
          <li>отвечать на обращения и запросы посетителей;</li>
          <li>обеспечивать безопасность и предотвращать злоупотребления.</li>
        </ul>

        <h2>4. Файлы cookie и аналитика</h2>
        <p>Сайт может использовать файлы cookie — небольшие текстовые файлы, сохраняемые браузером. Они помогают запоминать настройки и собирать обезличенную статистику посещений.</p>
        <p>Для анализа посещаемости используется сервис «Яндекс Метрика» (номер счётчика ${esc(SITE.yandexMetrika || '—')}), который обрабатывает обезличенные данные в соответствии со своей политикой конфиденциальности.</p>
        <p>Вы можете отключить cookie в настройках браузера. В этом случае часть функций Сайта может работать некорректно.</p>

        <h2>5. Передача данных третьим лицам</h2>
        <p>Мы не продаём и не передаём персональные данные третьим лицам, за исключением случаев, предусмотренных законом, а также технических подрядчиков, обеспечивающих работу Сайта (хостинг, аналитика), при условии соблюдения ими конфиденциальности.</p>
        <p>На Сайте могут размещаться ссылки на внешние ресурсы. Мы не несём ответственности за политику конфиденциальности таких ресурсов.</p>

        <h2>6. Хранение и защита</h2>
        <p>Данные хранятся не дольше, чем это необходимо для целей обработки. Мы принимаем разумные организационные и технические меры для защиты информации от неправомерного доступа, изменения и распространения.</p>
        <p>При этом ни один способ передачи данных через интернет не может быть абсолютно безопасным. Посетитель использует Сайт на свой риск.</p>

        <h2>7. Права посетителя</h2>
        <p>Вы вправе запросить информацию об обработке ваших данных, потребовать их уточнения или удаления, а также отозвать согласие на обработку. Для этого свяжитесь с редакцией через контакты, указанные на Сайте.</p>

        <h2>8. Изменения политики</h2>
        <p>Мы можем обновлять настоящую Политику. Новая редакция вступает в силу с момента публикации на этой странице. Дата последнего обновления указана в начале документа.</p>

        <h2>9. Контакты</h2>
        <p>По вопросам, связанным с обработкой данных и настоящей Политикой, свяжитесь с редакцией через контакты, указанные на Сайте.</p>
      </div>
    </div>
  </div>
</section>`;

write('privacy.html', layout({
  depth: 0,
  title: 'Политика конфиденциальности',
  description: 'Политика конфиденциальности сайта «Ремонт на примерах»: какие данные обрабатываются, зачем, как хранятся и как связаться с редакцией.',
  canonicalPath: 'privacy.html',
  ogImage: featured.cover,
  content: privacyContent
}));

/* ============================================================
   404
   ============================================================ */

const notFoundContent = `
<section class="error-page">
  <div class="container error-page__inner">
    <div class="error-blueprint" aria-hidden="true">
      <span class="error-blueprint__corner error-blueprint__corner--tl"></span>
      <span class="error-blueprint__corner error-blueprint__corner--tr"></span>
      <span class="error-blueprint__corner error-blueprint__corner--bl"></span>
      <span class="error-blueprint__corner error-blueprint__corner--br"></span>
      <span class="error-code">404</span>
      <span class="error-blueprint__label">Страница не найдена</span>
    </div>
    <div class="error-page__text">
      <span class="eyebrow">Ошибка в чертеже</span>
      <h1>Этой страницы <em>нет в проекте</em></h1>
      <p>Возможно, адрес изменился или материал переехал в архив. Начните с главной или выберите рубрику — в архиве ${articles.length} разборов.</p>
      <div class="hero__actions">
        <a class="btn btn--primary" href="index.html">На главную ${ICONS.arrow}</a>
        <a class="btn btn--ghost" href="articles/index.html">Все статьи</a>
      </div>
      <div class="article-tags" style="margin-top:32px">
        ${CATEGORIES.map((category) => `<a class="tag" href="category/${category.slug}.html">${esc(category.navLabel)}</a>`).join('')}
      </div>
    </div>
  </div>
</section>`;

write('404.html', layout({
  depth: 0,
  title: 'Страница не найдена',
  description: 'Страница не найдена. Вернитесь на главную «Ремонт на примерах» или выберите рубрику.',
  canonicalPath: '404.html',
  robots: 'noindex, follow',
  content: notFoundContent
}));

/* ============================================================
   RSS, SITEMAP, SEARCH INDEX, ROBOTS
   ============================================================ */

write('rss.xml', buildRss(articles, {
  siteUrl: SITE.url,
  siteName: SITE.name,
  description: SITE.description,
  feedTitle: `${SITE.name} — RSS`
}) + '\n');

const indexEntries = byDate.map((article) => ({
  title: article.title,
  url: `articles/${article.slug}.html`,
  cover: article.cover,
  excerpt: article.excerpt,
  category: article.category,
  categoryLabel: categoryBySlug(article.category).name,
  tags: article.tags,
  dateLabel: formatDate(article.date)
}));

write('js/search-index.js', `/* Автоматически сгенерированный поисковый индекс. Не редактируйте вручную. */\nwindow.SITE_ARTICLES = ${JSON.stringify(indexEntries, null, 2)};\n`);

const urls = [
  { loc: '', priority: '1.0', changefreq: 'weekly' },
  { loc: 'articles/index.html', priority: '0.9', changefreq: 'daily' },
  ...CATEGORIES.map((category) => ({ loc: `category/${category.slug}.html`, priority: '0.8', changefreq: 'weekly' })),
  ...byDate.map((article) => ({
    loc: `articles/${article.slug}.html`,
    priority: '0.7',
    changefreq: 'monthly',
    lastmod: (article.updated || article.date).slice(0, 10)
  })),
  { loc: 'about.html', priority: '0.4', changefreq: 'monthly' },
  { loc: 'privacy.html', priority: '0.2', changefreq: 'yearly' }
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${SITE.url}/${url.loc}</loc>${url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

write('sitemap.xml', sitemap);

write('robots.txt', `User-agent: *
Allow: /
Disallow: /404.html
Clean-param: utm_source&utm_medium&utm_campaign&utm_term&utm_content

Sitemap: ${SITE.url}/sitemap.xml
`);

console.log(`\nГотово: ${articles.length} статей, ${CATEGORIES.length} рубрик, RSS, sitemap и поисковый индекс.`);
