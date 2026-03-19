// QuickCopy Pro Sync Bridge (Content Script)
console.log("📡 QuickCopy Bridge Active");

window.addEventListener('message', (event) => {
  // Only trust messages from our site
  if (event.source !== window) return;

  if (event.data.type === 'QUICKCOPY_PRO_AUTH') {
    const userData = event.data.detail;
    if (userData && userData.idToken) {
      console.log("🚀 Syncing Auth to Extension Storage...");
      chrome.storage.local.set({ qc_user: userData }, () => {
        console.log("✅ Sync Complete. Closing auth bridge window.");
        // If this is the special ext_login window, close it immediately
        if (window.location.search.includes('ext_login=true')) {
          window.close();
        }
      });
    }
  }
});
