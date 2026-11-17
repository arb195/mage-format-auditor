// با کلیک روی آیکون افزونه، صفحه اصلی ابزار در یک تب جدید باز می‌شود
// و آدرس تب فعلی به‌صورت پیش‌فرض در فیلد آدرس قرار می‌گیرد.
chrome.action.onClicked.addListener((tab) => {
  const current = tab && tab.url && /^https?:\/\//i.test(tab.url) ? tab.url : '';
  const page = chrome.runtime.getURL('app.html') + (current ? '?url=' + encodeURIComponent(current) : '');
  chrome.tabs.create({ url: page });
});
