'use strict';
/* =========================================================================
   UI translations. Loaded in <head> so the page gets the right lang/dir
   before first paint. Language: saved choice → browser language → English.
   To add a language: add an entry to LANGS and a block to STRINGS.
   ========================================================================= */
(function () {
  const KEY = 'ia-lang';

  const LANGS = {
    en: { name: 'English', dir: 'ltr', num: 'en-US' },
    ar: { name: 'العربية', dir: 'rtl', num: 'ar' },
    ru: { name: 'Русский', dir: 'ltr', num: 'ru-RU' },
    de: { name: 'Deutsch', dir: 'ltr', num: 'de-DE' },
    fa: { name: 'فارسی', dir: 'rtl', num: 'fa-IR' }
  };

  const STRINGS = {
    en: {
      pageTitle: 'Image Format Auditor',
      title: 'Image Format Auditor',
      subtitle: 'Crawls every page of a website and reports each image whose format isn’t allowed (by default: anything other than WebP and SVG).',
      language: 'Language',
      theme: 'Theme', themeLight: '☀ Light', themeAuto: 'Auto', themeDark: '☾ Dark',
      themeLightTitle: 'Light theme', themeAutoTitle: 'Follow system setting', themeDarkTitle: 'Dark theme',
      siteUrl: 'Website URL',
      start: 'Start', pause: 'Pause', resume: 'Resume', stop: 'Stop',
      settings: 'Settings',
      maxPages: 'Max pages', concurrency: 'Concurrent requests', delay: 'Delay between requests (ms)',
      okFormats: 'Allowed formats (not reported)', icoLabel: 'ICO (favicon)',
      options: 'Options',
      useSitemap: 'Read sitemap.xml',
      verify: 'Detect real format from the server (more accurate)',
      subdomains: 'Include subdomains',
      parseCss: 'Scan CSS files (background-image)',
      ignoreQuery: 'Ignore URL query parameters (?…) on pages',
      exclude: 'URL patterns to skip (one per line)',
      sPages: 'Pages crawled', sQueue: 'In queue', sImages: 'Images found',
      sBad: 'Images in a disallowed format', sBadSize: 'Total size of these images', sErrors: 'Errors (broken pages/images)',
      ready: 'Ready.',
      search: 'Search image or page URL…', allFormats: 'All formats', showAll: 'Show allowed images too',
      csv1: 'Download CSV (one row per image)', csv2: 'Download CSV (image + page)', csvErr: 'Download CSV of errors',
      copy: 'Copy image URLs',
      thPreview: 'Preview', thUrl: 'Image URL', thFormat: 'Format', thSize: 'Size', thPages: 'Pages', thWhere: 'Used on',
      prev: 'Previous', next: 'Next',
      errUrl: 'Please enter a website URL.',
      sitemapReading: 'Reading sitemap: {url}',
      sitemapFound: '{n} pages added from the sitemap.',
      sitemapNone: 'No sitemap found; crawling via links.',
      crawling: 'Checking: {url}',
      crawlDoneVerifying: 'Page crawl finished; checking the format of the remaining images…',
      done: 'Done. {pages} pages checked in {secs} s.',
      stopped: 'Stopped. {pages} pages checked in {secs} s.',
      paused: 'Paused.', resuming: 'Resuming…', stopping: 'Stopping…',
      copied: 'URLs copied.', copyFailed: 'Copy failed.',
      searching: 'Searching…', noResults: 'Nothing found.',
      pageInfo: 'Page {page} of {pages} — {count} items',
      morePages: '+{n} more', fullListCsv: '…(full list in the CSV export)',
      source: 'Source: {s}',
      pictureFallback: 'Fallback inside <picture> (a WebP/AVIF version also exists)',
      ctMismatch: 'Extension is {ext} but the server sends {ct}',
      fmtUnknown: 'Unknown', fmtError: 'Error / broken', srcLink: 'link'
    },

    ar: {
      pageTitle: 'مدقق صيغ الصور',
      title: 'مدقق صيغ الصور',
      subtitle: 'يزحف إلى جميع صفحات الموقع ويعرض كل صورة صيغتها غير مسموح بها (افتراضيًا: أي صيغة غير WebP وSVG).',
      language: 'اللغة',
      theme: 'المظهر', themeLight: '☀ فاتح', themeAuto: 'تلقائي', themeDark: '☾ داكن',
      themeLightTitle: 'المظهر الفاتح', themeAutoTitle: 'حسب إعدادات النظام', themeDarkTitle: 'المظهر الداكن',
      siteUrl: 'عنوان الموقع',
      start: 'ابدأ', pause: 'إيقاف مؤقت', resume: 'استئناف', stop: 'إنهاء',
      settings: 'الإعدادات',
      maxPages: 'الحد الأقصى للصفحات', concurrency: 'الطلبات المتزامنة', delay: 'التأخير بين الطلبات (مللي ثانية)',
      okFormats: 'الصيغ المسموح بها (لا يُبلَّغ عنها)', icoLabel: 'ICO (أيقونة الموقع)',
      options: 'خيارات',
      useSitemap: 'قراءة sitemap.xml',
      verify: 'اكتشاف الصيغة الفعلية من الخادم (أدق)',
      subdomains: 'تضمين النطاقات الفرعية',
      parseCss: 'فحص ملفات CSS (background-image)',
      ignoreQuery: 'تجاهل معاملات العنوان (?…) في الصفحات',
      exclude: 'أنماط العناوين التي لا يُزحف إليها (نمط في كل سطر)',
      sPages: 'صفحات تم فحصها', sQueue: 'في قائمة الانتظار', sImages: 'إجمالي الصور',
      sBad: 'صور بصيغة غير مسموح بها', sBadSize: 'الحجم الإجمالي لهذه الصور', sErrors: 'أخطاء (صفحات/صور معطلة)',
      ready: 'جاهز.',
      search: 'ابحث في عنوان الصورة أو الصفحة…', allFormats: 'كل الصيغ', showAll: 'إظهار الصور المسموح بها أيضًا',
      csv1: 'تنزيل CSV (صف لكل صورة)', csv2: 'تنزيل CSV (صورة + صفحة)', csvErr: 'تنزيل CSV للأخطاء',
      copy: 'نسخ عناوين الصور',
      thPreview: 'معاينة', thUrl: 'عنوان الصورة', thFormat: 'الصيغة', thSize: 'الحجم', thPages: 'عدد الصفحات', thWhere: 'أماكن الاستخدام',
      prev: 'السابق', next: 'التالي',
      errUrl: 'الرجاء إدخال عنوان الموقع.',
      sitemapReading: 'جارٍ قراءة خريطة الموقع: {url}',
      sitemapFound: 'أُضيفت {n} صفحة من خريطة الموقع.',
      sitemapNone: 'لم يُعثر على خريطة موقع؛ يستمر الزحف عبر الروابط.',
      crawling: 'جارٍ الفحص: {url}',
      crawlDoneVerifying: 'انتهى الزحف إلى الصفحات؛ جارٍ فحص صيغ الصور المتبقية…',
      done: 'تم. فُحصت {pages} صفحة في {secs} ثانية.',
      stopped: 'توقف. فُحصت {pages} صفحة في {secs} ثانية.',
      paused: 'متوقف مؤقتًا.', resuming: 'جارٍ الاستئناف…', stopping: 'جارٍ الإيقاف…',
      copied: 'تم نسخ العناوين.', copyFailed: 'فشل النسخ.',
      searching: 'جارٍ البحث…', noResults: 'لا توجد نتائج.',
      pageInfo: 'الصفحة {page} من {pages} — {count} عنصر',
      morePages: '{n} صفحات أخرى', fullListCsv: '…(القائمة الكاملة في ملف CSV)',
      source: 'المصدر: {s}',
      pictureFallback: 'صورة احتياطية داخل <picture> (توجد نسخة WebP/AVIF أيضًا)',
      ctMismatch: 'الامتداد {ext} لكن الخادم يرسل {ct}',
      fmtUnknown: 'غير معروف', fmtError: 'خطأ / معطلة', srcLink: 'رابط'
    },

    ru: {
      pageTitle: 'Аудит форматов изображений',
      title: 'Аудит форматов изображений',
      subtitle: 'Обходит все страницы сайта и показывает каждое изображение в недопустимом формате (по умолчанию — всё, кроме WebP и SVG).',
      language: 'Язык',
      theme: 'Тема', themeLight: '☀ Светлая', themeAuto: 'Авто', themeDark: '☾ Тёмная',
      themeLightTitle: 'Светлая тема', themeAutoTitle: 'Как в системе', themeDarkTitle: 'Тёмная тема',
      siteUrl: 'Адрес сайта',
      start: 'Начать', pause: 'Пауза', resume: 'Продолжить', stop: 'Стоп',
      settings: 'Настройки',
      maxPages: 'Макс. страниц', concurrency: 'Параллельных запросов', delay: 'Задержка между запросами (мс)',
      okFormats: 'Допустимые форматы (не попадают в отчёт)', icoLabel: 'ICO (фавикон)',
      options: 'Параметры',
      useSitemap: 'Читать sitemap.xml',
      verify: 'Определять реальный формат по ответу сервера (точнее)',
      subdomains: 'Включая поддомены',
      parseCss: 'Проверять CSS-файлы (background-image)',
      ignoreQuery: 'Игнорировать параметры URL (?…) у страниц',
      exclude: 'Шаблоны URL, которые не обходить (по одному в строке)',
      sPages: 'Страниц проверено', sQueue: 'В очереди', sImages: 'Найдено изображений',
      sBad: 'В недопустимом формате', sBadSize: 'Общий размер этих изображений', sErrors: 'Ошибки (битые страницы/изображения)',
      ready: 'Готово к запуску.',
      search: 'Поиск по адресу изображения или страницы…', allFormats: 'Все форматы', showAll: 'Показывать и допустимые',
      csv1: 'Скачать CSV (строка на изображение)', csv2: 'Скачать CSV (изображение + страница)', csvErr: 'Скачать CSV с ошибками',
      copy: 'Копировать адреса изображений',
      thPreview: 'Превью', thUrl: 'Адрес изображения', thFormat: 'Формат', thSize: 'Размер', thPages: 'Страниц', thWhere: 'Где используется',
      prev: 'Назад', next: 'Вперёд',
      errUrl: 'Введите адрес сайта.',
      sitemapReading: 'Чтение sitemap: {url}',
      sitemapFound: 'Из sitemap добавлено страниц: {n}.',
      sitemapNone: 'Sitemap не найден; обход продолжается по ссылкам.',
      crawling: 'Проверка: {url}',
      crawlDoneVerifying: 'Обход страниц завершён; проверяем формат оставшихся изображений…',
      done: 'Готово. Проверено страниц: {pages} за {secs} с.',
      stopped: 'Остановлено. Проверено страниц: {pages} за {secs} с.',
      paused: 'Пауза.', resuming: 'Продолжаем…', stopping: 'Останавливаем…',
      copied: 'Адреса скопированы.', copyFailed: 'Не удалось скопировать.',
      searching: 'Идёт поиск…', noResults: 'Ничего не найдено.',
      pageInfo: 'Страница {page} из {pages} — записей: {count}',
      morePages: 'ещё {n}', fullListCsv: '…(полный список — в CSV)',
      source: 'Источник: {s}',
      pictureFallback: 'Запасной вариант в <picture> (есть версия WebP/AVIF)',
      ctMismatch: 'Расширение {ext}, но сервер отдаёт {ct}',
      fmtUnknown: 'Неизвестно', fmtError: 'Ошибка / битое', srcLink: 'ссылка'
    },

    de: {
      pageTitle: 'Bildformat-Prüfer',
      title: 'Bildformat-Prüfer',
      subtitle: 'Durchsucht alle Seiten einer Website und meldet jedes Bild, dessen Format nicht erlaubt ist (standardmäßig alles außer WebP und SVG).',
      language: 'Sprache',
      theme: 'Design', themeLight: '☀ Hell', themeAuto: 'Auto', themeDark: '☾ Dunkel',
      themeLightTitle: 'Helles Design', themeAutoTitle: 'Systemeinstellung folgen', themeDarkTitle: 'Dunkles Design',
      siteUrl: 'Website-URL',
      start: 'Starten', pause: 'Pausieren', resume: 'Fortsetzen', stop: 'Beenden',
      settings: 'Einstellungen',
      maxPages: 'Max. Seiten', concurrency: 'Gleichzeitige Anfragen', delay: 'Pause zwischen Anfragen (ms)',
      okFormats: 'Erlaubte Formate (werden nicht gemeldet)', icoLabel: 'ICO (Favicon)',
      options: 'Optionen',
      useSitemap: 'sitemap.xml auslesen',
      verify: 'Echtes Format vom Server ermitteln (genauer)',
      subdomains: 'Subdomains einbeziehen',
      parseCss: 'CSS-Dateien prüfen (background-image)',
      ignoreQuery: 'URL-Parameter (?…) bei Seiten ignorieren',
      exclude: 'Nicht zu crawlende URL-Muster (eines pro Zeile)',
      sPages: 'Seiten geprüft', sQueue: 'In der Warteschlange', sImages: 'Gefundene Bilder',
      sBad: 'Bilder im falschen Format', sBadSize: 'Gesamtgröße dieser Bilder', sErrors: 'Fehler (defekte Seiten/Bilder)',
      ready: 'Bereit.',
      search: 'Bild- oder Seiten-URL suchen…', allFormats: 'Alle Formate', showAll: 'Auch erlaubte Bilder anzeigen',
      csv1: 'CSV herunterladen (eine Zeile pro Bild)', csv2: 'CSV herunterladen (Bild + Seite)', csvErr: 'Fehler als CSV herunterladen',
      copy: 'Bild-URLs kopieren',
      thPreview: 'Vorschau', thUrl: 'Bild-URL', thFormat: 'Format', thSize: 'Größe', thPages: 'Seiten', thWhere: 'Verwendet auf',
      prev: 'Zurück', next: 'Weiter',
      errUrl: 'Bitte eine Website-URL eingeben.',
      sitemapReading: 'Sitemap wird gelesen: {url}',
      sitemapFound: '{n} Seiten aus der Sitemap hinzugefügt.',
      sitemapNone: 'Keine Sitemap gefunden – Crawl läuft über Links weiter.',
      crawling: 'Prüfe: {url}',
      crawlDoneVerifying: 'Seiten-Crawl abgeschlossen – Format der restlichen Bilder wird geprüft…',
      done: 'Fertig. {pages} Seiten in {secs} s geprüft.',
      stopped: 'Gestoppt. {pages} Seiten in {secs} s geprüft.',
      paused: 'Pausiert.', resuming: 'Wird fortgesetzt…', stopping: 'Wird gestoppt…',
      copied: 'URLs kopiert.', copyFailed: 'Kopieren fehlgeschlagen.',
      searching: 'Suche läuft…', noResults: 'Nichts gefunden.',
      pageInfo: 'Seite {page} von {pages} — {count} Einträge',
      morePages: '+{n} weitere', fullListCsv: '…(vollständige Liste im CSV-Export)',
      source: 'Quelle: {s}',
      pictureFallback: 'Fallback in <picture> (WebP/AVIF-Version vorhanden)',
      ctMismatch: 'Endung {ext}, aber der Server liefert {ct}',
      fmtUnknown: 'Unbekannt', fmtError: 'Fehler / defekt', srcLink: 'Link'
    },

    fa: {
      pageTitle: 'بررسی فرمت تصاویر سایت',
      title: 'بررسی فرمت تصاویر سایت',
      subtitle: 'همه صفحات سایت کرال می‌شوند و هر تصویری که فرمت مجاز نداشته باشد (به‌طور پیش‌فرض: غیر از WebP و SVG) گزارش می‌شود.',
      language: 'زبان',
      theme: 'حالت نمایش', themeLight: '☀ روز', themeAuto: 'خودکار', themeDark: '☾ شب',
      themeLightTitle: 'حالت روز', themeAutoTitle: 'مطابق تنظیمات سیستم', themeDarkTitle: 'حالت شب',
      siteUrl: 'آدرس سایت',
      start: 'شروع', pause: 'توقف موقت', resume: 'ادامه', stop: 'پایان',
      settings: 'تنظیمات',
      maxPages: 'حداکثر تعداد صفحات', concurrency: 'درخواست هم‌زمان', delay: 'مکث بین درخواست‌ها (میلی‌ثانیه)',
      okFormats: 'فرمت‌های مجاز (گزارش نمی‌شوند)', icoLabel: 'ICO (فاوآیکن)',
      options: 'گزینه‌ها',
      useSitemap: 'خواندن sitemap.xml',
      verify: 'تشخیص فرمت واقعی از روی سرور (دقیق‌تر)',
      subdomains: 'شامل ساب‌دامین‌ها',
      parseCss: 'بررسی فایل‌های CSS (background-image)',
      ignoreQuery: 'نادیده گرفتن پارامترهای آدرس (?…) در صفحات',
      exclude: 'الگوهای آدرس که کرال نشوند (هر خط یکی)',
      sPages: 'صفحه بررسی شد', sQueue: 'در صف', sImages: 'کل تصاویر یافت‌شده',
      sBad: 'تصویر با فرمت نامناسب', sBadSize: 'حجم کل این تصاویر', sErrors: 'خطا (صفحه/تصویر شکسته)',
      ready: 'آماده.',
      search: 'جستجو در آدرس تصویر یا صفحه…', allFormats: 'همه فرمت‌ها', showAll: 'نمایش تصاویر مجاز هم',
      csv1: 'دانلود CSV (هر تصویر یک ردیف)', csv2: 'دانلود CSV (تصویر + صفحه)', csvErr: 'دانلود CSV صفحات/تصاویر خطادار',
      copy: 'کپی آدرس تصاویر',
      thPreview: 'پیش‌نمایش', thUrl: 'آدرس تصویر', thFormat: 'فرمت', thSize: 'حجم', thPages: 'تعداد صفحات', thWhere: 'کجا استفاده شده',
      prev: 'قبلی', next: 'بعدی',
      errUrl: 'آدرس سایت را وارد کنید.',
      sitemapReading: 'در حال خواندن سایت‌مپ: {url}',
      sitemapFound: '{n} صفحه از سایت‌مپ اضافه شد.',
      sitemapNone: 'سایت‌مپ پیدا نشد؛ کرال از طریق لینک‌ها ادامه می‌یابد.',
      crawling: 'در حال بررسی: {url}',
      crawlDoneVerifying: 'کرال صفحات تمام شد؛ در حال بررسی فرمت باقی تصاویر…',
      done: 'تمام شد. {pages} صفحه در {secs} ثانیه بررسی شد.',
      stopped: 'متوقف شد. {pages} صفحه در {secs} ثانیه بررسی شد.',
      paused: 'متوقف موقت.', resuming: 'ادامه…', stopping: 'در حال توقف…',
      copied: 'آدرس‌ها کپی شد.', copyFailed: 'کپی انجام نشد.',
      searching: 'در حال جستجو…', noResults: 'موردی یافت نشد.',
      pageInfo: 'صفحه {page} از {pages} — {count} مورد',
      morePages: '{n} صفحه دیگر', fullListCsv: '…(لیست کامل در خروجی CSV)',
      source: 'منبع: {s}',
      pictureFallback: 'fallback داخل <picture> (نسخه WebP/AVIF هم دارد)',
      ctMismatch: 'پسوند {ext} ولی سرور {ct} می‌دهد',
      fmtUnknown: 'نامشخص', fmtError: 'خطا/شکسته', srcLink: 'لینک'
    }
  };

  function detect() {
    try { const s = localStorage.getItem(KEY); if (s && LANGS[s]) return s; } catch {}
    for (const l of navigator.languages || [navigator.language || 'en']) {
      const code = String(l).toLowerCase().split('-')[0];
      if (LANGS[code]) return code;
    }
    return 'en';
  }

  let lang = detect();

  function t(key, params) {
    let s = (STRINGS[lang] && STRINGS[lang][key]) ?? STRINGS.en[key] ?? key;
    if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in params ? params[k] : m));
    return s;
  }

  function num(n) { return Number(n).toLocaleString(LANGS[lang].num); }

  function setDocLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = LANGS[lang].dir;
  }

  function apply(root = document) {
    setDocLang();
    document.title = t('pageTitle');
    root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
    root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  }

  function setLang(code) {
    if (!LANGS[code]) return;
    lang = code;
    try { localStorage.setItem(KEY, code); } catch {}
    apply();
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  setDocLang();

  document.addEventListener('DOMContentLoaded', () => {
    const sel = document.getElementById('lang');
    if (sel) {
      sel.innerHTML = Object.entries(LANGS).map(([c, l]) => `<option value="${c}">${l.name}</option>`).join('');
      sel.value = lang;
      sel.onchange = () => setLang(sel.value);
    }
    apply();
  });

  window.I18N = { t, num, setLang, apply, get lang() { return lang; }, LANGS };
})();
