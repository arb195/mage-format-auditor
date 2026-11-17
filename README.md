<p align="center">
  <img src="docs/banner.webp" alt="Image Format Auditor — Chrome extension that finds every non-WebP image on a website" width="100%">
</p>

<p align="center">
  <a href="https://github.com/arb195/mage-format-auditor/releases/latest"><img src="https://img.shields.io/github/v/release/arb195/mage-format-auditor?label=release&color=2563eb" alt="Latest release"></a>
  <img src="https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white" alt="Chrome Extension">
  <img src="https://img.shields.io/badge/Manifest-V3-0f172a" alt="Manifest V3">
  <img src="https://img.shields.io/badge/dependencies-none-22c55e" alt="No dependencies">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-f59e0b" alt="MIT License"></a>
</p>

<p align="center">
  <b>English</b> · <a href="#فارسی">فارسی</a>
</p>

---

**Image Format Auditor** is a Chrome extension that crawls an entire website and lists every image that isn't **WebP** or **SVG**. For each image it shows the real format, the file size and every page it's used on, so you know exactly what to convert first.

## Features

- **Full-site crawl:** follows internal links and reads `robots.txt` and `sitemap.xml` (including sitemap indexes).
- **Finds images everywhere:**
  - `<img>`, `srcset`, `<picture>` and lazy-load attributes (`data-src`, `data-lazy-src`, …)
  - CSS backgrounds in external stylesheets (including `@import`), `<style>` tags and inline `style`
  - `og:image`, `twitter:image`, favicons, video posters and links that point straight to images
- **Real format detection:** checks the `Content-Type` the server actually sends, not just the file extension. A `.jpg` that your CDN serves as WebP isn't reported, and extension-less URLs such as `/_next/image?...` or `/cdn/img?id=12` are still detected.
- **Prioritise by impact:** sort by file size or by how many pages use the image. Total weight of the flagged images is shown up front.
- **Smart notes:** marks JPG/PNG files that are only the fallback of a `<picture>` that already has a WebP/AVIF source.
- **Broken items:** pages and images that return 404 or other errors are listed separately.
- **CSV export** (UTF-8 with BOM, opens correctly in Excel):
  - one row per image
  - one row per page–image pair
  - errors
- **Configurable:** choose which formats are allowed (WebP, SVG, AVIF, GIF, ICO), the page limit, concurrency, request delay, subdomains and URL patterns to exclude.
- **Light / dark / auto theme**, bundled Vazirmatn font, Persian RTL interface.
- **Private by design:** no servers, no analytics, no dependencies. Everything runs in your own browser.

## Screenshots

| Light | Dark |
|:---:|:---:|
| <img src="docs/screenshot-light.webp" alt="Light theme"> | <img src="docs/screenshot-dark.webp" alt="Dark theme"> |

## Installation

1. Download the latest `image-format-auditor.zip` from [**Releases**](https://github.com/arb195/mage-format-auditor/releases/latest) and unzip it, or clone the repo:
   ```bash
   git clone https://github.com/arb195/mage-format-auditor.git
   ```
2. Open `chrome://extensions` (Edge: `edge://extensions`, Brave: `brave://extensions`).
3. Turn on **Developer mode** ①.
4. Click **Load unpacked** ② and select the extension folder (the one that contains `manifest.json`).
5. Pin the extension from the puzzle-piece menu so it stays in your toolbar.

<p align="center"><img src="docs/install.webp" alt="Enable Developer mode and click Load unpacked" width="720"></p>

## Usage

1. Open any page of the site you want to audit and click the extension icon. The tool opens in a new tab with the site's address already filled in.
2. Press **Start** (شروع). Progress, page count and results update live, and you can pause or stop at any time.
3. Filter by format, search by URL, sort by size or page count, then export to CSV.

> **Tip:** keep the tool's tab open until the crawl finishes. Results live in memory and are lost when the tab is closed.

## Settings

| Setting | Default | Notes |
|---|---|---|
| Max pages | 5000 | Upper limit on pages crawled |
| Concurrent requests | 4 | Lower it (1–2) for sites behind a WAF or rate limit |
| Delay between requests | 0 ms | Be gentle with small servers |
| Allowed formats | WebP, SVG | AVIF, GIF and ICO can be allowed too |
| Read sitemap.xml | on | Finds pages that aren't linked anywhere |
| Verify real format | on | One `HEAD` request per image (falls back to a 1-byte ranged `GET`) |
| Include subdomains | off | e.g. `blog.example.com` when auditing `example.com` |
| Parse CSS files | on | Background images in stylesheets |
| Excluded URL patterns | `/wp-admin`, `logout`, `/cart`, … | One pattern per line |

## Good to know

- Requests are sent with your browser's cookies, so sites protected by Cloudflare or ArvanCloud usually work if you have opened them once in the same browser.
- Images that are injected only by JavaScript after the page loads aren't in the initial HTML and may not be detected.
- The crawler only follows pages on the same domain. Images hosted on CDNs or other domains are still reported.

## Project structure

```
├── manifest.json     # Manifest V3 config
├── background.js     # Opens the tool in a new tab when the icon is clicked
├── app.html          # UI
├── app.css           # Styles + light/dark theme variables
├── app.js            # Crawler, image extraction, format detection, CSV export
├── theme.js          # Theme switcher (auto / light / dark)
├── fonts/            # Vazirmatn (SIL OFL 1.1)
├── icons/
└── docs/             # README images
```

## Contributing

Issues and pull requests are welcome. Please open an issue first to discuss larger changes.

## License

[MIT](LICENSE). The bundled [Vazirmatn](https://github.com/rastikerdar/vazirmatn) font is licensed under the [SIL Open Font License 1.1](fonts/Vazirmatn-OFL.txt).

---

<div dir="rtl" align="right">

<h2 id="فارسی">فارسی</h2>

**Image Format Auditor** یک افزونه کروم است که کل سایت را کرال می‌کند و همه تصاویری را که **WebP** یا **SVG** نیستند پیدا می‌کند. برای هر تصویر فرمت واقعی، حجم و همه صفحاتی که در آن‌ها استفاده شده را نشان می‌دهد، تا بدانید اول کدام تصاویر را تبدیل کنید.

### امکانات

- **کرال کامل سایت:** از طریق لینک‌های داخلی، `robots.txt` و `sitemap.xml`
- **پیدا کردن تصاویر از همه جا:**
  - `<img>`، `srcset`، `<picture>` و تصاویر lazy-load
  - پس‌زمینه‌های CSS (فایل‌های CSS، تگ `style` و استایل درون‌خطی)
  - `og:image`، فاوآیکن و لینک‌هایی که مستقیم به عکس اشاره می‌کنند
- **تشخیص فرمت واقعی** از روی پاسخ سرور، نه فقط پسوند فایل
- **مرتب‌سازی بر اساس حجم** یا تعداد صفحات، برای اولویت‌بندی
- **فهرست جداگانه** صفحات و تصاویر خراب (۴۰۴)
- **خروجی CSV** که فارسی‌اش در اکسل درست نمایش داده می‌شود
- **حالت شب و روز**، فونت وزیرمتن (داخل خود افزونه، بدون نیاز به اینترنت)
- **بدون سرور و بدون ارسال داده:** همه چیز داخل مرورگر خودتان اجرا می‌شود

### نصب

1. فایل zip را از بخش [**Releases**](https://github.com/arb195/mage-format-auditor/releases/latest) دانلود و از حالت فشرده خارج کنید.
2. در مرورگر به `chrome://extensions` بروید.
3. گزینه **Developer mode** را روشن کنید (شماره ۱ در تصویر بالا).
4. روی **Load unpacked** بزنید (شماره ۲) و پوشه افزونه را انتخاب کنید.
5. آیکون افزونه را از منوی پازل Pin کنید.

### استفاده

روی سایت مورد نظر، آیکون افزونه را بزنید. ابزار در یک تب جدید باز می‌شود و آدرس سایت خودکار پر شده است. «شروع» را بزنید و تا پایان کار تب را نبندید.

> **نکته:** اگر سایت پشت ابرآروان یا کلودفلر است، یک بار سایت را در همان مرورگر باز کنید و «درخواست هم‌زمان» را روی ۱ یا ۲ بگذارید.

</div>
