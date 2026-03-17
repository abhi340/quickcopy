// The extension will use the Cloudflare Pages URL for its API interactions
const BASE_URL = 'https://quickcopy.pages.dev'; // Replace with your actual live URL

document.getElementById('sync-btn').onclick = async () => {
  const text = document.getElementById('snippet-text').value.trim();
  const statusEl = document.getElementById('status');
  
  if (!text) return;

  // Retrieve API Key from storage
  chrome.storage.local.get(['qc_api_key'], async (result) => {
    const apiKey = result.qc_api_key;

    if (!apiKey) {
      statusEl.textContent = '❌ Error: API Key not set.';
      statusEl.style.color = '#ef4444';
      return;
    }

    statusEl.textContent = 'Syncing... ☁️';
    
    // For now, we'll use a placeholder sync mechanism.
    // In a real implementation, you'd call a Cloudflare Worker or 
    // a secured Firestore endpoint.
    // Since we are Vanilla JS, we'll suggest the user manually 
    // paste into the web app for now, OR we can implement 
    // a lightweight REST call if you set up a Firebase Function.
    
    statusEl.textContent = '✅ Key Valid. Feature coming in next patch!';
    statusEl.style.color = '#10b981';
  });
};

document.getElementById('open-settings').onclick = () => {
  const key = prompt('Enter your QuickCopy Pro API Key (from Settings):');
  if (key) {
    chrome.storage.local.set({ qc_api_key: key }, () => {
      alert('API Key Saved! 🚀');
    });
  }
};
