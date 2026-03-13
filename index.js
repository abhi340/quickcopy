// Use Firebase from window.firebase
const { auth, db, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, deleteUser, updateEmail, collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc } = window.firebase;

let currentUser = null;
let snippets = [];
let filteredSnippets = [];
let isDarkMode = localStorage.getItem('quickcopy_dark_mode') === 'true';
let searchTerm = '';

// ===== PALETTE SYSTEM =====
const palettes = [
  { name: 'Indigo', primary: '#6366f1', secondary: '#a855f7' },
  { name: 'Emerald', primary: '#10b981', secondary: '#3b82f6' },
  { name: 'Rose', primary: '#f43f5e', secondary: '#fb923c' },
  { name: 'Amber', primary: '#f59e0b', secondary: '#d946ef' },
  { name: 'Cyan', primary: '#06b6d4', secondary: '#6366f1' },
  { name: 'Slate', primary: '#475569', secondary: '#94a3b8' }
];

let activePalette = JSON.parse(localStorage.getItem('quickcopy_palette')) || palettes[0];

function applyPalette(palette) {
  activePalette = palette;
  localStorage.setItem('quickcopy_palette', JSON.stringify(palette));
  document.documentElement.style.setProperty('--primary', palette.primary);
  document.documentElement.style.setProperty('--primary-glow', palette.primary + '80');
  document.documentElement.style.setProperty('--secondary', palette.secondary);
}

applyPalette(activePalette);
if (isDarkMode) document.body.classList.add('dark-mode');

// ===== SVG ICONS =====
const ICONS = {
  copy: `<svg viewBox="0 0 24 24"><path d="M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.602-1.43L17.43 3.602A2 2 0 0016 3H10a2 2 0 00-2 2z"></path><path d="M16 3v5h5M4 19V7a2 2 0 012-2h2"></path></svg>`,
  pin: `<svg viewBox="0 0 24 24"><path d="M12 2v8m0 0l4 4m-4-4l-4 4m4 8v-4"></path></svg>`,
  edit: `<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  delete: `<svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>`,
  search: `<svg viewBox="0 0 24 24" class="search-icon-svg"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>`,
  profile: `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  settings: `<svg viewBox="0 0 24 24"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"></path><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"></path></svg>`,
  moon: `<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path></svg>`,
  sun: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>`,
  signout: `<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 01-2-2h4M16 17l5-5-5-5M21 12H9"></path></svg>`
};

// ===== UI HELPERS =====
function toggleTheme() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
  localStorage.setItem('quickcopy_dark_mode', isDarkMode);
}

function showToast(message, icon = '✅') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icon}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function createToastContainer() {
  const div = document.createElement('div');
  div.id = 'toast-container';
  div.className = 'toast-container';
  document.body.appendChild(div);
  return div;
}

function getSnippetType(text) {
  if (text.startsWith('http://') || text.startsWith('https://')) return 'link';
  if (text.includes('{') || text.includes('}') || text.includes('=>') || text.includes('const ') || text.includes('function')) return 'code';
  return 'text';
}

// ===== RENDERERS =====
function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="auth-container">
      <h1>QuickCopy</h1>
      <p class="auth-subtitle">Your clipboard, everywhere.</p>
      <div class="glass-card">
        <div class="input-group"><input type="email" id="login-email" placeholder="Email" autocomplete="email" /></div>
        <div class="input-group"><input type="password" id="login-password" placeholder="Password" autocomplete="current-password" /></div>
        <button class="btn btn-primary" id="login-btn">Sign In</button>
        <button class="btn btn-outline" id="forgot-password">Forgot Password?</button>
        <button class="btn btn-outline" id="show-signup">Create New Account</button>
        <div class="google-btn btn" id="google-signin-btn">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" width="18" alt="G">
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

  document.getElementById('forgot-password').onclick = showForgotPasswordModal;
  document.getElementById('show-signup').onclick = renderSignup;
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
        <div class="input-group"><input type="email" id="reset-email" placeholder="Email" /></div>
        <button class="btn btn-primary" id="send-reset">Send Reset Link</button>
        <button class="btn btn-outline" id="back-to-login">← Back</button>
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
        <input type="text" id="signup-name" placeholder="Full Name" style="margin-bottom:12px;" />
        <input type="email" id="signup-email" placeholder="Email" style="margin-bottom:12px;" />
        <input type="password" id="signup-password" placeholder="Password (8+ chars)" style="margin-bottom:12px;" />
        <input type="password" id="signup-confirm" placeholder="Confirm Password" style="margin-bottom:20px;" />
        <button class="btn btn-primary" id="signup-btn">Create Account</button>
        <button class="btn btn-outline" id="back-to-login">Already have an account?</button>
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
  document.getElementById('back-to-login').onclick = renderLogin;
}

function renderApp() {
  const displayName = currentUser.email.split('@')[0];
  filteredSnippets = snippets.filter(s => s.text.toLowerCase().includes(searchTerm.toLowerCase()));

  document.getElementById('app').innerHTML = `
    <div class="header">
      <h2 style="font-weight:800;font-size:1.5rem;">Hello, ${displayName}</h2>
      <div class="profile-dropdown-container">
        <button class="profile-btn" id="profile-btn">${ICONS.profile}</button>
        <div class="dropdown-menu" id="dropdown-menu" style="display:none;">
          <button class="dropdown-item" id="view-profile"><span style="width:20px;height:20px;display:inline-block;margin-right:10px;">${ICONS.settings}</span> Settings</button>
          <button class="dropdown-item" id="toggle-theme"><span style="width:20px;height:20px;display:inline-block;margin-right:10px;">${isDarkMode ? ICONS.sun : ICONS.moon}</span> ${isDarkMode ? 'Light' : 'Dark'} Mode</button>
          <button class="dropdown-item danger" id="delete-account"><span style="width:20px;height:20px;display:inline-block;margin-right:10px;">${ICONS.delete}</span> Delete Account</button>
          <button class="dropdown-item" id="sign-out"><span style="width:20px;height:20px;display:inline-block;margin-right:10px;">${ICONS.signout}</span> Sign Out</button>
        </div>
      </div>
    </div>

    <div class="glass-card" style="padding: 16px; margin-bottom: 24px; max-width:600px; margin-left:auto; margin-right:auto;">
      <div id="input-area" style="display:flex; gap:12px;">
        <input type="text" id="new-snippet" placeholder="Paste anything here..." autocomplete="off" style="margin:0;"/>
        <button id="add-btn" class="btn btn-primary" style="width:auto; padding:0 20px;">Add</button>
      </div>
    </div>

    <div class="search-container">
      ${ICONS.search}
      <input type="text" id="search-input" placeholder="Search your clips..." value="${searchTerm}" />
    </div>

    <div id="snippets-list">
      ${filteredSnippets.length === 0 
        ? `<div class="glass-card" style="text-align:center; color:var(--text-dim); grid-column: 1 / -1;">No clips found.</div>` 
        : filteredSnippets.map((item, i) => {
            const type = getSnippetType(item.text);
            return `
              <div class="snippet-card ${item.pinned ? 'pinned' : ''}">
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

  // --- Events ---
  const profileBtn = document.getElementById('profile-btn');
  const dropdown = document.getElementById('dropdown-menu');
  profileBtn.onclick = (e) => { 
    e.stopPropagation(); 
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block'; 
  };
  document.onclick = () => { dropdown.style.display = 'none'; };

  document.getElementById('toggle-theme').onclick = () => { toggleTheme(); renderApp(); };
  document.getElementById('sign-out').onclick = () => signOut(auth);
  document.getElementById('delete-account').onclick = confirmDeleteAccount;
  document.getElementById('view-profile').onclick = showProfile;
  document.getElementById('add-btn').onclick = addSnippet;
  document.getElementById('new-snippet').onkeypress = (e) => { if (e.key === 'Enter') addSnippet(); };

  const searchInput = document.getElementById('search-input');
  searchInput.oninput = (e) => { searchTerm = e.target.value; renderApp(); document.getElementById('search-input').focus(); };

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.onclick = () => { navigator.clipboard.writeText(filteredSnippets[btn.dataset.index].text); showToast('Copied! 📋'); };
  });
  document.querySelectorAll('.pin-btn').forEach(btn => { btn.onclick = () => togglePin(btn.dataset.id, btn.dataset.pinned === 'true'); });
  document.querySelectorAll('.edit-btn').forEach(btn => { btn.onclick = () => editSnippet(btn.dataset.id, btn.dataset.text); });
  document.querySelectorAll('.delete-btn').forEach(btn => { btn.onclick = () => deleteSnippet(btn.dataset.id); });
}

function showProfile() {
  document.getElementById('app').innerHTML = `
    <div class="header">
      <button class="icon-btn" id="back-to-app" style="width:auto; padding:0 12px; height:40px;">← Back</button>
      <h2 style="font-weight:800;">Settings</h2>
    </div>
    <div style="max-width:600px; margin: 0 auto;">
      <div class="glass-card">
        <h3 style="margin-bottom:16px;">Appearance</h3>
        <p style="color:var(--text-dim); margin-bottom:12px; font-size:0.9rem;">Choose your signature color:</p>
        <div class="palette-grid">
          ${palettes.map(p => `
            <div class="palette-swatch ${activePalette.name === p.name ? 'active' : ''}" 
                 style="background: linear-gradient(135deg, ${p.primary}, ${p.secondary})"
                 onclick="window.setPaletteByName('${p.name}')"></div>
          `).join('')}
        </div>
      </div>
      <div class="glass-card" style="text-align:center;">
        <p style="color:var(--text-dim);">Logged in as<br><strong>${currentUser.email}</strong></p>
      </div>
    </div>
  `;
  document.getElementById('back-to-app').onclick = renderApp;
}

window.setPaletteByName = (name) => {
  const p = palettes.find(pal => pal.name === name);
  if (p) { applyPalette(p); showProfile(); }
};

// ===== ACTIONS =====
async function addSnippet() {
  const input = document.getElementById('new-snippet');
  if (!input.value.trim()) return;
  try {
    await addDoc(collection(db, 'snippets'), { text: input.value.trim(), userId: currentUser.uid, pinned: false, createdAt: new Date().toISOString() });
    input.value = ''; showToast('Added! ✨'); loadSnippets();
  } catch (e) { showToast('Error.', '❌'); }
}

async function togglePin(id, current) {
  try { await updateDoc(doc(db, 'snippets', id), { pinned: !current }); loadSnippets(); } catch (e) { showToast('Error.', '❌'); }
}

async function editSnippet(id, old) {
  const res = prompt('Edit clip:', old);
  if (res) { await updateDoc(doc(db, 'snippets', id), { text: res.trim() }); showToast('Updated!'); loadSnippets(); }
}

async function deleteSnippet(id) {
  if (confirm('Delete?')) { await deleteDoc(doc(db, 'snippets', id)); showToast('Deleted.'); loadSnippets(); }
}

async function loadSnippets() {
  const q = query(collection(db, 'snippets'), where('userId', '==', currentUser.uid));
  const snap = await getDocs(q);
  snippets = [];
  snap.forEach(d => snippets.push({ id: d.id, ...d.data() }));
  snippets.sort((a, b) => a.pinned === b.pinned ? new Date(b.createdAt) - new Date(a.createdAt) : (a.pinned ? -1 : 1));
  renderApp();
}

function confirmDeleteAccount() {
  if (confirm('Wipe everything?')) deleteUser(auth.currentUser).then(renderLogin);
}

function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
function showError(m, i) { const e = document.getElementById(i); if (e) { e.textContent = m; e.style.display = 'block'; setTimeout(() => e.style.display = 'none', 4000); } }
function getFriendlyAuthError(c) { return c.replace('auth/', '').replace(/-/g, ' '); }

onAuthStateChanged(auth, (u) => { if (u) { currentUser = u; loadSnippets(); } else { currentUser = null; renderLogin(); } });
