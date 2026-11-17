'use strict';

/* =========================================================================
   Image Format Auditor
   Crawls a whole website and reports every image whose format is not
   allowed (WebP/SVG by default). UI strings live in i18n.js.
   ========================================================================= */

const $ = (id) => document.getElementById(id);
const t = (key, params) => I18N.t(key, params);
const num = (n) => I18N.num(n);
const numLocale = () => I18N.LANGS[I18N.lang].num;

const IMG_ACCEPT = 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8';
const PAGE_ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';

const EXT_FORMAT = {
  jpg: 'jpeg', jpeg: 'jpeg', jpe: 'jpeg', jfif: 'jpeg', pjpeg: 'jpeg',
  png: 'png', apng: 'png', gif: 'gif', webp: 'webp', svg: 'svg', svgz: 'svg',
  avif: 'avif', bmp: 'bmp', ico: 'ico', cur: 'ico', tif: 'tiff', tiff: 'tiff',
  heic: 'heic', heif: 'heic', jxl: 'jxl'
};
const CT_FORMAT = {
  'image/jpeg': 'jpeg', 'image/jpg': 'jpeg', 'image/pjpeg': 'jpeg', 'image/png': 'png', 'image/apng': 'png',
  'image/gif': 'gif', 'image/webp': 'webp', 'image/svg+xml': 'svg', 'image/avif': 'avif',
  'image/bmp': 'bmp', 'image/x-ms-bmp': 'bmp', 'image/x-icon': 'ico', 'image/vnd.microsoft.icon': 'ico',
  'image/tiff': 'tiff', 'image/heic': 'heic', 'image/heif': 'heic', 'image/jxl': 'jxl'
};
// File extensions that are never HTML pages and must not be crawled as pages
const NON_PAGE_EXT = /\.(jpe?g|jpe|jfif|png|apng|gif|webp|svgz?|avif|bmp|ico|tiff?|heic|heif|jxl|pdf|zip|rar|7z|gz|tgz|tar|mp4|m4v|mp3|m4a|webm|mov|avi|mkv|wav|ogg|flac|docx?|xlsx?|pptx?|csv|css|js|mjs|json|xml|rss|atom|txt|woff2?|ttf|otf|eot|exe|msi|dmg|apk|iso)$/i;
const NON_IMAGE_EXT = /\.(css|js|mjs|json|woff2?|ttf|otf|eot|html?|php|aspx?|pdf|mp4|webm|mp3)$/i;
const TRACKING_PARAMS = /^(utm_[a-z]+|fbclid|gclid|yclid|msclkid|mc_cid|mc_eid|_ga|ref)$/i;

const srcLabel = (s) => (s === 'link' ? t('srcLink') : SOURCE_LABEL[s] || s);
const SOURCE_LABEL = {
  img: '<img>', srcset: 'srcset', picture: '<picture>', css: 'CSS', style: 'style', meta: 'og/meta',
  icon: 'favicon', link: 'link', poster: 'poster', preload: 'preload', data: 'data-*', svgimage: 'svg image'
};

/* ------------------------------ state ------------------------------ */
let S = null;
let ui = { sortKey: 'size', sortDir: -1, page: 0, perPage: 100, fmt: '', q: '', showAll: false };
let renderTimer = null;

function newState(cfg) {
  return {
    cfg,
    running: false, paused: false, stopped: false, crawlDone: false,
    queue: [], seen: new Set(), processed: new Set(), active: 0,
    pagesDone: 0, pageErrors: [],
    images: new Map(),          // imageUrl -> record
    imgQueue: [], imgActive: 0,
    cssCache: new Map(),        // cssUrl -> Promise<Array<url>>
    startedAt: Date.now()
  };
}

/* ------------------------------ helpers ------------------------------ */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bareHost = (h) => h.toLowerCase().replace(/^www\./, '');

function inScope(u) {
  if (!/^https?:$/.test(u.protocol)) return false;
  const h = bareHost(u.hostname);
  return h === S.cfg.rootHost || (S.cfg.subdomains && h.endsWith('.' + S.cfg.rootHost));
}

function pageKey(u) {
  let path = u.pathname.replace(/\/+$/, '') || '/';
  let search = '';
  if (!S.cfg.ignoreQuery) {
    const p = new URLSearchParams(u.search);
    [...p.keys()].forEach((k) => { if (TRACKING_PARAMS.test(k)) p.delete(k); });
    p.sort();
    const s = p.toString();
    search = s ? '?' + s : '';
  }
  return bareHost(u.hostname) + path + search;
}

function cleanPageUrl(u) {
  const c = new URL(u.href);
  c.hash = '';
  if (S.cfg.ignoreQuery) c.search = '';
  else {
    const p = new URLSearchParams(c.search);
    [...p.keys()].forEach((k) => { if (TRACKING_PARAMS.test(k)) p.delete(k); });
    c.search = p.toString();
  }
  return c.href;
}

function isExcluded(href) {
  return S.cfg.exclude.some((pat) => pat && href.toLowerCase().includes(pat.toLowerCase()));
}

function toUrl(raw, base) {
  if (!raw) return null;
  raw = String(raw).trim().replace(/^['"]|['"]$/g, '');
  if (!raw || /^(data:|blob:|javascript:|mailto:|tel:|#|about:)/i.test(raw)) return null;
  try { return new URL(raw, base); } catch { return null; }
}

function extFormat(u) {
  const m = u.pathname.toLowerCase().match(/\.([a-z0-9]+)$/);
  if (m && EXT_FORMAT[m[1]]) return EXT_FORMAT[m[1]];
  // Common CDN query params such as ?format=webp or ?fm=webp
  const q = u.searchParams;
  const f = (q.get('format') || q.get('fm') || q.get('f') || q.get('output') || '').toLowerCase();
  if (EXT_FORMAT[f]) return EXT_FORMAT[f];
  // e.g. Next.js /_next/image?url=/a.jpg: the server decides the final format → unknown until verified
  return '';
}

function ctFormat(ct) {
  if (!ct) return '';
  const t = ct.split(';')[0].trim().toLowerCase();
  if (CT_FORMAT[t]) return CT_FORMAT[t];
  if (t.startsWith('image/')) return t.slice(6);
  return '';
}

function fmtSize(b) {
  if (b == null || isNaN(b)) return '—';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(2) + ' MB';
}

function parseSrcset(v) {
  if (!v) return [];
  // Split on commas followed by whitespace (URLs themselves may contain commas)
  return v.split(/,\s+|,(?=\S+\s+\d)/).map((s) => s.trim().split(/\s+/)[0]).filter(Boolean);
}

function cssUrls(text) {
  const out = [];
  const re = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;
  let m;
  while ((m = re.exec(text))) out.push(m[2]);
  // image-set("a.png" 1x, ...) without url()
  const re2 = /image-set\(([^)]*)\)/gi;
  while ((m = re2.exec(text))) {
    (m[1].match(/(['"])(.*?)\1/g) || []).forEach((s) => out.push(s.slice(1, -1)));
  }
  return out;
}

function cssImports(text) {
  const out = [];
  const re = /@import\s+(?:url\()?\s*(['"]?)([^'")\s;]+)\1\s*\)?/gi;
  let m;
  while ((m = re.exec(text))) out.push(m[2]);
  return out;
}

async function fetchWithTimeout(url, opts = {}, ms = 25000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(url, { credentials: 'include', redirect: 'follow', cache: 'no-store', ...opts, signal: ac.signal });
  } finally { clearTimeout(t); }
}

/* ------------------------------ queueing ------------------------------ */
function enqueuePage(u) {
  if (!u || !inScope(u)) return;
  if (NON_PAGE_EXT.test(u.pathname)) return;
  const href = cleanPageUrl(u);
  if (isExcluded(href)) return;
  const key = pageKey(u);
  if (S.seen.has(key)) return;
  if (S.seen.size >= S.cfg.maxPages) return;
  S.seen.add(key);
  S.queue.push(href);
}

function addImage(u, pageUrl, source, note) {
  if (!u || !/^https?:$/.test(u.protocol)) return;
  const c = new URL(u.href); c.hash = '';
  const key = c.href;
  let rec = S.images.get(key);
  if (!rec) {
    rec = {
      url: key, extFmt: extFormat(c), format: '', contentType: '', size: null, status: null,
      checked: false, notImage: false, error: '', pages: new Set(), sources: new Set(), notes: new Set()
    };
    rec.format = rec.extFmt || '';
    S.images.set(key, rec);
    if (S.cfg.verify) S.imgQueue.push(rec);
    else rec.checked = true;
  }
  if (pageUrl) rec.pages.add(pageUrl);
  if (source) rec.sources.add(source);
  if (note) rec.notes.add(note);
}

/* ------------------------------ page processing ------------------------------ */
async function processPage(url) {
  let res;
  try {
    res = await fetchWithTimeout(url, { headers: { Accept: PAGE_ACCEPT } });
  } catch (e) {
    S.pageErrors.push({ url, error: e.name === 'AbortError' ? 'timeout' : (e.message || 'network error') });
    return;
  }
  const finalUrl = new URL(res.url || url);
  // Redirected off-site → ignore; final URL already processed → duplicate
  if (!inScope(finalUrl)) { try { res.body && res.body.cancel(); } catch {} return; }
  const fk = pageKey(finalUrl);
  if (S.processed.has(fk)) { try { res.body && res.body.cancel(); } catch {} return; }
  S.processed.add(fk);
  S.seen.add(fk);
  if (!res.ok) {
    S.pageErrors.push({ url, error: 'HTTP ' + res.status });
    return;
  }
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (ct.startsWith('image/')) { addImage(finalUrl, null, 'link'); return; }
  if (ct && !ct.includes('html') && !ct.includes('xml')) return;

  const html = await res.text();
  S.pagesDone++;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const pageUrl = cleanPageUrl(finalUrl);
  let base = finalUrl.href;
  const baseEl = doc.querySelector('base[href]');
  if (baseEl) { try { base = new URL(baseEl.getAttribute('href'), finalUrl).href; } catch {} }

  extractImages(doc, base, pageUrl);
  if (S.cfg.parseCss) await extractCss(doc, base, pageUrl);

  // Links
  doc.querySelectorAll('a[href], area[href]').forEach((a) => {
    const u = toUrl(a.getAttribute('href'), base);
    if (!u) return;
    const fmt = extFormat(u);
    if (fmt && /\.(jpe?g|jpe|jfif|png|gif|webp|svgz?|avif|bmp|tiff?|heic|jxl)$/i.test(u.pathname)) {
      addImage(u, pageUrl, 'link');
      return;
    }
    enqueuePage(u);
  });
  doc.querySelectorAll('link[rel~="next"][href], link[rel~="prev"][href], link[rel="alternate"][hreflang][href]').forEach((l) => {
    enqueuePage(toUrl(l.getAttribute('href'), base));
  });
}

function extractImages(doc, base, pageUrl) {
  const add = (raw, src, note) => addImage(toUrl(raw, base), pageUrl, src, note);
  const LAZY = ['src', 'data-src', 'data-lazy-src', 'data-original', 'data-lazy', 'data-url', 'data-full', 'data-large_image', 'data-zoom-image'];
  const LAZY_SET = ['srcset', 'data-srcset', 'data-lazy-srcset'];

  doc.querySelectorAll('img, input[type=image]').forEach((img) => {
    let note = '';
    const pic = img.closest('picture');
    if (pic) {
      const modern = [...pic.querySelectorAll('source')].some((s) => {
        const t = (s.getAttribute('type') || '').toLowerCase();
        const ss = (s.getAttribute('srcset') || s.getAttribute('data-srcset') || '').toLowerCase();
        return /webp|avif|svg/.test(t) || /\.(webp|avif|svg)(\s|$|\?|,)/.test(ss);
      });
      if (modern) note = 'pictureFallback';
    }
    LAZY.forEach((a) => img.hasAttribute(a) && add(img.getAttribute(a), pic ? 'picture' : 'img', note));
    LAZY_SET.forEach((a) => parseSrcset(img.getAttribute(a)).forEach((s) => add(s, 'srcset', note)));
  });

  doc.querySelectorAll('source').forEach((s) => {
    const parent = s.parentElement && s.parentElement.tagName;
    if (parent === 'VIDEO' || parent === 'AUDIO') return;
    LAZY_SET.forEach((a) => parseSrcset(s.getAttribute(a)).forEach((x) => add(x, 'picture')));
    if (s.hasAttribute('src') && parent === 'PICTURE') add(s.getAttribute('src'), 'picture');
  });

  doc.querySelectorAll('video[poster]').forEach((v) => add(v.getAttribute('poster'), 'poster'));

  doc.querySelectorAll('image').forEach((im) => {
    add(im.getAttribute('href') || im.getAttribute('xlink:href'), 'svgimage');
  });

  doc.querySelectorAll('[data-bg],[data-background],[data-background-image],[data-image],[data-thumb],[data-bg-src]').forEach((el) => {
    ['data-bg', 'data-background', 'data-background-image', 'data-image', 'data-thumb', 'data-bg-src'].forEach((a) => {
      const v = el.getAttribute(a);
      if (!v) return;
      const urls = /url\(/i.test(v) ? cssUrls(v) : [v];
      urls.forEach((x) => {
        const u = toUrl(x, base);
        if (u && !NON_IMAGE_EXT.test(u.pathname)) addImage(u, pageUrl, 'data');
      });
    });
  });

  doc.querySelectorAll('[style]').forEach((el) => {
    cssUrls(el.getAttribute('style')).forEach((x) => addCssImage(toUrl(x, base), pageUrl, 'style'));
  });
  doc.querySelectorAll('style').forEach((st) => {
    cssUrls(st.textContent).forEach((x) => addCssImage(toUrl(x, base), pageUrl, 'style'));
  });

  doc.querySelectorAll('meta[property="og:image"], meta[property="og:image:url"], meta[property="og:image:secure_url"], meta[name="twitter:image"], meta[name="twitter:image:src"], meta[itemprop="image"], meta[name="msapplication-TileImage"]').forEach((m) => {
    add(m.getAttribute('content'), 'meta');
  });

  doc.querySelectorAll('link[rel~="icon"], link[rel~="apple-touch-icon"], link[rel~="apple-touch-icon-precomposed"], link[rel~="mask-icon"]').forEach((l) => {
    add(l.getAttribute('href'), 'icon');
  });

  doc.querySelectorAll('link[rel~="preload"][as="image"]').forEach((l) => {
    if (l.hasAttribute('href')) add(l.getAttribute('href'), 'preload');
    parseSrcset(l.getAttribute('imagesrcset')).forEach((x) => add(x, 'preload'));
  });
}

// Images referenced from CSS: fonts and other non-image files are skipped
function addCssImage(u, pageUrl, source) {
  if (!u || NON_IMAGE_EXT.test(u.pathname)) return;
  if (!S.cfg.verify && !extFormat(u)) return; // without server checks, only known image extensions
  addImage(u, pageUrl, source);
}

async function extractCss(doc, base, pageUrl) {
  const links = [...doc.querySelectorAll('link[rel~="stylesheet"][href]')]
    .map((l) => toUrl(l.getAttribute('href'), base)).filter(Boolean);
  const styleImports = [...doc.querySelectorAll('style')].flatMap((s) => cssImports(s.textContent))
    .map((x) => toUrl(x, base)).filter(Boolean);
  const all = [...links, ...styleImports];
  for (const u of all) {
    const urls = await loadCss(u.href, 0);
    urls.forEach((x) => addCssImage(new URL(x), pageUrl, 'css'));
  }
}

function loadCss(href, depth) {
  if (S.cssCache.has(href)) return S.cssCache.get(href);
  const p = (async () => {
    try {
      const res = await fetchWithTimeout(href, { headers: { Accept: 'text/css,*/*;q=0.1' } });
      if (!res.ok) return [];
      const text = await res.text();
      const out = [];
      cssUrls(text).forEach((x) => { const u = toUrl(x, res.url || href); if (u) out.push(u.href); });
      if (depth < 3) {
        for (const imp of cssImports(text)) {
          const u = toUrl(imp, res.url || href);
          if (u) out.push(...(await loadCss(u.href, depth + 1)));
        }
      }
      return out;
    } catch { return []; }
  })();
  S.cssCache.set(href, p);
  return p;
}

/* ------------------------------ image verification ------------------------------ */
async function verifyImage(rec) {
  const headers = { Accept: IMG_ACCEPT };
  let res = null;
  try {
    res = await fetchWithTimeout(rec.url, { method: 'HEAD', headers }, 20000);
    if (!res.ok || !res.headers.get('content-type')) throw new Error('fallback');
  } catch {
    try {
      res = await fetchWithTimeout(rec.url, { method: 'GET', headers: { ...headers, Range: 'bytes=0-0' } }, 25000);
    } catch (e) {
      rec.error = e.name === 'AbortError' ? 'timeout' : 'network error';
      rec.checked = true;
      return;
    }
  }
  rec.status = res.status;
  if (!res.ok) {
    rec.error = 'HTTP ' + res.status;
    rec.checked = true;
    try { res.body && res.body.cancel(); } catch {}
    return;
  }
  const ct = res.headers.get('content-type') || '';
  rec.contentType = ct.split(';')[0].trim();
  const cf = ctFormat(ct);
  if (cf) rec.format = cf;
  else if (ct && !/octet-stream|binary/i.test(ct)) {
    // e.g. text/html or a font → not an image (usually came from CSS)
    if (!rec.extFmt) rec.notImage = true;
  }
  const cr = res.headers.get('content-range');
  const cl = res.headers.get('content-length');
  if (cr && /\/(\d+)/.test(cr)) rec.size = +cr.match(/\/(\d+)/)[1];
  else if (cl && res.status !== 206) rec.size = +cl;
  try { res.body && res.body.cancel(); } catch {}
  rec.checked = true;
}

/* ------------------------------ sitemap ------------------------------ */
async function loadSitemaps(origin) {
  const candidates = new Set();
  try {
    const r = await fetchWithTimeout(origin + '/robots.txt', {}, 15000);
    if (r.ok) {
      const t = await r.text();
      t.split(/\r?\n/).forEach((line) => {
        const m = line.match(/^\s*sitemap:\s*(\S+)/i);
        if (m) candidates.add(m[1]);
      });
    }
  } catch {}
  if (!candidates.size) ['/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml'].forEach((p) => candidates.add(origin + p));

  const done = new Set();
  const stack = [...candidates];
  let found = 0;
  while (stack.length && done.size < 200 && !S.stopped) {
    const sm = stack.shift();
    if (done.has(sm) || /\.gz$/i.test(sm)) continue;
    done.add(sm);
    setStatus('sitemapReading', { url: sm });
    try {
      const r = await fetchWithTimeout(sm, {}, 20000);
      if (!r.ok) continue;
      const xml = new DOMParser().parseFromString(await r.text(), 'text/xml');
      xml.querySelectorAll('sitemap > loc').forEach((l) => stack.push(l.textContent.trim()));
      xml.querySelectorAll('url > loc').forEach((l) => {
        const u = toUrl(l.textContent.trim());
        if (u) { const before = S.seen.size; enqueuePage(u); if (S.seen.size > before) found++; }
      });
      // Images declared in an image sitemap
      xml.querySelectorAll('url').forEach((urlEl) => {
        const page = urlEl.querySelector('loc');
        [...urlEl.getElementsByTagNameNS('*', 'loc')].filter((x) => x.parentElement && x.parentElement.localName === 'image')
          .forEach((x) => addImage(toUrl(x.textContent.trim()), page ? page.textContent.trim() : null, 'sitemap'));
      });
    } catch {}
  }
  return found;
}

/* ------------------------------ workers ------------------------------ */
async function pageWorker() {
  while (!S.stopped) {
    if (S.paused) { await sleep(300); continue; }
    const url = S.queue.shift();
    if (!url) {
      if (S.active === 0) return;
      await sleep(150);
      continue;
    }
    S.active++;
    setStatus('crawling', { url });
    try { await processPage(url); }
    catch (e) { S.pageErrors.push({ url, error: e.message || String(e) }); }
    finally { S.active--; }
    scheduleRender();
    if (S.cfg.delay) await sleep(S.cfg.delay);
  }
}

async function imageWorker() {
  while (!S.stopped) {
    if (S.paused) { await sleep(300); continue; }
    const rec = S.imgQueue.shift();
    if (!rec) {
      if (S.crawlDone) return;
      await sleep(200);
      continue;
    }
    S.imgActive++;
    try { await verifyImage(rec); } finally { S.imgActive--; }
    scheduleRender();
    if (S.cfg.delay) await sleep(Math.min(S.cfg.delay, 200));
  }
}

/* ------------------------------ control ------------------------------ */
function readConfig() {
  let raw = $('url').value.trim();
  if (!raw) throw new Error('errUrl');
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
  let start;
  try { start = new URL(raw); } catch { throw new Error('errUrl'); }
  return {
    start,
    rootHost: bareHost(start.hostname),
    maxPages: Math.max(1, +$('maxPages').value || 5000),
    concurrency: Math.min(16, Math.max(1, +$('concurrency').value || 4)),
    delay: Math.max(0, +$('delay').value || 0),
    okFormats: new Set([...document.querySelectorAll('.okfmt:checked')].map((c) => c.value)),
    useSitemap: $('useSitemap').checked,
    verify: $('verify').checked,
    subdomains: $('subdomains').checked,
    parseCss: $('parseCss').checked,
    ignoreQuery: $('ignoreQuery').checked,
    exclude: $('exclude').value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  };
}

async function start() {
  let cfg;
  try { cfg = readConfig(); } catch (e) { alertStatus(e.message); return; }
  S = newState(cfg);
  S.running = true;
  ui.page = 0;
  setButtons();
  $('url').value = cfg.start.href;

  enqueuePage(cfg.start);
  // Always include the site's home page too
  enqueuePage(new URL('/', cfg.start));

  if (cfg.useSitemap) {
    const n = await loadSitemaps(cfg.start.origin);
    if (n) setStatus('sitemapFound', { n: num(n) }); else setStatus('sitemapNone');
  }

  const crawl = Promise.all(Array.from({ length: cfg.concurrency }, pageWorker)).then(() => { S.crawlDone = true; });
  const imgs = cfg.verify ? Promise.all(Array.from({ length: Math.max(2, cfg.concurrency) }, imageWorker)) : Promise.resolve();
  await crawl;
  if (!S.stopped) setStatus('crawlDoneVerifying');
  await imgs;

  S.running = false;
  const secs = Math.round((Date.now() - S.startedAt) / 1000);
  setStatus(S.stopped ? 'stopped' : 'done', { pages: S.pagesDone, secs }, true);
  setButtons();
  render();
}

function togglePause() {
  if (!S || !S.running) return;
  S.paused = !S.paused;
  setStatus(S.paused ? 'paused' : 'resuming');
  setButtons();
}

function stop() {
  if (!S || !S.running) return;
  S.stopped = true;
  S.paused = false;
  setStatus('stopping');
}

function setButtons() {
  const running = S && S.running;
  $('start').disabled = !!running;
  $('pause').disabled = !running;
  $('stop').disabled = !running;
  $('pause').textContent = t(S && S.paused ? 'resume' : 'pause');
}

// Status is stored as key + params so it can be re-translated when the language changes.
// Params listed in numParams are formatted with the current locale's digits.
let lastStatus = { key: 'ready', params: null, warn: false, fmtNums: false };
function setStatus(key, params = null, fmtNums = false, warn = false) {
  lastStatus = { key, params, warn, fmtNums };
  paintStatus();
}
function paintStatus() {
  const { key, params, warn, fmtNums } = lastStatus;
  let p = params;
  if (p && fmtNums) p = Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === 'number' ? num(v) : v]));
  $('status').textContent = (warn ? '⚠ ' : '') + t(key, p);
}
function alertStatus(key) { setStatus(key, null, false, true); }

/* ------------------------------ results & rendering ------------------------------ */
function isBad(rec) {
  if (rec.notImage) return false;
  if (rec.error) return false;
  if (!rec.checked) return false;
  return !S.cfg.okFormats.has(rec.format || 'unknown');
}

function visibleImages() {
  if (!S) return [];
  return [...S.images.values()].filter((r) => !r.notImage && r.checked);
}

function scheduleRender() {
  if (renderTimer) return;
  renderTimer = setTimeout(() => { renderTimer = null; render(); }, 400);
}

function render() {
  if (!S) return;
  const all = visibleImages();
  const bad = all.filter(isBad);
  const errored = all.filter((r) => r.error);
  $('sPages').textContent = S.pagesDone.toLocaleString(numLocale());
  $('sQueue').textContent = (S.queue.length + (S.cfg.verify ? S.imgQueue.length : 0)).toLocaleString(numLocale());
  $('sImages').textContent = all.length.toLocaleString(numLocale());
  $('sBad').textContent = bad.length.toLocaleString(numLocale());
  // <bdi dir=ltr> keeps "11.08 MB" in the right order inside RTL layouts
  $('sBadSize').innerHTML = `<bdi dir="ltr">${fmtSize(bad.reduce((a, r) => a + (r.size || 0), 0))}</bdi>`;
  $('sErrors').textContent = (S.pageErrors.length + errored.length).toLocaleString(numLocale());

  const total = S.seen.size || 1;
  const pct = S.running ? Math.min(99, (S.processed.size / total) * 100) : 100;
  $('bar').style.width = pct + '%';

  // Per-format breakdown
  const counts = {};
  (ui.showAll ? all.filter((r) => !r.error) : bad).forEach((r) => { const f = r.format || 'unknown'; counts[f] = (counts[f] || 0) + 1; });
  if (errored.length) counts['error'] = errored.length;
  const chips = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  $('formats').innerHTML = '';
  chips.forEach(([f, n]) => {
    const c = document.createElement('span');
    c.className = 'chip' + (ui.fmt === f ? ' on' : '');
    c.textContent = `${fmtName(f)}: ${n.toLocaleString(numLocale())}`;
    c.onclick = () => { ui.fmt = ui.fmt === f ? '' : f; $('fmtFilter').value = ui.fmt; ui.page = 0; render(); };
    $('formats').appendChild(c);
  });
  const sel = $('fmtFilter');
  const cur = sel.value;
  sel.innerHTML = `<option value="">${esc(t('allFormats'))}</option>` + chips.map(([f]) => `<option value="${f}">${fmtName(f)}</option>`).join('');
  sel.value = cur;

  renderTable();
}

function fmtName(f) {
  return f === 'unknown' ? t('fmtUnknown') : f === 'error' ? t('fmtError') : f.toUpperCase();
}

function filteredRows() {
  const all = visibleImages();
  let rows;
  if (ui.fmt === 'error') rows = all.filter((r) => r.error);
  else {
    rows = ui.showAll ? all.filter((r) => !r.error) : all.filter(isBad);
    if (ui.fmt) rows = rows.filter((r) => (r.format || 'unknown') === ui.fmt);
  }
  if (ui.q) {
    const q = ui.q.toLowerCase();
    rows = rows.filter((r) => r.url.toLowerCase().includes(q) || [...r.pages].some((p) => p.toLowerCase().includes(q)));
  }
  const k = ui.sortKey, d = ui.sortDir;
  rows.sort((a, b) => {
    let x, y;
    if (k === 'size') { x = a.size || 0; y = b.size || 0; }
    else if (k === 'pages') { x = a.pages.size; y = b.pages.size; }
    else if (k === 'format') { x = a.format; y = b.format; }
    else { x = a.url; y = b.url; }
    return x < y ? -d : x > y ? d : 0;
  });
  return rows;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderTable() {
  const rows = filteredRows();
  const pages = Math.max(1, Math.ceil(rows.length / ui.perPage));
  if (ui.page >= pages) ui.page = pages - 1;
  const slice = rows.slice(ui.page * ui.perPage, (ui.page + 1) * ui.perPage);
  const tb = $('rows');
  if (!slice.length) {
    tb.innerHTML = `<tr><td colspan="7" class="empty">${esc(t(S && S.running ? 'searching' : 'noResults'))}</td></tr>`;
  } else {
    tb.innerHTML = slice.map((r, i) => {
      const ok = S.cfg.okFormats.has(r.format);
      const fcls = r.error ? 'fmt err' : ok ? 'fmt ok' : 'fmt';
      const flabel = r.error ? r.error : fmtName(r.format || 'unknown');
      const pageList = [...r.pages];
      const shown = pageList.slice(0, 3).map((p) => `<a href="${esc(p)}" target="_blank">${esc(p)}</a>`).join('');
      const more = pageList.length > 3
        ? `<details><summary><bdi>${esc(t('morePages', { n: num(pageList.length - 3) }))}</bdi></summary>${pageList.slice(3, 300).map((p) => `<a href="${esc(p)}" target="_blank">${esc(p)}</a>`).join('')}${pageList.length > 300 ? `<span class="note">${esc(t('fullListCsv'))}</span>` : ''}</details>`
        : '';
      const src = [...r.sources].map(srcLabel).join(', ');
      const notes = [...r.notes].map((n) => `<span class="note">${esc(t(n))}</span>`).join('');
      const ctNote = r.contentType && ctFormat(r.contentType) !== r.extFmt && r.extFmt
        ? `<span class="note">${esc(t('ctMismatch', { ext: r.extFmt, ct: r.contentType }))}</span>` : '';
      return `<tr>
        <td>${(ui.page * ui.perPage + i + 1).toLocaleString(numLocale())}</td>
        <td class="thumb"><img loading="lazy" src="${esc(r.url)}" alt=""></td>
        <td class="url"><a href="${esc(r.url)}" target="_blank">${esc(r.url)}</a><span class="note">${esc(t('source', { s: src }))}</span>${notes}${ctNote}</td>
        <td><span class="${fcls}">${esc(flabel)}</span></td>
        <td><bdi dir="ltr">${fmtSize(r.size)}</bdi></td>
        <td>${pageList.length.toLocaleString(numLocale())}</td>
        <td class="where">${shown}${more}</td>
      </tr>`;
    }).join('');
  }
  $('pageInfo').textContent = t('pageInfo', { page: num(ui.page + 1), pages: num(pages), count: num(rows.length) });
  $('prev').disabled = ui.page === 0;
  $('next').disabled = ui.page >= pages - 1;
}

/* ------------------------------ export ------------------------------ */
function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function download(name, rows) {
  const text = '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

function fileBase() {
  const d = new Date().toISOString().slice(0, 10);
  return (S ? S.cfg.rootHost : 'site') + '-images-' + d;
}

function exportPerImage() {
  if (!S) return;
  const rows = [['image_url', 'format', 'content_type', 'size_bytes', 'size_kb', 'pages_count', 'sources', 'notes', 'pages']];
  filteredRows().forEach((r) => rows.push([
    r.url, r.format || 'unknown', r.contentType, r.size ?? '', r.size ? (r.size / 1024).toFixed(1) : '',
    r.pages.size, [...r.sources].join(' | '), [...r.notes].map((n) => t(n)).join(' | '), [...r.pages].join(' | ')
  ]));
  download(fileBase() + '.csv', rows);
}

function exportPairs() {
  if (!S) return;
  const rows = [['page_url', 'image_url', 'format', 'size_kb', 'sources']];
  filteredRows().forEach((r) => {
    const pages = r.pages.size ? [...r.pages] : [''];
    pages.forEach((p) => rows.push([p, r.url, r.format || 'unknown', r.size ? (r.size / 1024).toFixed(1) : '', [...r.sources].join(' | ')]));
  });
  rows.splice(1, rows.length - 1, ...rows.slice(1).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)));
  download(fileBase() + '-by-page.csv', rows);
}

function exportErrors() {
  if (!S) return;
  const rows = [['type', 'url', 'error', 'found_on_pages']];
  S.pageErrors.forEach((e) => rows.push(['page', e.url, e.error, '']));
  visibleImages().filter((r) => r.error).forEach((r) => rows.push(['image', r.url, r.error, [...r.pages].join(' | ')]));
  download(fileBase() + '-errors.csv', rows);
}

async function copyUrls() {
  if (!S) return;
  const text = filteredRows().map((r) => r.url).join('\n');
  try { await navigator.clipboard.writeText(text); setStatus('copied'); }
  catch { setStatus('copyFailed'); }
}

/* ------------------------------ wiring ------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  paintStatus();
  $('fmtFilter').innerHTML = `<option value="">${esc(t('allFormats'))}</option>`;
  document.addEventListener('langchange', () => {
    paintStatus();
    setButtons();
    if (S) render();
    else $('fmtFilter').innerHTML = `<option value="">${esc(t('allFormats'))}</option>`;
  });
  const p = new URLSearchParams(location.search).get('url');
  if (p) { try { $('url').value = new URL(p).origin + '/'; } catch {} }

  $('start').onclick = start;
  $('pause').onclick = togglePause;
  $('stop').onclick = stop;
  $('url').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !(S && S.running)) start(); });

  $('search').addEventListener('input', (e) => { ui.q = e.target.value.trim(); ui.page = 0; renderTable(); });
  $('fmtFilter').onchange = (e) => { ui.fmt = e.target.value; ui.page = 0; render(); };
  $('showAll').onchange = (e) => { ui.showAll = e.target.checked; ui.fmt = ''; ui.page = 0; render(); };
  $('prev').onclick = () => { ui.page = Math.max(0, ui.page - 1); renderTable(); };
  $('next').onclick = () => { ui.page++; renderTable(); };
  document.querySelectorAll('th[data-sort]').forEach((th) => {
    th.onclick = () => {
      const k = th.dataset.sort;
      if (ui.sortKey === k) ui.sortDir *= -1; else { ui.sortKey = k; ui.sortDir = k === 'url' || k === 'format' ? 1 : -1; }
      renderTable();
    };
  });
  document.querySelectorAll('.okfmt').forEach((c) => c.onchange = () => {
    if (S) { S.cfg.okFormats = new Set([...document.querySelectorAll('.okfmt:checked')].map((x) => x.value)); render(); }
  });

  $('csv1').onclick = exportPerImage;
  $('csv2').onclick = exportPairs;
  $('csvErr').onclick = exportErrors;
  $('copy').onclick = copyUrls;

  window.addEventListener('beforeunload', (e) => { if (S && S.running) { e.preventDefault(); e.returnValue = ''; } });
});
