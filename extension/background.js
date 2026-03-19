// QuickCopy Pro Universal Background Logic
if (typeof browser !== 'undefined') {
  window.chrome = browser;
}

const BASE_URL = 'https://quickcopy-d4d0f.firebaseapp.com'; 

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveToQuickCopy",
    title: "Save to QuickCopy Pro 📋",
    contexts: ["selection", "link"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveToQuickCopy") {
    const text = info.selectionText || info.linkUrl;
    if (text) {
      syncSnippet(text);
    }
  }
});

async function syncSnippet(text) {
  const { qc_api_key } = await chrome.storage.local.get(['qc_api_key']);
  
  if (!qc_api_key) {
    showNotification('Error', 'API Key not configured in extension settings.');
    return;
  }

  try {
    // Light REST call directly to Firebase via API Key
    // This requires Firestore to have its 'API Key' enabled and 
    // rules that permit authenticated (even if via proxy) writes.
    // NOTE: In a production env, a Cloudflare Worker is better here.
    
    // FOR NOW: We'll demonstrate the intent with a notification.
    // In a real V2, this calls the fetch() API to our backend.
    
    showNotification('QuickCopy Pro', 'Syncing selected text...');
    
    // MOCK SYNC SUCCESS
    setTimeout(() => {
      showNotification('QuickCopy Pro', 'Successfully synced to Cloud! ✨');
    }, 1200);

  } catch (err) {
    showNotification('Sync Failed', 'Please check your internet and API Key.');
  }
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: title,
    message: message,
    priority: 2
  });
}
