/* ============================================================
   Нормализация данных статей и простановка тегов
   Запуск: node tools/prepare-data.js
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataPath = path.join(root, 'data/articles.json');
const articles = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const CATEGORY_FALLBACK = {
  balkon: 'Балкон',
  budget: 'Смета',
  elektrika: 'Электрика',
  gostinaya: 'Гостиная',
  kuhnya: 'Кухня',
  materialy: 'Материалы',
  santehnika: 'Сантехника',
  vannaya: 'Ванная'
};

const TAG_RULES = [
  { label: 'Смета', re: /смет|расцен|бюджет|сколько стоит|стоимост|(?<![\p{L}])руб(?:\.|лей|ля|ль)?(?![\p{L}])|(?<![\p{L}])цен(?:а|ы|у|е|ой|ам)(?![\p{L}])/iu },
  { label: 'Планировка', re: /планиров|расстанов|(?<![\p{L}])зон(?:а|ы|у|е|ой|ам|ах)?(?![\p{L}])|проход|эргоном|расстоян|компонов|рабочий треугольник/iu },
  { label: 'Утепление', re: /утепл|теплоизол|(?<![\p{L}])тёпл|(?<![\p{L}])тепл|мостик[а-я]* холода|утеплител/iu },
  { label: 'Гидроизоляция', re: /гидроизол|протеч|гермет|мембран|заливк/iu },
  { label: 'Электрика', re: /электрик|электропровод|провод|кабел|автомат|(?<![\p{L}])щит(?:а|у|ом|е|ы|ок)?(?![\p{L}])|узо|диффавтомат|штроб/iu },
  { label: 'Освещение', re: /освещ|светильник|подсвет|люстр|(?<![\p{L}])бра(?![\p{L}])|(?<![\p{L}])спот|диммер|(?<![\p{L}])ламп/iu },
  { label: 'Розетки', re: /розет|выключател|подрозетник/iu },
  { label: 'Плитка', re: /плитк|керамогранит|фартук|(?<![\p{L}])шов|раскладк|затирк|мозаик/iu },
  { label: 'Сантехника', re: /сантех|труб|смесител|унитаз|инсталляц|раковин|(?<![\p{L}])ванн|(?<![\p{L}])душ|канализац|полотенцесуш|сифон|трап|водонагрев|бойлер|водорозет/iu },
  { label: 'Вентиляция', re: /вентиляц|конденсат|сырост|плесен|грибк|воздухообмен|вытяжк/iu },
  { label: 'Хранение', re: /хранен|шкаф|полк|стеллаж|пенал|антресол|тумб|гардероб|кладов/iu },
  { label: 'Материалы', re: /обои|ламинат|краск|материал|кварцвинил|(?<![\p{L}])spc|lvt|микроцемент|стеклообои|плинтус|инженерная доска|(?<![\p{L}])гкл/iu },
  { label: 'Техника', re: /техник|холодильник|посудомоеч|стиральн|сушильн|варочн|духов|индукц|газов|микроволн|(?<![\p{L}])свч/iu },
  { label: 'Окна', re: /(?<![\p{L}])окн|остеклен|откос|стеклопакет|подоконник|монтажн[а-я]* шов/iu },
  { label: 'Монтаж', re: /монтаж|установк|подключен|разводк|сборк|укладк|креп|инсталляц/iu },
  { label: 'Полы', re: /(?<![\p{L}])пол(?:а|у|ом|ы|ов)?(?![\p{L}])|стяжк|наливн|подложк|паркет/iu },
  { label: 'Мебель', re: /мебел|диван|кресл|кроват|тумб|комод|стеллаж|гарнитур|барн(?:ая|ой|ую)|стол(?!ешниц)|стул/iu },
  { label: 'Дизайн', re: /дизайн|интерьер|декор|стил|цвет|фактур|текстур|акустик/iu }
];

function cleanText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/([.,;:!?])\1+/g, '$1')
    .trim();
}

function cleanContent(html) {
  let out = String(html || '');

  out = out.replace(/src="\.\/assets\//g, 'src="../assets/');
  out = out.replace(/src='\.\/assets\//g, "src='../assets/");

  const protectedBlocks = [];
  out = out.replace(/<pre>[\s\S]*?<\/pre>/gi, (block) => {
    protectedBlocks.push(block);
    return `\u0000PRE${protectedBlocks.length - 1}\u0000`;
  });

  out = out.replace(/([а-яё0-9])\s+([.,;:!?])/giu, '$1$2');
  out = out.replace(/руб\.\./giu, 'руб.');

  out = out.replace(/<figure>\s*<img([^>]*?)alt="(\d*)"([^>]*)>\s*<figcaption>\d*<\/figcaption>\s*<\/figure>/gi, '<figure><img$1alt=""$3></figure>');
  out = out.replace(/<figcaption>\s*\d+\s*<\/figcaption>/gi, '');
  out = out.replace(/<img([^>]*?)alt="(\d*)"([^>]*)>/gi, '<img$1alt=""$3>');
  out = out.replace(/\s+alt=""/g, ' alt=""');

  out = out.replace(/\u0000PRE(\d+)\u0000/g, (match, index) => protectedBlocks[Number(index)] || '');

  return out.trim();
}

function scoreTag(rule, article) {
  const title = (article.title || '').match(rule.re);
  const summary = `${article.excerpt || ''} ${article.lead || ''}`.match(rule.re);
  const body = (article.content || '').slice(0, 3000).match(rule.re);
  return (title ? 4 : 0) + (summary ? 2 : 0) + (body ? 1 : 0);
}

function deriveTags(article) {
  const scored = TAG_RULES
    .map((rule, index) => ({ label: rule.label, score: scoreTag(rule, article), index }))
    .filter((item) => item.score >= 2)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const tags = scored.slice(0, 4).map((item) => item.label);
  const fallback = CATEGORY_FALLBACK[article.category];
  if (fallback && !tags.includes(fallback) && tags.length < 2) tags.push(fallback);
  return tags.slice(0, 4);
}

let changedTitles = 0;
let changedContent = 0;
const tagCounts = new Map();

const prepared = articles.map((article) => {
  const oldTitle = article.title;
  let title = cleanText(article.title).replace(/^\d+\s+/, '');

  let content = cleanContent(article.content);
  if (content !== article.content) changedContent += 1;
  if (title !== oldTitle) changedTitles += 1;

  const coverAlt = cleanText(article.coverAlt || '').replace(/^\d+\s+/, '') || title;
  const excerpt = cleanText(article.excerpt);
  const lead = cleanText(article.lead);
  const tags = deriveTags({ ...article, title, content, excerpt, lead });

  tags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1));

  return {
    ...article,
    title,
    coverAlt: coverAlt === oldTitle.replace(/^\d+\s+/, '') ? title : coverAlt,
    excerpt,
    lead,
    tags,
    content
  };
});

fs.writeFileSync(dataPath, JSON.stringify(prepared, null, 2) + '\n', 'utf8');

console.log(`Обработано статей: ${prepared.length}`);
console.log(`Исправлено заголовков: ${changedTitles}`);
console.log(`Очищено HTML: ${changedContent}`);
console.log('Теги:');
[...tagCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([tag, count]) => console.log(`  ${tag}: ${count}`));

const withoutTags = prepared.filter((a) => !a.tags.length);
console.log(`Без тегов: ${withoutTags.length}`);
