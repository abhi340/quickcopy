import { auth, db, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, deleteUser, collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc } from './firebase.js';
import { ICONS } from './icons.js';
import { palettes, applyPalette, toggleTheme } from './theme.js';
import { showToast, escapeHtml, showError, getFriendlyAuthError, getSnippetType } from './utils.js';

let currentUser = null;
let snippets = [];
let filteredSnippets = [];
let searchTerm = '';
let currentView = 'active'; // active, archived, trash

// Load Marked.js & DOMPurify
function loadExternalScripts() {
  if (!document.getElementById('marked-js')) {
    const s = document.createElement('script');
    s.id = 'marked-js';
    s.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    document.head.appendChild(s);
  }
  if (!document.getElementById('purify-js')) {
    const s = document.createElement('script');
    s.id = 'purify-js';
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js';
    document.head.appendChild(s);
  }
}
loadExternalScripts();

// ===== AUTH RENDERERS =====
function renderLogin() {
  const appEl = document.getElementById('app');
  if (!appEl) return;
  
  appEl.innerHTML = `
    <div class="auth-container">
      <h1>QuickCopy</h1>
      <p class="auth-subtitle">Your clipboard, everywhere.</p>
      <div class="glass-card">
        <input type="email" id="login-email" placeholder="Email" autocomplete="email" />
        <input type="password" id="login-password" placeholder="Password" autocomplete="current-password" />
        <button class="btn btn-primary" id="login-btn">Sign In</button>
        <button class="btn btn-outline" id="forgot-password-btn">Forgot Password?</button>
        <button class="btn btn-outline" id="show-signup-btn">Create New Account</button>
        
        <div class="google-btn btn" id="google-signin-btn">
          <span class="nav-icon">${ICONS.google}</span>
          <span>Continue with Google</span>
        </div>
        <div id="login-error" class="error" style="display:none;"></div>
      </div>
    </div>
  `;

  document.getElementById('login-btn').onclick = async () => {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) return showError('Fields required.', 'login-error');
    try { await signInWithEmailAndPassword(auth, email, password); } 
    catch (err) { showError(getFriendlyAuthError(err.code), 'login-error'); }
  };

  document.getElementById('forgot-password-btn').onclick = showForgotPasswordModal;
  document.getElementById('show-signup-btn').onclick = renderSignup;
  document.getElementById('google-signin-btn').onclick = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } 
    catch (err) { showError(getFriendlyAuthError(err.code), 'login-error'); }
  };
}

function showForgotPasswordModal() {
  document.getElementById('app').innerHTML = `
    <div class="auth-container">
      <h1>Reset</h1>
      <p class="auth-subtitle">Enter email for reset link.</p>
      <div class="glass-card">
        <input type="email" id="reset-email" placeholder="Email" />
        <button class="btn btn-primary" id="send-reset">Send Reset Link</button>
        <button class="btn btn-outline" id="back-to-login">← Back to Sign In</button>
        <div id="reset-error" class="error" style="display:none;"></div>
      </div>
    </div>
  `;
  document.getElementById('send-reset').onclick = async () => {
    const email = document.getElementById('reset-email').value.trim();
    try { await sendPasswordResetEmail(auth, email); showToast('Email sent! 📧'); renderLogin(); } 
    catch (err) { showError(getFriendlyAuthError(err.code), 'reset-error'); }
  };
  document.getElementById('back-to-login').onclick = renderLogin;
}

function renderSignup() {
  document.getElementById('app').innerHTML = `
    <div class="auth-container">
      <h1>Join Us</h1>
      <p class="auth-subtitle">Start syncing in seconds.</p>
      <div class="glass-card">
        <input type="text" id="signup-name" placeholder="Full Name" />
        <input type="email" id="signup-email" placeholder="Email" />
        <input type="password" id="signup-password" placeholder="Password (8+ chars)" />
        <input type="password" id="signup-confirm" placeholder="Confirm Password" />
        <button class="btn btn-primary" id="signup-btn">Create Account</button>
        <button class="btn btn-outline" id="back-to-login-signup">Already have an account?</button>
        <div id="signup-error" class="error" style="display:none;"></div>
      </div>
    </div>
  `;
  document.getElementById('signup-btn').onclick = async () => {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    if (password !== document.getElementById('signup-confirm').value) return showError('Passwords mismatch.', 'signup-error');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await addDoc(collection(db, 'users'), { uid: cred.user.uid, name, email, createdAt: new Date().toISOString() });
    } catch (err) { showError(getFriendlyAuthError(err.code), 'signup-error'); }
  };
  document.getElementById('back-to-login-signup').onclick = renderLogin;
}

// ===== MAIN APP RENDERER =====
function renderApp() {
  if (!currentUser) return;
  
  const initialName = currentUser.email ? currentUser.email.split('@')[0] : 'User';
  const safeDisplayName = escapeHtml(initialName);
  const safeSearchTerm = escapeHtml(searchTerm);

  document.getElementById('app').innerHTML = `
    <div class="header">
      <div class="user-greeting">Hello, <span id="header-user-name">${safeDisplayName}</span></div>
      <div class="header-search-container">
        ${ICONS.search}
        <input type="text" id="search-input" placeholder="Search clips..." value="${safeSearchTerm}" />
      </div>
      <div class="profile-dropdown-container">
        <button class="profile-btn" id="profile-btn">${ICONS.profile}</button>
        <div class="dropdown-menu" id="dropdown-menu" style="display:none;">
          <button class="dropdown-item" id="settings-btn">
            <span class="nav-icon">${ICONS.settings}</span> Settings
          </button>
          <button class="dropdown-item" id="toggle-theme-btn">
            <span class="nav-icon">${document.body.classList.contains('dark-mode') ? ICONS.sun : ICONS.moon}</span> ${document.body.classList.contains('dark-mode') ? 'Light' : 'Dark'} Mode
          </button>
          <button class="dropdown-item danger" id="delete-account-btn">
            <span class="nav-icon">${ICONS.delete}</span> Delete Account
          </button>
          <button class="dropdown-item" id="sign-out-btn">
            <span class="nav-icon">${ICONS.signout}</span> Logout
          </button>
        </div>
      </div>
    </div>

    <div class="glass-card main-input-card">
      <div id="input-area">
        <input type="text" id="new-snippet" placeholder="Paste link or text..." autocomplete="off"/>
        <button id="add-btn" class="btn btn-primary">Add Clip</button>
      </div>
    </div>

    <div style="display: flex; gap: 12px; margin-bottom: 24px; overflow-x: auto; padding-bottom: 8px;">
      <button class="btn btn-outline ${currentView === 'active' ? 'active' : ''}" id="view-active" style="width:auto; padding: 8px 16px; font-size: 0.85rem;">Active</button>
      <button class="btn btn-outline ${currentView === 'archived' ? 'active' : ''}" id="view-archived" style="width:auto; padding: 8px 16px; font-size: 0.85rem;">Archived</button>
      <button class="btn btn-outline ${currentView === 'trash' ? 'active' : ''}" id="view-trash" style="width:auto; padding: 8px 16px; font-size: 0.85rem;">Trash</button>
    </div>

    <div id="snippets-list-container">
      <div style="text-align:center; padding:40px; color:var(--text-dim);">Loading your clips...</div>
    </div>

    <footer class="app-footer">
      <div class="footer-links">
        <a href="about.html">About</a>
        <a href="privacy.html">Privacy</a>
        <a href="changelog.html">Changelog</a>
      </div>
      <p>&copy; 2026 QuickCopy Pro. All rights reserved.</p>
    </footer>
  `;

  // Asynchronously fetch real display name
  fetchUserDisplayName();

  // Attach persistent header events
  const profileBtn = document.getElementById('profile-btn');
  const dropdown = document.getElementById('dropdown-menu');
  const searchInput = document.getElementById('search-input');

  profileBtn.onclick = (e) => { 
    e.stopPropagation(); 
    const isHidden = dropdown.style.display === 'none';
    dropdown.style.display = isHidden ? 'block' : 'none'; 
  };
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-dropdown-container')) {
      dropdown.style.display = 'none';
    }
  });

  document.getElementById('view-active').onclick = () => { currentView = 'active'; renderSnippets(); };
  document.getElementById('view-archived').onclick = () => { currentView = 'archived'; renderSnippets(); };
  document.getElementById('view-trash').onclick = () => { currentView = 'trash'; renderSnippets(); };

  document.getElementById('settings-btn').onclick = (e) => {
    e.stopPropagation();
    window.location.href = 'settings.html';
  };

  document.getElementById('toggle-theme-btn').onclick = (e) => {
    e.stopPropagation();
    toggleTheme();
    renderApp(); 
  };

  document.getElementById('sign-out-btn').onclick = () => signOut(auth);
  document.getElementById('delete-account-btn').onclick = confirmDeleteAccount;
  
  document.getElementById('add-btn').onclick = addSnippet;
  document.getElementById('new-snippet').onkeypress = (e) => { if (e.key === 'Enter') addSnippet(); };

  searchInput.oninput = (e) => {
    searchTerm = e.target.value;
    renderSnippets();
  };

  renderSnippets();
}

async function fetchUserDisplayName() {
  try {
    const q = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const name = snap.docs[0].data().name;
      const el = document.getElementById('header-user-name');
      if (el) el.textContent = escapeHtml(name);
    }
  } catch (err) { console.warn("Failed to fetch display name", err); }
}

function renderSnippets() {
  const container = document.getElementById('snippets-list-container');
  if (!container) return;

  // Update active states
  const vActive = document.getElementById('view-active');
  const vArchived = document.getElementById('view-archived');
  const vTrash = document.getElementById('view-trash');
  
  if (vActive) vActive.classList.toggle('active', currentView === 'active');
  if (vArchived) vArchived.classList.toggle('active', currentView === 'archived');
  if (vTrash) vTrash.classList.toggle('active', currentView === 'trash');

  filteredSnippets = snippets.filter(s => {
    const matchesSearch = s.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = (s.status || 'active') === currentView;
    return matchesSearch && matchesStatus;
  });

  container.innerHTML = `
    <div id="snippets-list">
      ${filteredSnippets.length === 0 
        ? `<div class="glass-card empty-state">No clips found in ${currentView}. ${searchTerm ? 'Try a different search.' : 'Add your first one!'}</div>` 
        : filteredSnippets.map((item, i) => {
            const type = getSnippetType(item.text);
            const isTrash = item.status === 'trash';
            const isArchived = item.status === 'archived';
            const isMarkdown = item.isMarkdown || false;

            let contentHtml = escapeHtml(item.text);
            if (isMarkdown && window.marked && window.DOMPurify) {
              try {
                const rawHtml = marked.parse(item.text);
                contentHtml = DOMPurify.sanitize(rawHtml);
              } catch (e) { console.error("MD Error", e); }
            }

            return `
              <div class="snippet-card ${item.pinned ? 'pinned' : ''}" data-index="${i}" title="Click to copy">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <span class="badge badge-${type}">${type}</span>
                  <div style="display: flex; gap: 4px;">
                    ${item.isPublic ? '<span class="badge badge-link" style="background: rgba(168, 85, 247, 0.15); color: #a855f7;">Public</span>' : ''}
                    ${isMarkdown ? '<span class="badge badge-code" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">MD</span>' : ''}
                  </div>
                </div>
                <div class="snippet-content">${contentHtml}</div>
                <div class="snippet-footer">
                  <div class="actions-group">
                    ${!isTrash ? `
                      <button class="icon-btn pin-btn ${item.pinned ? 'active' : ''}" data-id="${item.id}" data-pinned="${item.pinned}" title="Pin">${ICONS.pin}</button>
                      <button class="icon-btn share-btn" data-id="${item.id}" data-public="${item.isPublic || false}" title="Public Share">${ICONS.share}</button>
                      <button class="icon-btn md-btn ${isMarkdown ? 'active' : ''}" data-id="${item.id}" data-md="${isMarkdown}" title="Toggle Markdown">${ICONS.markdown}</button>
                      <button class="icon-btn edit-btn" data-id="${item.id}" data-text="${escapeHtml(item.text)}" title="Edit">${ICONS.edit}</button>
                      <button class="icon-btn archive-btn" data-id="${item.id}" data-status="${item.status || 'active'}" title="${isArchived ? 'Unarchive' : 'Archive'}">${ICONS.archive}</button>
                    ` : ''}
                    <button class="icon-btn delete-btn" data-id="${item.id}" data-status="${item.status || 'active'}" title="${isTrash ? 'Permanently Delete' : 'Move to Trash'}">${ICONS.delete}</button>
                    ${isTrash ? `<button class="icon-btn restore-btn" data-id="${item.id}" title="Restore">${ICONS.restore}</button>` : ''}
                    <button class="icon-btn copy-btn" data-index="${i}" title="Copy">${ICONS.copy}</button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
    </div>
  `;

  // Attach card-specific events
  document.querySelectorAll('.snippet-card').forEach(card => {
    card.onclick = (e) => {
      if (e.target.closest('.icon-btn')) return;
      const idx = card.dataset.index;
      navigator.clipboard.writeText(filteredSnippets[idx].text);
      showToast('Copied to clipboard! 📋');
    };
  });

  document.querySelectorAll('.copy-btn').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); const idx = btn.dataset.index; navigator.clipboard.writeText(filteredSnippets[idx].text); showToast('Copied! 📋'); }; });
  document.querySelectorAll('.pin-btn').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); togglePin(btn.dataset.id, btn.dataset.pinned === 'true'); }; });
  document.querySelectorAll('.share-btn').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); togglePublic(btn.dataset.id, btn.dataset.public === 'true'); }; });
  document.querySelectorAll('.md-btn').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); toggleMarkdown(btn.dataset.id, btn.dataset.md === 'true'); }; });
  document.querySelectorAll('.edit-btn').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); editSnippet(btn.dataset.id, btn.dataset.text); }; });
  document.querySelectorAll('.archive-btn').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); updateStatus(btn.dataset.id, btn.dataset.status === 'archived' ? 'active' : 'archived'); }; });
  document.querySelectorAll('.delete-btn').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); handleDeletion(btn.dataset.id, btn.dataset.status); }; });
  document.querySelectorAll('.restore-btn').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); updateStatus(btn.dataset.id, 'active'); }; });
}

// ===== FIREBASE ACTIONS =====
async function addSnippet() {
  const input = document.getElementById('new-snippet');
  const val = input.value.trim();
  if (!val) return;
  try {
    await addDoc(collection(db, 'snippets'), { 
      text: val, 
      userId: currentUser.uid, 
      pinned: false, 
      status: 'active',
      isPublic: false,
      isMarkdown: false,
      createdAt: new Date().toISOString() 
    });
    input.value = ''; 
    showToast('Added to Cloud! ✨'); 
    loadSnippets();
  } catch (e) { showToast('Cloud Error.', '❌'); }
}

async function togglePin(id, current) {
  try { await updateDoc(doc(db, 'snippets', id), { pinned: !current }); loadSnippets(); } 
  catch (e) { showToast('Update Error.', '❌'); }
}

async function togglePublic(id, current) {
  try { 
    await updateDoc(doc(db, 'snippets', id), { isPublic: !current }); 
    if (!current) {
      const baseUrl = window.location.href.split('?')[0].split('#')[0];
      const shareUrl = new URL(`public.html?id=${id}`, baseUrl).href;
      navigator.clipboard.writeText(shareUrl);
      showToast('Public link copied! 🔗');
    } else {
      showToast('Link disabled.');
    }
    loadSnippets(); 
  } catch (e) { showToast('Sharing Error.', '❌'); }
}

async function toggleMarkdown(id, current) {
  try { await updateDoc(doc(db, 'snippets', id), { isMarkdown: !current }); loadSnippets(); } 
  catch (e) { showToast('MD Error.', '❌'); }
}

async function updateStatus(id, newStatus) {
  try { await updateDoc(doc(db, 'snippets', id), { status: newStatus }); loadSnippets(); } 
  catch (e) { showToast('Status Error.', '❌'); }
}

async function handleDeletion(id, currentStatus) {
  if (currentStatus === 'trash') {
    if (confirm('Permanently delete from cloud?')) { 
      await deleteDoc(doc(db, 'snippets', id)); 
      showToast('Wiped from Cloud.'); 
      loadSnippets(); 
    }
  } else {
    await updateStatus(id, 'trash');
    showToast('Moved to Trash.');
  }
}

async function editSnippet(id, old) {
  const res = prompt('Edit clip:', old);
  if (res && res.trim()) { 
    await updateDoc(doc(db, 'snippets', id), { text: res.trim() }); 
    showToast('Cloud Sync Updated!'); 
    loadSnippets(); 
  }
}

async function loadSnippets() {
  if (!currentUser) return;
  try {
    const q = query(collection(db, 'snippets'), where('userId', '==', currentUser.uid));
    const snap = await getDocs(q);
    snippets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    snippets.sort((a, b) => a.pinned === b.pinned ? new Date(b.createdAt) - new Date(a.createdAt) : (a.pinned ? -1 : 1));
    renderSnippets();
  } catch (e) { console.error("Snippets load error", e); }
}

function confirmDeleteAccount() {
  if (confirm('DANGER: Wipe ALL cloud data and delete account?')) {
    deleteUser(auth.currentUser).then(() => { window.location.reload(); }).catch(e => showError("Failed to delete account."));
  }
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    if (document.activeElement.id === 'new-snippet') addSnippet();
  }
  if (e.ctrlKey && e.key === 'f') {
    e.preventDefault();
    document.getElementById('search-input')?.focus();
  }
  if (e.altKey && e.key >= '1' && e.key <= '9') {
    const idx = parseInt(e.key) - 1;
    if (filteredSnippets[idx]) {
      navigator.clipboard.writeText(filteredSnippets[idx].text);
      showToast(`Snippet #${e.key} Copied! 📋`);
    }
  }
  if (e.key === 'Escape') {
    searchTerm = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    renderSnippets();
  }
});

// ===== INITIALIZATION =====
onAuthStateChanged(auth, (u) => { 
  if (u) { 
    currentUser = u; 
    renderApp(); 
    loadSnippets(); 
  } else { 
    currentUser = null; 
    renderLogin(); 
  } 
});
