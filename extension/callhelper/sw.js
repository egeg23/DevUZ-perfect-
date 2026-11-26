// Значок расширения: открыть суфлёр сбоку от вкладки со звонком. Нажатие на
// значок даёт расширению право слушать звук именно этой вкладки.
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || tab.id === undefined) return;
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
    await chrome.storage.session.set({ callTab: tab.id });
  } catch (error) {
    console.error("CallHelper: панель не открылась", error);
  }
});
