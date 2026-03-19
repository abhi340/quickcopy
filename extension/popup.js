// QuickCopy Pro Universal Extension Logic
const API_KEY = "AIzaSyDE9ZE9L81iZxZ8BiSvGiMqcuHnNGGwTFE";
const PROJECT_ID = "quickcopy-d4d0f";

// Polyfill: Ensure 'chrome' works in Firefox/Safari
if (typeof browser !== 'undefined') {
  window.chrome = browser;
}

let snippets = [];
let currentUser = null;

// Helper for safe HTML injection (Mozilla strict requirement)
function safeSetHTML(container, htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  while (container.firstChild) container.removeChild(container.firstChild);
  while (doc.body.firstChild) container.appendChild(doc.body.firstChild);
}

document.addEventListener('DOMContentLoaded', async () => {
  const { qc_user } = await chrome.storage.local.get(['qc_user']);
  if (qc_user && qc_user.idToken) {
    currentUser = qc_user;
    showApp();
  } else {
    showLogin();
  }

  // Listen for real-time auth sync from bridge
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.qc_user) {
      currentUser = changes.qc_user.newValue;
      if (currentUser) showApp();
      else showLogin();
    }
  });

  // Auth Listeners
  document.getElementById('login-btn').onclick = handleLogin;
  document.getElementById('logout-btn').onclick = handleLogout;
  
  // Redirection Listeners
  document.getElementById('google-btn').onclick = handleGoogleLogin;
  
  document.getElementById('signup-link').onclick = (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://quickcopy.abhicm019.workers.dev/' });
  };
  
  // Search Listener
  document.getElementById('search-input').oninput = (e) => {
    const term = e.target.value.toLowerCase();
    renderSnippets(snippets.filter(s => s.text.toLowerCase().includes(term)));
  };

  // Sync Listener
  document.getElementById('sync-btn').onclick = handleSync;
});

function showLogin() {
  document.getElementById('auth-screen').style.display = 'block';
  document.getElementById('app-screen').style.display = 'none';
}

function showApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'block';
  document.getElementById('user-email').textContent = currentUser.email;
  fetchSnippets();
}

async function handleLogin() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('error-msg');

  if (!email || !password) return;
  
  btn.disabled = true;
  btn.textContent = 'Signing in...';
  errEl.style.display = 'none';

  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ email, password, returnSecureToken: true }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    currentUser = { 
      email: data.email, 
      idToken: data.idToken, 
      localId: data.localId,
      refreshToken: data.refreshToken
    };

    await chrome.storage.local.set({ qc_user: currentUser });
    showApp();
  } catch (err) {
    errEl.textContent = err.message.replace(/_/g, ' ');
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

async function handleLogout() {
  await chrome.storage.local.remove(['qc_user']);
  currentUser = null;
  snippets = [];
  showLogin();
}

async function fetchSnippets() {
  const container = document.getElementById('results-list');
  console.log("📂 Fetching snippets for UID:", currentUser.localId);
  try {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${currentUser.idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "snippets" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "userId" },
              op: "EQUAL",
              value: { stringValue: currentUser.localId }
            }
          }
        }
      })
    });
    
    const data = await res.json();
    console.log("📦 Query Response:", data);

    if (data.error) {
      throw new Error(data.error.message);
    }

    if (!Array.isArray(data) || data.length === 0 || !data[0].document) {
      console.log("ℹ️ No documents found matching query.");
      snippets = [];
    } else {
      snippets = data
        .filter(item => item.document) 
        .map(item => {
          const d = item.document;
          return {
            id: d.name.split('/').pop(),
            text: d.fields.text?.stringValue || "Empty snippet",
            status: d.fields.status?.stringValue || "active",
            priority: d.fields.priority?.doubleValue || 0,
            createdAt: d.fields.createdAt?.stringValue || new Date().toISOString()
          };
        })
        .filter(s => s.status !== 'trash'); // Filter trash locally to avoid complex query
    }
    
    console.log("✅ Final Processed Snippets:", snippets.length);
    renderSnippets(snippets);
  } catch (err) {
    console.error("❌ Fetch Error:", err);
    container.textContent = `Sync Error: ${err.message}`;
    container.style.color = '#ef4444';
    container.style.padding = '20px';
    container.style.textAlign = 'center';
  }
}

function renderSnippets(list) {
  const container = document.getElementById('results-list');
  if (list.length === 0) {
    container.textContent = 'No clips found.';
    container.style.textAlign = 'center';
    container.style.padding = '20px';
    container.style.color = '#94a3b8';
    return;
  }
  
  // Sort list by priority (descending) then createdAt (descending)
  list.sort((a, b) => {
    const pA = a.priority || 0;
    const pB = b.priority || 0;
    if (pB !== pA) return pB - pA;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const html = list.map((s, i) => `
    <div class="result-item-wrapper" draggable="true" data-id="${s.id}" data-index="${i}">
      <div class="drag-handle">⋮⋮</div>
      <div class="result-item" title="Click to copy">
        ${escapeHtml(s.text)}
      </div>
    </div>
  `).join('');

  safeSetHTML(container, html);

  const wrappers = container.querySelectorAll('.result-item-wrapper');
  
  wrappers.forEach(wrapper => {
    // Copy on click
    wrapper.querySelector('.result-item').onclick = (e) => {
      const idx = wrapper.dataset.index;
      const text = list[idx].text;
      navigator.clipboard.writeText(text);
      const el = e.target;
      const original = el.textContent;
      el.textContent = 'Copied! ✅';
      setTimeout(() => el.textContent = original, 1000);
    };

    // Drag and Drop Logic
    wrapper.ondragstart = (e) => {
      wrapper.classList.add('dragging');
      e.dataTransfer.setData('text/plain', wrapper.dataset.index);
    };

    wrapper.ondragend = () => {
      wrapper.classList.remove('dragging');
    };

    wrapper.ondragover = (e) => {
      e.preventDefault();
      const draggingEl = container.querySelector('.dragging');
      const afterElement = getDragAfterElement(container, e.clientY);
      if (afterElement == null) {
        container.appendChild(draggingEl);
      } else {
        container.insertBefore(draggingEl, afterElement);
      }
    };

    wrapper.ondrop = async (e) => {
      e.preventDefault();
      const oldIndex = parseInt(e.dataTransfer.getData('text/plain'));
      const newIndex = Array.from(container.children).indexOf(wrapper);
      
      if (oldIndex !== newIndex) {
        updateSnippetPriority(list, oldIndex, newIndex);
      }
    };
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.result-item-wrapper:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function updateSnippetPriority(list, oldIdx, newIndex) {
  const current = list[oldIdx];
  
  let newPriority;
  
  if (newIndex === 0) {
    // Dropped at top
    const topItem = list[0];
    newPriority = (topItem.priority || 0) + 100;
  } else if (newIndex === list.length - 1) {
    // Dropped at bottom
    const bottomItem = list[list.length - 1];
    newPriority = (bottomItem.priority || 0) - 100;
  } else {
    // Dropped between two items
    const aboveIdx = newIndex < oldIdx ? newIndex - 1 : newIndex;
    const belowIdx = newIndex < oldIdx ? newIndex : newIndex + 1;
    
    const pAbove = list[aboveIdx]?.priority || 0;
    const pBelow = list[belowIdx]?.priority || 0;
    newPriority = (pAbove + pBelow) / 2;
  }

  try {
    await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/snippets/${current.id}?updateMask.fieldPaths=priority`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${currentUser.idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          priority: { doubleValue: newPriority }
        }
      })
    });
    fetchSnippets();
  } catch (err) {
    console.error("Priority update failed:", err);
  }
}

async function handleSync() {
  const text = document.getElementById('snippet-text').value.trim();
  const btn = document.getElementById('sync-btn');
  if (!text) return;

  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'Syncing...';

  try {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/snippets`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${currentUser.idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          text: { stringValue: text },
          userId: { stringValue: currentUser.localId },
          status: { stringValue: 'active' },
          createdAt: { stringValue: new Date().toISOString() },
          pinned: { booleanValue: false },
          isPublic: { booleanValue: false },
          isMarkdown: { booleanValue: false },
          tags: { arrayValue: { values: [] } }
        }
      })
    });

    if (res.ok) {
      document.getElementById('snippet-text').value = '';
      btn.textContent = 'Synced! ✨';
      setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 1500);
      fetchSnippets();
    }
  } catch (err) {
    btn.textContent = 'Failed ❌';
    setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 2000);
  }
}

function escapeHtml(t) {
  if (!t) return "";
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function handleGoogleLogin() {
  const errEl = document.getElementById('error-msg');
  errEl.textContent = '';
  errEl.style.display = 'none';
  
  console.log("🚀 Launching Web Auth Flow...");

  const redirectUri = chrome.identity.getRedirectURL();
  console.log("Redirect URI:", redirectUri);

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=122284453797-vm5ghhr7dktfkrhhlroi6hudtbfjakj0.apps.googleusercontent.com` +
    `&response_type=id_token` +
    `&access_type=offline` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&nonce=${Math.random().toString(36).substring(2)}`;

  chrome.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true
  }, async (responseUrl) => {
    if (chrome.runtime.lastError || !responseUrl) {
      const errMsg = chrome.runtime.lastError?.message || "Cancelled";
      const displayUri = redirectUri;
      const errorContent = `
        <div style="text-align:left; font-size:0.75rem;">
          <p style="color:#ef4444; font-weight:700;">Sign-In Error: ${errMsg}</p>
          <p style="margin-top:10px;">Please add this URI to your Google Cloud "Authorized redirect URIs":</p>
          <div style="background:rgba(0,0,0,0.05); padding:8px; border-radius:6px; border:1px solid #e2e8f0; word-break:break-all; font-family:monospace; margin-top:5px; user-select:all;">${displayUri}</div>
        </div>
      `;
      safeSetHTML(errEl, errorContent);
      errEl.style.display = 'block';
      return;
    }

    // Extract ID Token from the URL fragment
    const url = new URL(responseUrl.replace('#', '?'));
    const idToken = url.searchParams.get('id_token');

    if (!idToken) {
      errEl.textContent = "Token Error: No identity token received.";
      errEl.style.display = 'block';
      return;
    }

    try {
      // Exchange Google ID Token for Firebase Session
      const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postBody: `id_token=${idToken}&providerId=google.com`,
          requestUri: `http://localhost`, 
          returnIdpCredential: true,
          returnSecureToken: true
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      currentUser = { 
        email: data.email, 
        idToken: data.idToken, 
        localId: data.localId,
        refreshToken: data.refreshToken
      };

      await chrome.storage.local.set({ qc_user: currentUser });
      showApp();
    } catch (err) {
      errEl.textContent = "Firebase Link Failed: " + err.message;
      errEl.style.display = 'block';
    }
  });
}
