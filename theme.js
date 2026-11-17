'use strict';
// Light/dark theme switcher. "auto" follows the OS setting; the user's choice is saved.
// Loaded in <head> so the page is painted with the right theme from the start.
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
