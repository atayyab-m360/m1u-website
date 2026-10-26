(function () {
  'use strict';
  var M = window.M1U;
  var S = M.site;

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function link(url) { return url; }

  function currentPath() {
    var p = location.pathname.replace(/index\.html$/, '');
    return p.endsWith('/') ? p : p + '/';
  }

  function pointsHere(url) {
    if (!url) return true;
    var path = url.split('#')[0] || '/';
    if (!path.endsWith('/')) path += '/';
    return path === currentPath() && currentPath() !== '/';
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function fmtDate(iso, withWeekday) {
    if (!iso) return '';
    var p = iso.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    var opts = { month: 'long', day: 'numeric', year: 'numeric' };
    if (withWeekday) opts.weekday = 'long';
    return d.toLocaleDateString('en-US', opts);
  }

  function visible(item) { return true; }

  function statusPill(key, label, map) {
    var text = label || (map || M.statuses)[key];
    if (!key || !text) return '';
    return '<span class="status status--' + esc(key) + '">' + esc(text) + '</span>';
  }

  function pillFor(item, key, label, map) { return statusPill(key, label, map); }

  function action(cfg, fallbackHref) {
    if (!cfg) return '';
    var href = cfg.href || fallbackHref || null;
    if (href) {
      var ext = /^https?:/.test(href);
      return '<a class="m-btn m-btn--primary" href="' + esc(link(href)) + '"' +
        (ext ? ' target="_blank" rel="noopener" aria-label="' + esc(cfg.label) + ' (opens in a new tab)"' : '') + '>' + esc(cfg.label) + '</a>';
    }
    
    return '';
  }

  function learnMore(url, label, name) {
    if (!url || pointsHere(url)) return '';
    return '<a class="m-btn m-btn--secondary" href="' + esc(link(url)) + '" aria-label="' +
      esc((label || 'Learn more') + ': ' + name) + '">' + esc(label || 'Learn more') + '</a>';
  }

  function paragraphs(list) {
    return (list || []).map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('');
  }

  function actions(html) {
    return html.trim() ? '<div class="m-card-actions">' + html + '</div>' : '';
  }

  function kindLabel(item) { return M.relationships[item.relationship] || ''; }

  function grid(el, n, cols) {
    var max = +cols || 3;
    var c = Math.max(1, Math.min(max, n === 4 && max === 3 ? 2 : n));
    el.className = 'card-grid ' + ['', 'is-single', 'is-two', 'is-three', 'is-four'][c];
  }

  function setGroup(el, show) {
    var wrap = el.closest('[data-m1u-group]');
    if (wrap) wrap.hidden = !show;
    el.hidden = !show;
  }

  function hasImpact() { return M.impact.length > 0; }

  function registrationClosed(item) {
    var e = item.event;
    return !!(e && (e.registrationUntil || e.date) < today());
  }

  function eventDetails(e, compact) {
    if (!e) return '';
    if (compact) {
      var p = e.date.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
      var short = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return '<p class="m-card-when"><span aria-hidden="true">📅</span><span>' + esc(short) +
        (e.time ? ' · <span class="nowrap">' + esc(e.time) + '</span>' : '') + '</span></p>';
    }
    return '<dl class="m-card-meta m-card-event">' +
      metaRow('Date', fmtDate(e.date, true)) +
      metaRow('Time', e.time) +
      metaRow('Format', e.format) +
      metaRow('Speakers', (e.speakers || []).join(' and ')) +
    '</dl>';
  }

  function initiativeCard(item, variant) {
    var full = variant === 'full';
    var closed = registrationClosed(item);
    var status = closed ? 'closed' : item.status;
    var emphasis = status === 'active' || status === 'registration';
    return '' +
      '<article class="m-card' + (emphasis ? ' is-emphasis' : '') + '"' + (full ? ' id="' + esc(item.id) + '"' : '') + '>' +
        '<div class="m-card-top"><span class="m-card-kind">' + esc(kindLabel(item)) + '</span>' +
          pillFor(item, status, closed ? null : item.statusLabel) + '</div>' +
        '<div class="m-card-body">' +
          '<h3>' + esc(item.name) + '</h3>' +
          (full && item.detailsReplaceSummary ? '' : '<p>' + esc(item.summary) + '</p>') +
          (full ? paragraphs(item.details) : '') +
          eventDetails(item.event, !full) +
        '</div>' +
        actions(learnMore(item.learnMore, item.learnMoreLabel, item.name) + (closed ? '' : action(item.action))) +
      '</article>';
  }

  function ctaStatus(item) {
    if (item.status === 'active' && item.period && item.period.end && item.period.end < today()) return 'ended';
    return item.status;
  }

  function ctaCard(item, variant) {
    var full = variant === 'full';
    var st = ctaStatus(item);
    var period = '';
    if (item.period && (item.period.start || item.period.end)) {
      var txt = item.period.start && item.period.end
        ? fmtDate(item.period.start) + ' to ' + fmtDate(item.period.end)
        : item.period.end ? 'Through ' + fmtDate(item.period.end) : 'From ' + fmtDate(item.period.start);
      period = '<dl class="m-card-meta"><div><dt>Campaign period</dt><dd>' + esc(txt) + '</dd></div></dl>';
    }
    var support = (st === 'active') ? action(item.support, item.minar360DonationUrl) : '';
    return '' +
      '<article class="m-card' + (st === 'active' ? ' is-emphasis' : '') + '"' + (full ? ' id="' + esc(item.id) + '"' : '') + '>' +
        '<div class="m-card-top"><span class="m-card-kind">' + esc(kindLabel(item)) + '</span>' +
          pillFor(item, st) + '</div>' +
        '<div class="m-card-body">' +
          '<h3>' + esc(item.name) + '</h3>' +
          (item.location ? '<div class="m-card-loc"><span aria-hidden="true">📍</span>' + esc(item.location) + '</div>' : '') +
          '<p>' + esc(item.summary) + '</p>' +
          (full ? paragraphs(item.details) : '') +
          period +
        '</div>' +
        actions(learnMore(item.learnMore, null, item.name) + support) +
      '</article>';
  }

  function metaRow(label, value) {
    if (value == null || value === '') {
      
      return '';
    }
    return '<div><dt>' + esc(label) + '</dt><dd>' + esc(Array.isArray(value) ? value.join('; ') : value) + '</dd></div>';
  }

  function impactCard(item) {
    var rows = metaRow('M1U contribution', item.contribution) +
               metaRow('Timeframe', item.timeframe) +
               metaRow('Current status', item.currentStatus || (item.status ? M.statuses[item.status] : null)) +
               metaRow('Results', item.outcomes);
    var name = item.org;
    return '' +
      '<article class="m-card" id="' + esc(item.id) + '">' +
        (item.image ? '<div class="m-card-media"><img src="' + esc(item.image.src) + '" alt="' + esc(item.image.alt || '') + '" loading="lazy"></div>' : '') +
        '<div class="m-card-top"><span class="m-card-kind">' + esc(M.relationships[item.relationship] || '') + '</span>' +
          pillFor(item, item.status, null, null, true) + '</div>' +
        '<div class="m-card-body">' +
          '<h3>' + esc(name) + '</h3>' +
          (rows ? '<dl class="m-card-meta">' + rows + '</dl>' : '') +
        '</div>' +
      '</article>';
  }

  function f4tEventCard(e) {
    var when = fmtDate(e.date, true) + (e.time ? ' · ' + e.time : '');
    return '' +
      '<article class="m-card' + (e.status === 'scheduled' ? ' is-emphasis' : '') + '" id="' + esc(e.id) + '">' +
        '<div class="m-card-top"><span class="m-card-kind">Distribution</span>' +
          pillFor(e, e.status, null, M.eventStatuses, true) + '</div>' +
        '<div class="m-card-body">' +
          '<h3>' + esc(when) + '</h3>' +
          (e.location ? '<div class="m-card-loc"><span aria-hidden="true">📍</span>' + esc(e.location) + '</div>' : '') +
          (e.note ? '<p>' + esc(e.note) + '</p>' : '') +
        '</div>' +
        actions(e.status === 'scheduled' ? action(e.signup) : '') +
      '</article>';
  }

  function f4tNeedCard(n) {
    return '' +
      '<article class="m-card" id="' + esc(n.id) + '">' +
        '<div class="m-card-top"><span class="m-card-kind">' + esc(n.type === 'supplies' ? 'Supplies needed' : 'Support needed') + '</span>' +
          pillFor(n, null, null, null, true) + '</div>' +
        '<div class="m-card-body"><h3>' + esc(n.title) + '</h3>' + (n.detail ? '<p>' + esc(n.detail) + '</p>' : '') +
          (n.until ? '<dl class="m-card-meta"><div><dt>Needed by</dt><dd>' + esc(fmtDate(n.until)) + '</dd></div></dl>' : '') +
        '</div>' +
        actions(action(n.action)) +
      '</article>';
  }

  function f4tResultCard(r) {
    var figs = (r.figures || []).map(function (f) { return metaRow(f.label, f.value); }).join('');
    return '' +
      '<article class="m-card" id="' + esc(r.id) + '">' +
        '<div class="m-card-top"><span class="m-card-kind">' + esc(r.period || '') + '</span>' +
          pillFor(r, null, null, null, true) + '</div>' +
        '<div class="m-card-body"><h3>' + esc(r.title) + '</h3>' + (r.summary ? '<p>' + esc(r.summary) + '</p>' : '') +
          (figs ? '<dl class="m-card-meta">' + figs + '</dl>' : '') +
        '</div>' +
      '</article>';
  }

  function reviewNote() { return ''; }

  function renderInitiatives(el) {
    var filter = el.dataset.filter, variant = el.dataset.variant || 'summary';
    var items = M.initiatives.filter(function (i) {
      return i.status !== 'archived' && visible(i) && (filter !== 'featured' || i.featured);
    });
    grid(el, items.length, el.dataset.columns);
    el.innerHTML = items.map(function (i) { return initiativeCard(i, variant); }).join('');
  }

  function renderCalls(el) {
    var group = el.dataset.group || 'current', variant = el.dataset.variant || 'summary';
    var items = M.callsToAction.filter(function (c) {
      var st = ctaStatus(c);
      if (st === 'archived' || !visible(c)) return false;
      if (group === 'past') return st === 'completed' || st === 'ended';
      return st === 'active' && (el.dataset.filter !== 'featured' || c.featured);
    });
    if (!items.length) {
      if (group === 'past') { setGroup(el, false); return; }
      el.className = '';
      el.innerHTML = '<div class="empty-state"><h3>No open calls to action right now</h3>' +
        '<p>When M1U verifies a community need, it is featured here with a clear way to help. ' +
        'To bring a need to our attention, <a href="mailto:' + esc(S.email) + '">contact us</a>.</p></div>';
      return;
    }
    setGroup(el, true);
    grid(el, items.length, '2');
    el.innerHTML = items.map(function (c) { return ctaCard(c, variant); }).join('');
  }

  function renderImpact(el) {
    var items = M.impact.filter(function (i) { return visible(i, true); });
    var section = el.closest('[data-m1u-hide-empty]');
    if (section) section.hidden = !items.length;
    if (!items.length) { el.innerHTML = ''; return; }
    grid(el, items.length);
    el.innerHTML = items.map(impactCard).join('');
  }

  function renderMetrics(el) {
    var items = M.metrics;
    setGroup(el, items.length > 0);
    if (!items.length) return;
    el.className = 'metrics';
    el.setAttribute('role', 'list');
    el.innerHTML = items.map(function (m) {
      return '<div class="metric" role="listitem"><span class="metric-value">' + (m.value != null ? esc(m.value) : '') + '</span>' +
        '<span class="metric-label">' + esc(m.label) + '</span></div>';
    }).join('');
  }

  var F = M.food4thought || {};

  function renderF4tOverview(el) {
    var item = M.initiatives.filter(function (i) { return i.id === 'food4thought'; })[0];
    if (!item) return;
    el.innerHTML = '<div class="f4t-status">' + pillFor(item, item.status, item.statusLabel) + '</div>' +
      '<p class="f4t-lede">' + esc(item.summary) + '</p>' + paragraphs(item.details);
  }

  function renderF4tVolunteer(el) {
    var html = action(F.volunteer);
    setGroup(el, !!html);
    el.innerHTML = html;
  }

  function renderF4tList(el, list, card, noteKey) {
    var items = (list || []).filter(function (x) { return visible(x, true); });
    if (!items.length) {
      var note = reviewNote(noteKey);
      setGroup(el, !!note);
      el.className = ''; el.innerHTML = note;
      return;
    }
    setGroup(el, true);
    grid(el, items.length, '2');
    el.innerHTML = items.map(card).join('');
  }

  function renderF4tEvents(el) {
    var now = today();
    var upcoming = (F.events || []).filter(function (e) { return e.date >= now && e.status !== 'completed'; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    renderF4tList(el, upcoming, f4tEventCard, 'events');
  }

  function renderF4tNeeds(el) {
    var now = today();
    var current = (F.needs || []).filter(function (n) { return !n.until || n.until >= now; });
    renderF4tList(el, current, f4tNeedCard, 'needs');
  }

  function renderF4tResults(el) {
    renderF4tList(el, F.results, f4tResultCard, 'results');
  }

  function applyRequirements() {
    if (hasImpact()) return;
    document.querySelectorAll('[data-m1u-requires="impact"]').forEach(function (el) {
      if (el.tagName === 'A') el.replaceWith(document.createTextNode(el.textContent));
      else el.hidden = true;
    });
  }

  var NAV = [
    { label: 'About',           href: '/#about' },
    { label: 'Initiatives',     href: '/initiatives/' },
    { label: 'Calls to Action', href: '/calls-to-action/' },
    { label: 'Our Impact',      href: '/impact/', requires: 'impact' },
    { label: 'Our People',      href: '/#people' }
  ];

  function logoImg(cls, alt) {
    return '<img src="' + esc(S.logo) + '" alt="' + esc(alt) + '" class="' + cls + '" ' +
      'onerror="this.onerror=null;this.src=\'' + esc(S.logoFallback) + '\'">';
  }

  function isCurrent(href) {
    var here = currentPath();
    if (href.indexOf('#') !== -1) return false;
    return href === here || (href !== '/' && here.indexOf(href) === 0);
  }

  function donateButton() {
    if (S.donateUrl) return '<a href="' + esc(S.donateUrl) + '" class="nav-donate">Donate</a>';
    
    return '';
  }

  function renderNav(el) {
    var showImpact = hasImpact();
    var links = NAV.filter(function (n) { return n.requires !== 'impact' || showImpact; }).map(function (n) {
      return '<li><a href="' + esc(link(n.href)) + '"' + (isCurrent(n.href) ? ' aria-current="page"' : '') + '>' + esc(n.label) + '</a></li>';
    }).join('');
    el.outerHTML = '' +
      '<a class="skip-link" href="#main">Skip to content</a>' +
      '<nav class="site-nav" aria-label="Main">' +
        '<a href="' + esc(link('/')) + '" class="nav-logo" aria-label="Mission 1 Ummah home">' +
          logoImg('nav-logo-img', '') +
          '<span class="nav-logo-text">Mission 1 Ummah</span></a>' +
        '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="navMenu" aria-label="Open menu">' +
          '<span class="nav-toggle-bars" aria-hidden="true"></span></button>' +
        '<div class="nav-menu" id="navMenu">' +
          '<ul class="nav-links">' + links + '</ul>' +
          '<div class="nav-actions">' +
            '<a href="' + esc(S.bookingUrl) + '" class="nav-outline" target="_blank" rel="noopener">Book a Call</a>' +
            donateButton() +
          '</div>' +
        '</div>' +
      '</nav>';
    wireNav();
  }

  function wireNav() {
    var btn = document.querySelector('.nav-toggle');
    var menu = document.getElementById('navMenu');
    if (!btn || !menu) return;
    function set(open) {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
    }
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { set(false); btn.focus(); }
    });
    window.matchMedia('(min-width: 1181px)').addEventListener('change', function (mq) { if (mq.matches) set(false); });
  }

  function partnersSection() {
    var items = (M.partners || []).filter(function (x) { return visible(x, true) && x.url; });
    if (!items.length) return '';
    return '' +
      '<section class="partners" aria-labelledby="partners-title">' +
        '<div class="container">' +
          '<h2 class="partners-title" id="partners-title">Our Partners</h2>' +
          '<ul class="partners-list">' + items.map(function (x) {
            var inner = x.logo
              ? '<img src="' + esc(x.logo.src) + '" alt="' + esc(x.name) + '" loading="lazy">'
              : '<span class="partner-name">' + esc(x.name) + '</span>';
            inner += '<svg class="partner-ext" aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="14" height="14"><path d="M6 3h7v7M13 3 6.5 9.5M11 9.5V13H3V5h3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            return '<li>' + pillFor(x, null, null, null, true) +
              '<a class="partner-link' + (x.logo ? ' has-logo' : '') + '" href="' + esc(x.url) + '" target="_blank" rel="noopener" ' +
              'aria-label="' + esc(x.name) + ' (opens in a new tab)">' + inner + '</a></li>';
          }).join('') + '</ul>' +
        '</div>' +
      '</section>';
  }

  function renderFooter(el) {
    function li(label, href, ext) {
      return '<li><a href="' + esc(ext ? href : link(href)) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(label) + '</a></li>';
    }
    el.outerHTML = partnersSection() +
      '<footer class="site-footer">' +
        '<div class="footer-top">' +
          '<div class="f-brand">' + logoImg('f-logo', 'Mission 1 Ummah') +
            '<p>Mission 1 Ummah unites masajid, nonprofits, businesses, and community leaders around a shared mission of service.</p>' +
            '<div class="f-socials"><a href="' + esc(S.instagram) + '">Instagram</a><a href="' + esc(S.youtube) + '">YouTube</a></div>' +
          '</div>' +
          '<div class="f-col"><h4>Organization</h4><ul>' +
            li('About M1U', '/#about') + li('Initiatives', '/initiatives/') + li('Thabaat', '/#thabaat') +
            li('Food4Thought', '/initiatives/food4thought/') + li('Calls to Action', '/calls-to-action/') +
            (hasImpact() ? li('Our Impact', '/impact/') : '') +
            li('Our People', '/#people') + li('Imam Support & Education', '/initiatives/#imam-support') +
          '</ul></div>' +
          '<div class="f-col"><h4>Connect</h4><ul>' +
            li('Book a Call', S.bookingUrl, true) +
            '<li><a href="mailto:' + esc(S.email) + '">Contact Us</a></li>' +
            li('Volunteer', S.volunteerUrl, true) +
            '<li><a href="' + esc(S.minar360) + '">Minar360</a></li>' +
          '</ul></div>' +
        '</div>' +
        '<div class="f-notice" id="giving" tabindex="-1">' +
          '<strong>A note on giving:</strong> M1U is not accepting online donations through this site at this time. ' +
          'If you would like to support our work, please <a href="mailto:' + esc(S.email) + '">contact us directly</a> and a member of our team will follow up.' +
        '</div>' +
        '<div class="footer-bottom">' +
          '<p>© ' + new Date().getFullYear() + ' M1U Foundation Inc. All Rights Reserved.</p>' +
          '<p class="f-powered">Community platform by <strong>Minar360</strong></p>' +
        '</div>' +
      '</footer>';
  }

  var RENDER = {
    nav: renderNav, footer: renderFooter,
    initiatives: renderInitiatives, 'calls-to-action': renderCalls,
    impact: renderImpact, metrics: renderMetrics,
    'f4t-overview': renderF4tOverview, 'f4t-volunteer': renderF4tVolunteer,
    'f4t-events': renderF4tEvents, 'f4t-needs': renderF4tNeeds, 'f4t-results': renderF4tResults
  };

  function mount() {
    document.querySelectorAll('[data-m1u]').forEach(function (el) {
      var fn = RENDER[el.dataset.m1u];
      if (fn) fn(el);
    });
    applyRequirements();
    
    if (location.hash.length > 1) {
      var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t) t.scrollIntoView();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
