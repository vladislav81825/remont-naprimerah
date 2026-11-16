/* ============================================================
   RSS-лента «Ремонт на примерах» для Дзена и читалок
   Node.js: node js/rss.js
   ============================================================ */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.buildRss = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEFAULT_SITE = 'https://remont.naprimerah.ru';
  const DEFAULT_TITLE = 'Ремонт на примерах';
  const DEFAULT_DESCRIPTION = 'Практический журнал о ремонте квартиры: технологии, планировки, сметы и ошибки, которые дорого стоят.';

  function escapeXml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function absoluteUrl(value, siteUrl) {
    const raw = String(value || '').trim();
    if (/^https?:\/\//i.test(raw)) return raw;
    return `${siteUrl}/${raw.replace(/^\/+/, '').replace(/^\.\.\//, '').replace(/^\.\//, '')}`;
  }

  function cleanContent(html, siteUrl) {
    let out = String(html || '');

    out = out.replace(/<figcaption>([\s\S]*?)<\/figcaption>/gi, '<p><i>$1</i></p>');
    out = out.replace(/<summary[^>]*>([\s\S]*?)<\/summary>/gi, '<p><b>$1</b></p>');
    out = out.replace(/<details[^>]*>/gi, '');
    out = out.replace(/<\/details>/gi, '');
    out = out.replace(/<\/t[dh]>/gi, ' | ');
    out = out.replace(/<\/tr>/gi, '<br>');
    out = out.replace(/<br\s*\/?>/gi, '<br>');

    out = out.replace(/(<img[^>]+src=['"])([^'"]+)(['"])/gi, (match, start, src, end) => {
      return `${start}${escapeXml(absoluteUrl(src, siteUrl))}${end}`;
    });

    const allowed = new Set([
      'p', 'h1', 'h2', 'h3', 'b', 'strong', 'i', 'em', 'ul', 'ol', 'li',
      'figure', 'img', 'a', 'br'
    ]);

    out = out.replace(/<\/?([a-zA-Z0-9-]+)([^>]*)>/g, (tag, name) => {
      const lower = name.toLowerCase();
      return allowed.has(lower) ? tag : '';
    });

    return out.replace(/\s{2,}/g, ' ').trim();
  }

  function rfc822(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getUTCDay()]}, ${pad(date.getUTCDate())} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} +0000`;
  }

  function buildRss(articles, options) {
    const opts = options || {};
    const siteUrl = (opts.siteUrl || DEFAULT_SITE).replace(/\/+$/, '');
    const siteName = opts.siteName || DEFAULT_TITLE;
    const description = opts.description || DEFAULT_DESCRIPTION;
    const feedTitle = opts.feedTitle || `${siteName} — RSS`;
    const feedUrl = `${siteUrl}/rss.xml`;
    const list = (articles || [])
      .filter((article) => article.feed !== false)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, opts.limit || 40);

    const channelCover = absoluteUrl(
      opts.channelImage || (list[0] && list[0].cover) || 'assets/images/logo-og.jpg',
      siteUrl
    );

    const items = list.map((article) => {
      const link = `${siteUrl}/articles/${article.slug}.html`;
      const cover = absoluteUrl(article.cover, siteUrl);
      const body = escapeXml('')
        + cleanContent(`<h1>${escapeXml(article.title)}</h1>${article.content || ''}`, siteUrl)
          .replace(/\]\]>/g, ']]&gt;');

      const categories = [
        article.category,
        ...(Array.isArray(article.tags) ? article.tags.slice(0, 4) : [])
      ].filter(Boolean);

      return [
        '    <item>',
        `      <title>${escapeXml(article.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${rfc822(article.updated || article.date)}</pubDate>`,
        `      <description>${escapeXml(article.excerpt || '')}</description>`,
        ...categories.map((category) => `      <category>${escapeXml(category)}</category>`),
        `      <enclosure url="${escapeXml(cover)}" type="image/jpeg" length="0" />`,
        '      <content:encoded>',
        `        <![CDATA[${body}]]>`,
        '      </content:encoded>',
        '    </item>'
      ].join('\n');
    }).join('\n');

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0"',
      '     xmlns:content="http://purl.org/rss/1.0/modules/content/"',
      '     xmlns:dc="http://purl.org/dc/elements/1.1/"',
      '     xmlns:media="http://search.yahoo.com/mrss/"',
      '     xmlns:atom="http://www.w3.org/2005/Atom">',
      '  <channel>',
      `    <title>${escapeXml(feedTitle)}</title>`,
      `    <link>${siteUrl}/</link>`,
      `    <description>${escapeXml(description)}</description>`,
      '    <language>ru</language>',
      `    <copyright>© ${escapeXml(siteName)}</copyright>`,
      `    <lastBuildDate>${rfc822(list[0] ? (list[0].updated || list[0].date) : new Date().toISOString())}</lastBuildDate>`,
      `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>`,
      '    <image>',
      `      <url>${escapeXml(channelCover)}</url>`,
      `      <title>${escapeXml(siteName)}</title>`,
      `      <link>${siteUrl}/</link>`,
      '    </image>',
      items,
      '  </channel>',
      '</rss>',
      ''
    ].join('\n');
  }

  return buildRss;
});

if (typeof module === 'object' && module.exports && require.main === module) {
  const fs = require('fs');
  const path = require('path');
  const root = path.resolve(__dirname, '..');
  const config = JSON.parse(fs.readFileSync(path.join(root, 'data/site-config.json'), 'utf8'));
  const articles = JSON.parse(fs.readFileSync(path.join(root, 'data/articles.json'), 'utf8'));
  const xml = module.exports(articles, {
    siteUrl: config.url,
    siteName: config.brand,
    description: config.description,
    feedTitle: `${config.brand} — RSS`
  });

  fs.writeFileSync(path.join(root, 'rss.xml'), xml, 'utf8');
  console.log(`rss.xml создан: ${articles.length} материалов`);
}
