'use strict';
// مدیریت حالت شب/روز: «خودکار» از تنظیمات سیستم پیروی می‌کند؛ انتخاب کاربر ذخیره می‌شود.
// این فایل در <head> بارگذاری می‌شود تا صفحه قبل از نمایش با تم درست رنگ‌آمیزی شود.
(function () {
  const KEY = 'ia-theme';
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  function getMode() {
    try { return localStorage.getItem(KEY) || 'auto'; } catch { return 'auto'; }
  }
  function apply(mode) {
    const dark = mode === 'dark' || (mode === 'auto' && media.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelectorAll('.theme-toggle button').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
  }
  function setMode(mode) {
    try { localStorage.setItem(KEY, mode); } catch {}
    apply(mode);
  }

  apply(getMode());
  media.addEventListener('change', () => { if (getMode() === 'auto') apply('auto'); });

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.theme-toggle button').forEach((b) => { b.onclick = () => setMode(b.dataset.mode); });
    apply(getMode());
  });
})();
