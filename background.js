// Clicking the toolbar icon opens the tool in a new tab,
// pre-filled with the URL of the tab the user was on.
chrome.action.onClicked.addListener((tab) => {
  const current = tab && tab.url && /^https?:\/\//i.test(tab.url) ? tab.url : '';
  const page = chrome.runtime.getURL('app.html') + (current ? '?url=' + encodeURIComponent(current) : '');
  chrome.tabs.create({ url: page });
});
