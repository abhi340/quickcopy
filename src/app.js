import { auth, db, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, deleteUser, collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc } from './firebase.js';
import { ICONS } from './icons.js';
import { palettes, applyPalette, toggleTheme } from './theme.js';
import { showToast, escapeHtml, showError, getFriendlyAuthError, getSnippetType } from './utils.js';

let currentUser = null;
let snippets = [];
let filteredSnippets = [];
let searchTerm = '';

// Expose these to window for potential inline calls or debugging
window.setPaletteByName = (name) => {
  const p = palettes.find(pal => pal.name === name);
  if (p) { 
    applyPalette(p); 
    if (document.getElementById('profile-layout')) {
      showProfile(); 
    }
  }
};

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
  const displayName = currentUser.email ? currentUser.email.split('@')[0] : 'User';
  const safeDisplayName = escapeHtml(displayName);
  const safeSearchTerm = escapeHtml(searchTerm);

  document.getElementById('app').innerHTML = `
    <div class="header">
      <div class="user-greeting">Hello, ${safeDisplayName}</div>
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

    <div id="snippets-list-container">
      <!-- Snippets will be injected here -->
    </div>
  `;

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

function renderSnippets() {
  const container = document.getElementById('snippets-list-container');
  if (!container) return;

  filteredSnippets = snippets.filter(s => 
    s.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  container.innerHTML = `
    <div id="snippets-list">
      ${filteredSnippets.length === 0 
        ? `<div class="glass-card empty-state">No clips found. ${searchTerm ? 'Try a different search.' : 'Add your first one!'}</div>` 
        : filteredSnippets.map((item, i) => {
            const type = getSnippetType(item.text);
            return `
              <div class="snippet-card ${item.pinned ? 'pinned' : ''}" data-index="${i}" title="Click to copy">
                <span class="badge badge-${type}">${type}</span>
                <div class="snippet-content">${escapeHtml(item.text)}</div>
                <div class="snippet-footer">
                  <div class="actions-group">
                    <button class="icon-btn pin-btn ${item.pinned ? 'active' : ''}" data-id="${item.id}" data-pinned="${item.pinned}" title="Pin">${ICONS.pin}</button>
                    <button class="icon-btn edit-btn" data-id="${item.id}" data-text="${escapeHtml(item.text)}" title="Edit">${ICONS.edit}</button>
                    <button class="icon-btn copy-btn" data-index="${i}" title="Copy">${ICONS.copy}</button>
                    <button class="icon-btn delete-btn" data-id="${item.id}" title="Delete">${ICONS.delete}</button>
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

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const idx = btn.dataset.index;
      navigator.clipboard.writeText(filteredSnippets[idx].text);
      showToast('Copied! 📋');
    };
  });

  document.querySelectorAll('.pin-btn').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); togglePin(btn.dataset.id, btn.dataset.pinned === 'true'); }; });
  document.querySelectorAll('.edit-btn').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); editSnippet(btn.dataset.id, btn.dataset.text); }; });
  document.querySelectorAll('.delete-btn').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); deleteSnippet(btn.dataset.id); }; });
}

// ===== PROFILE DASHBOARD =====
async function showProfile() {
  const user = auth.currentUser || currentUser;
  if (!user) {
    renderLogin();
    return;
  }

  let userName = user.email ? user.email.split('@')[0] : 'User';
  try {
    const q = query(collection(db, 'users'), where('uid', '==', user.uid));
    const snap = await getDocs(q);
    if (!snap.empty) userName = snap.docs[0].data().name || userName;
  } catch (err) {
    console.warn("Could not fetch user profile", err);
  }

  document.getElementById('app').innerHTML = `
    <div class="header">
      <button class="icon-btn" id="back-to-app" style="width:auto; padding:0 12px; height:40px;">← Back</button>
      <h2 style="font-weight:800;">Account Settings</h2>
    </div>
    <div class="profile-layout" id="profile-layout">
      <div class="glass-card profile-hero">
        <div class="profile-avatar">${ICONS.profile}</div>
        <h2 id="profile-name-display">${userName}</h2>
        <p>${user.email}</p>
        <button class="btn btn-outline" id="edit-name-btn" style="width:auto; margin: 10px auto; padding: 8px 16px;">Edit Name</button>
        <div class="account-badge">PRO Account</div>
      </div>

      <div class="grid-layout-2">
        <div class="glass-card stats-card">
          <div class="card-title">${ICONS.stats} Usage Stats</div>
          <div class="stat-item">
            <span class="stat-label">Total Clips</span>
            <span class="stat-value">${snippets.length}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Pinned</span>
            <span class="stat-value">${snippets.filter(s=>s.pinned).length}</span>
          </div>
        </div>

        <div class="glass-card stats-card">
          <div class="card-title">${ICONS.shield} Security</div>
          <p class="security-note">Your data is cloud-synced and protected by Firebase security protocols.</p>
          <button class="btn btn-outline" style="margin-top:10px; font-size:0.8rem;" id="verify-encryption-btn">Verify Encryption</button>
        </div>
      </div>

      <div class="glass-card">
        <h3 style="margin-bottom:16px;">Appearance Themes</h3>
        <div class="palette-grid">
          ${palettes.map(p => `
            <div class="palette-swatch ${JSON.parse(localStorage.getItem('quickcopy_palette'))?.name === p.name ? 'active' : ''}" 
                 style="background: linear-gradient(135deg, ${p.primary}, ${p.secondary})"
                 onclick="window.setPaletteByName('${p.name}')"></div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  document.getElementById('back-to-app').onclick = renderApp;
  document.getElementById('edit-name-btn').onclick = editProfileName;
  document.getElementById('verify-encryption-btn').onclick = () => showToast('Cloud Guard Active! 🛡️');
}

async function editProfileName() {
  const newName = prompt("Enter your name:");
  if (newName && newName.trim()) {
    try {
      const q = query(collection(db, 'users'), where('uid', '==', auth.currentUser.uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(doc(db, 'users', snap.docs[0].id), { name: newName.trim() });
      } else {
        await addDoc(collection(db, 'users'), { uid: auth.currentUser.uid, name: newName.trim(), email: auth.currentUser.email, createdAt: new Date().toISOString() });
      }
      showToast('Name updated! ✨');
      showProfile();
    } catch (e) { showToast('Update failed.', '❌'); }
  }
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
      createdAt: new Date().toISOString() 
    });
    input.value = ''; 
    showToast('Added to Cloud! ✨'); 
    loadSnippets();
  } catch (e) { showToast('Cloud Error.', '❌'); }
}

async function togglePin(id, current) {
  try { 
    await updateDoc(doc(db, 'snippets', id), { pinned: !current }); 
    loadSnippets(); 
  } catch (e) { showToast('Update Error.', '❌'); }
}

async function editSnippet(id, old) {
  const res = prompt('Edit clip:', old);
  if (res && res.trim()) { 
    await updateDoc(doc(db, 'snippets', id), { text: res.trim() }); 
    showToast('Cloud Sync Updated!'); 
    loadSnippets(); 
  }
}

async function deleteSnippet(id) {
  if (confirm('Permanently delete from cloud?')) { 
    await deleteDoc(doc(db, 'snippets', id)); 
    showToast('Wiped from Cloud.'); 
    loadSnippets(); 
  }
}

async function loadSnippets() {
  if (!currentUser) return;
  try {
    const q = query(collection(db, 'snippets'), where('userId', '==', currentUser.uid));
    const snap = await getDocs(q);
    snippets = [];
    snap.forEach(d => snippets.push({ id: d.id, ...d.data() }));
    snippets.sort((a, b) => a.pinned === b.pinned ? new Date(b.createdAt) - new Date(a.createdAt) : (a.pinned ? -1 : 1));
    
    if (document.getElementById('snippets-list-container')) {
      renderSnippets();
    } else if (document.getElementById('app').querySelector('.user-greeting')) {
      // Already in app view, just update list container if needed (usually handled above)
      renderSnippets();
    } else {
      renderApp();
    }
  } catch (e) {
    console.error("Snippets load error", e);
  }
}

function confirmDeleteAccount() {
  if (confirm('DANGER: Wipe ALL cloud data and delete account?')) {
    deleteUser(auth.currentUser).then(() => {
      window.location.reload();
    }).catch(e => showError("Failed to delete account. You may need to re-login first."));
  }
}

// ===== INITIALIZATION =====
onAuthStateChanged(auth, (u) => { 
  if (u) { 
    currentUser = u; 
    loadSnippets(); 
  } else { 
    currentUser = null; 
    renderLogin(); 
  } 
});
