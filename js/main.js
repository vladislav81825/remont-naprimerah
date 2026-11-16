(function () {
  'use strict';

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let toastTimer;

  function toast(message) {
    let element = $('.toast');
    if (!element) {
      element = document.createElement('div');
      element.className = 'toast';
      element.setAttribute('role', 'status');
      document.body.appendChild(element);
    }
    element.textContent = message;
    element.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove('is-visible'), 2600);
  }

  function lockBody(lock) {
    document.body.classList.toggle('is-locked', lock);
  }

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/ё/g, 'е').trim();
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[character]));
  }

  function copyText(value, successMessage) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(
        () => toast(successMessage),
        () => toast(value)
      );
      return;
    }
    toast(value);
  }

  $$('[data-year]').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  $$('[data-today]').forEach((element) => {
    const date = new Date();
    element.textContent = new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  });

  const header = $('.site-header');
  const backTop = $('.back-to-top');

  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
    if (backTop) backTop.classList.toggle('is-visible', window.scrollY > 640);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backTop) {
    backTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  const burger = $('.burger');
  const mobileMenu = $('.mobile-menu');
  const mobileClosers = $$('[data-mobile-close]');

  function closeMobileMenu() {
    if (!burger || !mobileMenu) return;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    lockBody(false);
  }

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const isOpen = burger.getAttribute('aria-expanded') === 'true';
      const nextState = !isOpen;
      burger.setAttribute('aria-expanded', String(nextState));
      burger.setAttribute('aria-label', nextState ? 'Закрыть меню' : 'Открыть меню');
      mobileMenu.classList.toggle('is-open', nextState);
      mobileMenu.setAttribute('aria-hidden', String(!nextState));
      lockBody(nextState);
    });

    $$('a', mobileMenu).forEach((link) => link.addEventListener('click', closeMobileMenu));
    mobileClosers.forEach((button) => button.addEventListener('click', closeMobileMenu));
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1100) closeMobileMenu();
    });
  }

  const searchModal = $('[data-search-modal]');
  const searchInput = $('[data-search-input]');
  const searchResults = $('[data-search-results]');
  const searchOpeners = $$('[data-search-open]');
  const searchClosers = $$('[data-search-close]');
  let searchIndex = Array.isArray(window.SITE_ARTICLES) ? window.SITE_ARTICLES : null;
  let lastFocused = null;

  function renderSearch(query) {
    if (!searchResults) return;
    const value = normalize(query);

    if (!searchIndex || !searchIndex.length) {
      searchResults.innerHTML = '<p class="search-hint">Не удалось загрузить статьи. Попробуйте обновить страницу.</p>';
      return;
    }

    const prefix = document.body.dataset.depth === 'root' ? '' : '../';
    const items = (value
      ? searchIndex.filter((article) => normalize([
          article.title,
          article.excerpt,
          article.categoryLabel,
          ...(article.tags || [])
        ].join(' ')).includes(value))
      : searchIndex
    ).slice(0, 8);

    if (!items.length) {
      searchResults.innerHTML = '<p class="search-hint">Ничего не найдено. Попробуйте «смета», «плитка» или «розетки».</p>';
      return;
    }

    searchResults.innerHTML = items.map((article) => `
      <a class="search-result" href="${escapeHtml(prefix + article.url)}">
        <span class="search-result__media">
          <img src="${escapeHtml(prefix + article.cover)}" alt="" loading="lazy" width="1200" height="675">
        </span>
        <span class="search-result__body">
          <span class="search-result__cat">${escapeHtml(article.categoryLabel || '')}</span>
          <span class="search-result__title">${escapeHtml(article.title)}</span>
          <span class="search-result__excerpt">${escapeHtml(article.excerpt)}</span>
          <span class="search-result__meta">${escapeHtml(article.dateLabel || '')}</span>
        </span>
      </a>
    `).join('');
  }

  function openSearch() {
    if (!searchModal) return;
    lastFocused = document.activeElement;
    searchModal.classList.add('is-open');
    searchModal.setAttribute('aria-hidden', 'false');
    lockBody(true);
    renderSearch('');
    setTimeout(() => searchInput && searchInput.focus(), 80);
  }

  function closeSearch() {
    if (!searchModal) return;
    searchModal.classList.remove('is-open');
    searchModal.setAttribute('aria-hidden', 'true');
    lockBody(false);
    if (searchInput) searchInput.value = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  if (searchModal) {
    searchOpeners.forEach((button) => button.addEventListener('click', openSearch));
    searchClosers.forEach((button) => button.addEventListener('click', closeSearch));

    searchModal.addEventListener('click', (event) => {
      if (event.target === searchModal) closeSearch();
    });

    if (searchInput) {
      searchInput.addEventListener('input', (event) => renderSearch(event.target.value));
      searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          const first = $('.search-result', searchResults);
          if (first) window.location.href = first.getAttribute('href');
        }
      });
    }

    document.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchModal.classList.contains('is-open') ? closeSearch() : openSearch();
      }
      if (event.key === 'Escape') {
        if (searchModal.classList.contains('is-open')) closeSearch();
        if (mobileMenu && mobileMenu.classList.contains('is-open')) closeMobileMenu();
      }
    });

    if (!searchIndex) {
      const prefix = document.body.dataset.depth === 'root' ? '' : '../';
      fetch(`${prefix}js/search-index.js`)
        .then((response) => (response.ok ? response.text() : Promise.reject()))
        .then((text) => {
          const match = text.match(/window\.SITE_ARTICLES\s*=\s*([\s\S]+?);?\s*$/);
          if (match) searchIndex = JSON.parse(match[1]);
        })
        .catch(() => {});
    }
  }

  const revealElements = $$('[data-reveal]');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  } else {
    $$('[data-reveal-group]').forEach((group) => {
      $$('[data-reveal]', group).forEach((element, index) => {
        element.style.setProperty('--reveal-delay', `${Math.min(index * 0.06, 0.36)}s`);
      });
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    revealElements.forEach((element) => {
      element.classList.add('reveal');
      observer.observe(element);
    });
  }

  const progressBar = $('[data-reading-progress]');
  const articleBody = $('[data-article-body]');

  if (progressBar && articleBody) {
    let ticking = false;

    const updateProgress = () => {
      const rect = articleBody.getBoundingClientRect();
      const total = Math.max(rect.height - window.innerHeight + 180, 1);
      const passed = Math.min(Math.max(-rect.top + 150, 0), total);
      progressBar.style.width = `${Math.min((passed / total) * 100, 100)}%`;
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  const tocLinks = $$('.toc a[href^="#"]');
  const tocTargets = tocLinks
    .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);

  if (tocLinks.length && tocTargets.length && 'IntersectionObserver' in window) {
    const tocObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach((link) => link.classList.remove('is-active'));
        const active = tocLinks.find((link) => link.getAttribute('href') === `#${entry.target.id}`);
        if (active) active.classList.add('is-active');
      });
    }, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });

    tocTargets.forEach((target) => tocObserver.observe(target));
  }

  $$('[data-share]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const type = button.dataset.share;
      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(document.title);
      const links = {
        vk: `https://vk.com/share.php?url=${url}&title=${title}`,
        tg: `https://t.me/share/url?url=${url}&text=${title}`
      };

      if (type === 'copy') {
        copyText(window.location.href, 'Ссылка скопирована');
        return;
      }
      if (links[type]) {
        window.open(links[type], '_blank', 'noopener,noreferrer,width=680,height=560');
      }
    });
  });

  $$('[data-copy-rss]').forEach((button) => {
    button.addEventListener('click', () => {
      const rssUrl = new URL('rss.xml', window.location.href).href;
      copyText(rssUrl, 'Ссылка на RSS скопирована');
    });
  });

  $$('.card, .cat-card').forEach((card) => {
    card.classList.add('card--spotlight');
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    });
  });

  const hero = $('.hero');
  const heroVisual = $('.hero__visual');

  if (hero && heroVisual && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    let raf = 0;
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        heroVisual.style.transform = `translate3d(${x * 10}px, ${y * 8}px, 0)`;
      });
    });
    hero.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      heroVisual.style.transform = '';
    });
  }

  function pageSizeForViewport() {
    if (window.matchMedia('(max-width: 640px)').matches) return 3;
    if (window.matchMedia('(max-width: 960px)').matches) return 6;
    return 12;
  }

  function pageRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
    const pages = new Set([1, total, current - 1, current, current + 1]);
    if (current <= 3) [2, 3, 4].forEach((page) => pages.add(page));
    if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((page) => pages.add(page));
    const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
    const output = [];
    sorted.forEach((page, index) => {
      if (index && page - sorted[index - 1] > 1) output.push('…');
      output.push(page);
    });
    return output;
  }

  function initFilterGrid() {
    const grid = $('[data-filter-grid]');
    if (!grid) return;

    const items = $$('[data-article]', grid);
    const chips = $$('[data-filter]');
    const pagination = $('[data-pagination]');
    const empty = $('[data-empty]');
    const resultsCount = $('[data-results-count]');
    const params = new URLSearchParams(window.location.search);
    const query = normalize(params.get('q') || '');
    const requestedTag = normalize(params.get('tag') || '');
    const requestedCategory = normalize(params.get('cat') || '');
    let pageSize = pageSizeForViewport();
    let activeFilter = 'all';
    let page = 1;

    if (requestedTag) {
      const chip = chips.find((item) => normalize(item.dataset.filter) === requestedTag);
      if (chip) activeFilter = chip.dataset.filter;
    } else if (requestedCategory) {
      const chip = chips.find((item) => normalize(item.dataset.filter) === requestedCategory);
      if (chip) activeFilter = chip.dataset.filter;
    }

    chips.forEach((chip) => {
      chip.classList.toggle('is-active', chip.dataset.filter === activeFilter);
    });

    const getFiltered = () => items.filter((item) => {
      const filter = normalize(activeFilter);
      if (filter !== 'all') {
        const tags = normalize(item.dataset.tags || '').split('|');
        const matchesFilter = tags.includes(filter) || normalize(item.dataset.cat) === filter;
        if (!matchesFilter) return false;
      }
      if (query && !normalize(item.textContent).includes(query)) return false;
      return true;
    });

    function renderPagination(pages) {
      if (!pagination) return;
      pagination.hidden = pages <= 1;
      if (pages <= 1) {
        pagination.innerHTML = '';
        return;
      }

      const range = pageRange(page, pages);
      const buttons = [
        `<button class="page-btn" type="button" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Предыдущая страница">←</button>`
      ];

      range.forEach((value) => {
        if (value === '…') {
          buttons.push('<span class="page-gap" aria-hidden="true">…</span>');
        } else {
          buttons.push(`<button class="page-btn ${value === page ? 'is-active' : ''}" type="button" data-page="${value}" ${value === page ? 'aria-current="page"' : ''}>${value}</button>`);
        }
      });

      buttons.push(`<button class="page-btn" type="button" data-page="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="Следующая страница">→</button>`);
      pagination.innerHTML = buttons.join('');
    }

    function render() {
      const list = getFiltered();
      const pages = Math.max(1, Math.ceil(list.length / pageSize));
      page = Math.min(Math.max(page, 1), pages);

      items.forEach((item) => {
        item.hidden = true;
      });
      list.slice((page - 1) * pageSize, page * pageSize).forEach((item) => {
        item.hidden = false;
      });

      if (empty) empty.hidden = list.length > 0;
      if (resultsCount) {
        resultsCount.textContent = list.length
          ? `Найдено материалов: ${list.length}`
          : 'Ничего не найдено';
      }
      renderPagination(pages);
    }

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((item) => item.classList.remove('is-active'));
        chip.classList.add('is-active');
        activeFilter = chip.dataset.filter;
        page = 1;
        render();

        const url = new URL(window.location.href);
        if (activeFilter === 'all') {
          url.searchParams.delete('tag');
          url.searchParams.delete('cat');
        } else {
          const isCategory = items.some((item) => item.dataset.cat === activeFilter);
          url.searchParams.set(isCategory ? 'cat' : 'tag', activeFilter);
          url.searchParams.delete(isCategory ? 'tag' : 'cat');
        }
        history.replaceState({}, '', url);
      });
    });

    if (pagination) {
      pagination.addEventListener('click', (event) => {
        const button = event.target.closest('[data-page]');
        if (!button || button.disabled) return;
        page = parseInt(button.dataset.page, 10);
        render();
        grid.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
    }

    render();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const next = pageSizeForViewport();
        if (next === pageSize) return;
        pageSize = next;
        page = 1;
        render();
      }, 160);
    });
  }

  initFilterGrid();

  const currentPath = window.location.pathname.replace(/\\/g, '/');
  $$('.main-nav a, .mobile-menu__nav a').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#')) return;
    const clean = href.replace(/^\.\.\//, '').replace(/^\.\//, '').replace(/index\.html$/, '');
    if (clean && currentPath.includes(clean.replace(/\.html$/, ''))) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });

  if (!reduceMotion) {
    document.documentElement.classList.add('js');
    const main = $('main');
    if (main) main.classList.add('page-enter');
  }

  document.documentElement.dataset.ready = 'true';
})();
