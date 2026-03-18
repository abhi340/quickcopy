import { auth, db, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, deleteUser, collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc } from './firebase.js';
import { ICONS } from './icons.js';
import { palettes, applyPalette, toggleTheme } from './theme.js';
import { showToast, escapeHtml, showError, getFriendlyAuthError, getSnippetType, showJokeModal } from './utils.js';

// Initialization Check
console.log("🚀 QuickCopy Pro Initializing...");
if (window.location.protocol === 'file:') {
  console.error("🛑 SECURITY ERROR: Modules are blocked on file:// protocol.");
  alert("QuickCopy Pro cannot run via file://. Please use a local server (like Live Server or 'npx serve').");
}

let currentUser = null;
let snippets = [];
let filteredSnippets = [];
let searchTerm = '';
let currentView = 'active'; // active, archived, trash
let currentTag = 'all'; // all, #Link, #Code
let selectedIdx = -1; // Vim-style navigation
let currentActivePage = ''; // dashboard, login, loading, signup, reset

function highlightSearch(text, term) {
  if (!term || term.length < 2) return text;
  const regex = new RegExp(`(${term})`, 'gi');
  return text.replace(regex, '<span class="search-highlight">$1</span>');
}

// ===== UTILS & VALIDATION =====
function isValidEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function setLoading(btnId, isLoading, originalText) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (isLoading) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" style="width:16px; height:16px; border-width:2px; margin-right:8px; display:inline-block; vertical-align:middle;"></span> Processing...`;
    btn.style.opacity = '0.7';
  } else {
    btn.disabled = false;
    btn.innerHTML = originalText;
    btn.style.opacity = '1';
  }
}

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

// ===== UI STATE CONTROLLER =====
function clearApp() {
  const app = document.getElementById('app');
  if (app) app.innerHTML = '';
}

// ===== HUMOROUS ERROR HANDLER =====
function getHumorousError(code) {
  const authJokes = [
    "Wait, who are you again? 🕵️‍♂️",
    "Wrong password. Even my cat knows it. 🐱",
    "Invalid credentials. Did you forget you exist? 👻",
    "Nope. Try a password that actually works this time. 🙊",
    "Access denied. Maybe try '123456'? (Just kidding, don't). 🙅‍♂️",
    "Your email and password are having an argument. They don't match. 😤"
  ];
  const serverJokes = [
    "Our server is taking a nap. Try again in a bit. 😴",
    "Something went wrong. A squirrel probably chewed the wire. 🐿️",
    "500 Error: The server is currently reconsidering its life choices. 🤔",
    "Cloud failure. It's raining bugs today. 🌧️",
    "Server timed out. It went to get a coffee. ☕"
  ];

  if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
    return authJokes[Math.floor(Math.random() * authJokes.length)];
  }
  if (code.includes('network-request-failed') || code.includes('internal-error')) {
    return serverJokes[Math.floor(Math.random() * serverJokes.length)];
  }
  return code.replace('auth/', '').replace(/-/g, ' '); 
}

// Global Auth Event Delegate (Handles navigation robustly)
document.addEventListener('click', (e) => {
  const target = e.target.closest('button, .btn-link');
  if (!target) return;
  
  if (target.id === 'show-signup-btn') { e.preventDefault(); renderSignup(); }
  if (target.id === 'forgot-password-btn') { e.preventDefault(); showForgotPasswordModal(); }
  if (target.id === 'back-to-login' || target.id === 'back-to-login-signup') { e.preventDefault(); renderLogin(true); }
});

// ===== AUTH RENDERERS =====
function renderLogin(force = false) {
  if (!force && currentActivePage === 'login') return;
  currentActivePage = 'login';
  console.log("🔑 Rendering Login Screen...");
  
  clearApp();
  const appEl = document.getElementById('app');
  if (!appEl) return;
  
  appEl.innerHTML = `
    <div class="landing-layout" style="animation: fadeIn 0.3s ease-out;">
      <div class="landing-hero">
        <h1>Your Digital<br>Second Brain.</h1>
        <p>Sync your clipboard, code snippets, and links across all devices instantly. Built with End-to-End security and a stunning Glassmorphism UI.</p>
        <div class="landing-features">
          <div class="landing-feature">
            <div class="icon-box">${ICONS.shield}</div>
            <div>
              <div class="feat-title">Zero-Trust Architecture</div>
              <div class="feat-desc">Your data is encrypted and secure.</div>
            </div>
          </div>
          <div class="landing-feature">
            <div class="icon-box">${ICONS.markdown}</div>
            <div>
              <div class="feat-title">Native Markdown</div>
              <div class="feat-desc">Beautifully rendered notes and code.</div>
            </div>
          </div>
          <div class="landing-feature">
            <div class="icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg></div>
            <div>
              <div class="feat-title">Install Anywhere</div>
              <div class="feat-desc">Full PWA support for Mobile and Desktop.</div>
            </div>
          </div>
        </div>
      </div>
      <div class="landing-auth">
        <div class="auth-container">
          <div class="glass-card">
            <h2>Welcome Back</h2>
            <input type="email" id="login-email" placeholder="Email" autocomplete="email" />
            <input type="password" id="login-password" placeholder="Password" autocomplete="current-password" />
            <button class="btn btn-primary" id="login-btn">Sign In</button>
            <div style="margin: 10px 0;">
              <button class="btn-link" id="forgot-password-btn">Forgot Password?</button>
            </div>
            <button class="btn btn-outline" id="show-signup-btn">Create New Account</button>
            
            <div class="google-btn btn" id="google-signin-btn">
              <span class="nav-icon">${ICONS.google}</span>
              <span>Continue with Google</span>
            </div>
            <div id="login-error" class="auth-error-msg" style="display:none;"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('login-btn').onclick = async () => {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) return showError('Fields required.', 'login-error');
    if (!isValidEmail(email)) return showError('Invalid email format.', 'login-error');

    setLoading('login-btn', true, 'Sign In');
    try { await signInWithEmailAndPassword(auth, email, password); } 
    catch (err) { showError(getHumorousError(err.code), 'login-error'); }
    finally { setLoading('login-btn', false, 'Sign In'); }
  };

  document.getElementById('google-signin-btn').onclick = async () => {
    const original = document.getElementById('google-signin-btn').innerHTML;
    setLoading('google-signin-btn', true, original);
    try { 
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider); 
    } catch (err) { 
      showError(getHumorousError(err.code), 'login-error'); 
    } finally {
      setLoading('google-signin-btn', false, original);
    }
  };
}

function showForgotPasswordModal() {
  currentActivePage = 'reset';
  clearApp();
  document.getElementById('app').innerHTML = `
    <div class="auth-container" style="margin: 100px auto; max-width: 400px; animation: fadeIn 0.3s ease-out;">
      <h1>Reset</h1>
      <p class="auth-subtitle">Enter email for reset link.</p>
      <div class="glass-card">
        <input type="email" id="reset-email" placeholder="Email" />
        <button class="btn btn-primary" id="send-reset">Send Reset Link</button>
        <div style="margin-top: 10px;">
          <button class="btn-link" id="back-to-login">← Back to Sign In</button>
        </div>
        <div id="reset-error" class="auth-error-msg" style="display:none;"></div>
      </div>
    </div>
  `;
  document.getElementById('send-reset').onclick = async () => {
    const email = document.getElementById('reset-email').value.trim();
    if (!isValidEmail(email)) return showError('Invalid email format.', 'reset-error');
    setLoading('send-reset', true, 'Send Reset Link');
    try { 
      await sendPasswordResetEmail(auth, email); 
      showToast('Email sent! 📧'); 
      renderLogin(true); 
    } catch (err) { 
      showError(getHumorousError(err.code), 'reset-error'); 
    } finally {
      setLoading('send-reset', false, 'Send Reset Link');
    }
  };
}

function renderSignup() {
  currentActivePage = 'signup';
  clearApp();
  document.getElementById('app').innerHTML = `
    <div class="auth-container" style="margin: 60px auto; max-width: 400px; animation: fadeIn 0.3s ease-out;">
      <h1>Join Us</h1>
      <p class="auth-subtitle">Start syncing in seconds.</p>
      <div class="glass-card">
        <input type="text" id="signup-name" placeholder="Full Name" />
        <input type="email" id="signup-email" placeholder="Email" />
        <input type="password" id="signup-password" placeholder="Password (8+ chars)" />
        <input type="password" id="signup-confirm" placeholder="Confirm Password" />
        <button class="btn btn-primary" id="signup-btn">Create Account</button>
        <div style="margin-top: 10px;">
          <button class="btn-link" id="back-to-login-signup">Already have an account?</button>
        </div>
        <div id="signup-error" class="auth-error-msg" style="display:none;"></div>
      </div>
    </div>
  `;
  document.getElementById('signup-btn').onclick = async () => {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    if (!name || !email || !password) return showError('All fields are required.', 'signup-error');
    if (!isValidEmail(email)) return showError('Invalid email format.', 'signup-error');
    if (password.length < 8) return showError('Password min 8 chars.', 'signup-error');
    if (password !== document.getElementById('signup-confirm').value) return showError('Passwords mismatch.', 'signup-error');
    
    setLoading('signup-btn', true, 'Create Account');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await addDoc(collection(db, 'users'), { uid: cred.user.uid, name, email, createdAt: new Date().toISOString() });
    } catch (err) { 
      showError(getHumorousError(err.code), 'signup-error'); 
    } finally {
      setLoading('signup-btn', false, 'Create Account');
    }
  };
}

// ===== MAIN APP RENDERER =====
function renderApp() {
  if (!currentUser) return;
  if (currentActivePage === 'dashboard') return;
  currentActivePage = 'dashboard';
  
  clearApp();
  const initialName = currentUser.email ? currentUser.email.split('@')[0] : 'User';
  const safeDisplayName = escapeHtml(initialName);
  const safeSearchTerm = escapeHtml(searchTerm);

  document.getElementById('app').innerHTML = `
    <div class="header" style="animation: fadeIn 0.3s ease-out;">
      <div class="user-greeting">Hello, <span id="header-user-name">${safeDisplayName}</span></div>
      <div class="header-search-container">
        ${ICONS.search}
        <input type="text" id="search-input" placeholder="Search clips..." value="${safeSearchTerm}" />
      </div>
      <div class="profile-dropdown-container">
        <button class="profile-btn" id="profile-btn">${ICONS.profile}</button>
        <div class="dropdown-menu" id="dropdown-menu">
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

    <div class="glass-card toolbar-row">
      <div class="toolbar-tabs">
        <button class="btn btn-outline ${currentView === 'active' ? 'active' : ''}" id="view-active">Active</button>
        <button class="btn btn-outline ${currentView === 'archived' ? 'active' : ''}" id="view-archived">Archived</button>
        <button class="btn btn-outline ${currentView === 'trash' ? 'active' : ''}" id="view-trash">Trash</button>
      </div>

      <div id="input-area">
        <div style="flex: 1; position: relative;">
          <textarea id="new-snippet" placeholder="Paste link or text..." autocomplete="off"></textarea>
          <div class="input-hint" style="position: absolute; right: 15px; top: 14px; pointer-events: none; font-size: 0.7rem; color: var(--text-dim); opacity: 0.6;">
            Shift+Enter ↵
          </div>
        </div>
        <button id="add-btn" class="btn btn-primary">Add Clip</button>
      </div>
    </div>

    <div id="tag-filters-container" style="display: flex; gap: 8px; margin-bottom: 24px; overflow-x: auto;"></div>

    <div id="snippets-list-container"></div>

    <footer class="app-footer">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 24px; margin-bottom: 32px;">
        <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap; justify-content: center;">
          <button id="generate-joke-btn" class="btn btn-primary" style="box-shadow: none; height: 40px; padding: 0 16px; font-size: 0.85rem; background: #f59e0b;">
            <span style="font-size: 1.1rem; margin-right: 8px;">🎁</span> Donate
          </button>
          <a href="mailto:abhicm019@gmail.com?subject=QuickCopy Pro Feedback" class="btn btn-outline" style="height: 40px; padding: 0 16px; font-size: 0.85rem; border-color: var(--glass-border); background: var(--glass);">
            <span class="nav-icon" style="width: 16px; height: 16px; display: inline-flex;">${ICONS.feedback}</span> Send Feedback
          </a>
        </div>
      </div>
      <div class="footer-links">
        <a href="about.html">About</a>
        <a href="features.html">Features</a>
        <a href="privacy.html">Privacy</a>
        <a href="changelog.html">Changelog</a>
      </div>
      <p>&copy; 2026 QuickCopy Pro. All rights reserved.</p>
    </footer>
  `;

  fetchUserDisplayName();

  const profileBtn = document.getElementById('profile-btn');
  const dropdown = document.getElementById('dropdown-menu');
  const searchInput = document.getElementById('search-input');

  if (profileBtn) {
    profileBtn.onclick = (e) => { 
      e.stopPropagation(); 
      dropdown.classList.toggle('show'); 
    };
  }
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-dropdown-container') && dropdown) {
      dropdown.classList.remove('show');
    }
  });

  const vA = document.getElementById('view-active');
  const vAr = document.getElementById('view-archived');
  const vT = document.getElementById('view-trash');
  if (vA) vA.onclick = () => { currentView = 'active'; renderSnippets(); };
  if (vAr) vAr.onclick = () => { currentView = 'archived'; renderSnippets(); };
  if (vT) vT.onclick = () => { currentView = 'trash'; renderSnippets(); };

  const sBtn = document.getElementById('settings-btn');
  if (sBtn) sBtn.onclick = (e) => { e.stopPropagation(); window.location.href = 'settings.html'; };

  const tBtn = document.getElementById('toggle-theme-btn');
  if (tBtn) tBtn.onclick = (e) => { e.stopPropagation(); toggleTheme(); currentActivePage = ''; renderApp(); };

  const soBtn = document.getElementById('sign-out-btn');
  if (soBtn) soBtn.onclick = () => { currentActivePage = ''; signOut(auth); };
  
  const delBtn = document.getElementById('delete-account-btn');
  if (delBtn) delBtn.onclick = confirmDeleteAccount;

  const addBtn = document.getElementById('add-btn');
  if (addBtn) addBtn.onclick = addSnippet;

  const jokeBtn = document.getElementById('generate-joke-btn');
  if (jokeBtn) jokeBtn.onclick = showJokeModal;

    const nSnip = document.getElementById('new-snippet');
    const inputHint = document.querySelector('.input-hint');
    if (nSnip) {
      nSnip.oninput = () => {
        if (inputHint) inputHint.style.display = nSnip.value.length > 0 ? 'none' : 'block';
        
        // Use 'auto' to get the true content height for shrinking
        nSnip.style.height = 'auto';
        const newHeight = nSnip.scrollHeight;
        // Clamp between 52px and 400px
        nSnip.style.height = Math.max(52, newHeight) + 'px';
        
        nSnip.style.overflowY = newHeight >= 400 ? 'auto' : 'hidden';
      };
      nSnip.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          addSnippet();
          nSnip.style.height = '52px';
          nSnip.style.overflowY = 'hidden';
          if (inputHint) inputHint.style.display = 'block';
        }
      };
    }

  if (searchInput) searchInput.oninput = (e) => { searchTerm = e.target.value; renderSnippets(); };

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
  } catch (err) {}
}

function renderSnippets() {
  const container = document.getElementById('snippets-list-container');
  if (!container) return;

  const vActive = document.getElementById('view-active');
  const vArchived = document.getElementById('view-archived');
  const vTrash = document.getElementById('view-trash');
  
  if (vActive) vActive.classList.toggle('active', currentView === 'active');
  if (vArchived) vArchived.classList.toggle('active', currentView === 'archived');
  if (vTrash) vTrash.classList.toggle('active', currentView === 'trash');

  filteredSnippets = snippets.filter(s => {
    const matchesSearch = s.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = (s.status || 'active') === currentView;
    const matchesTag = currentTag === 'all' || (s.tags && s.tags.includes(currentTag));
    return matchesSearch && matchesStatus && matchesTag;
  });

  const allTags = new Set();
  snippets.filter(s => (s.status || 'active') === currentView).forEach(s => {
    if (s.tags) s.tags.forEach(t => allTags.add(t));
  });
  
  const tagsContainer = document.getElementById('tag-filters-container');
  if (tagsContainer) {
    if (allTags.size > 0) {
      tagsContainer.innerHTML = `
        <button class="badge ${currentTag === 'all' ? 'badge-text' : ''}" data-tag="all" style="cursor:pointer; opacity: ${currentTag === 'all' ? '1' : '0.5'}; border: 1px solid var(--glass-border); background: transparent;">All</button>
        ${Array.from(allTags).map(tag => `
          <button class="badge ${tag === '#Link' ? 'badge-link' : (tag === '#Code' ? 'badge-code' : 'badge-text')}" data-tag="${tag}" style="cursor:pointer; opacity: ${currentTag === tag ? '1' : '0.5'}; border: 1px solid var(--glass-border);">${tag}</button>
        `).join('')}
      `;
      tagsContainer.querySelectorAll('button').forEach(btn => {
        btn.onclick = () => { currentTag = btn.dataset.tag; renderSnippets(); };
      });
    } else {
      tagsContainer.innerHTML = '';
    }
  }

  container.innerHTML = `
    <div id="snippets-list">
      ${filteredSnippets.length === 0 
        ? `<div class="glass-card empty-state" style="text-align:center; color:var(--text-dim);">No clips found.</div>` 
        : filteredSnippets.map((item, i) => {
            const type = getSnippetType(item.text);
            const isTrash = item.status === 'trash';
            const isArchived = item.status === 'archived';
            const isMarkdown = item.isMarkdown || false;

            let contentHtml = highlightSearch(escapeHtml(item.text), searchTerm);
            let richMediaHtml = '';

            if (type === 'link' && item.text.startsWith('http')) {
              try {
                const urlObj = new URL(item.text);
                const domain = urlObj.hostname;
                richMediaHtml = `
                  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding: 12px; background: var(--glass); border-radius: 12px; border: 1px solid var(--glass-border);">
                    <img src="https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=32" style="width: 32px; height: 32px; border-radius: 8px;" onerror="this.style.display='none'" />
                    <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; flex: 1;">
                      <a href="${item.text}" target="_blank" style="color: var(--primary); text-decoration: none;">Visit ${domain} ↗</a>
                    </div>
                  </div>
                `;
              } catch(e) {}
            }

            if (isMarkdown && window.marked && window.DOMPurify) {
              try {
                const rawHtml = marked.parse(item.text);
                contentHtml = `<div class="markdown-body">${DOMPurify.sanitize(rawHtml)}</div>`;
                if (searchTerm && searchTerm.length >= 2) contentHtml = highlightSearch(contentHtml, searchTerm);
              } catch (e) {}
            } else if (type === 'code') {
              contentHtml = `<div class="code-block">${contentHtml}</div>`;
            }

            return `
              <div class="snippet-card ${item.pinned ? 'pinned' : ''} ${selectedIdx === i ? 'selected' : ''}" data-index="${i}">
                <div class="snippet-header">
                  <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                    <span class="badge badge-${type}">${type}</span>
                    ${(item.tags || []).map(t => `<span class="badge ${t === '#Link' ? 'badge-link' : (t === '#Code' ? 'badge-code' : 'badge-text')}" style="opacity: 0.8;">${t}</span>`).join('')}
                  </div>
                  <div style="display: flex; gap: 4px;">
                    ${item.isPublic ? '<span class="badge badge-link" style="background: rgba(168, 85, 247, 0.15); color: #a855f7;">Public</span>' : ''}
                    ${isMarkdown ? '<span class="badge badge-code" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">MD</span>' : ''}
                  </div>
                </div>
                <div class="snippet-content">${richMediaHtml}${contentHtml}</div>
                <div class="snippet-footer">
                  <div class="actions-group">
                    ${!isTrash ? `
                      <button class="icon-btn pin-btn ${item.pinned ? 'active' : ''}" data-id="${item.id}" data-pinned="${item.pinned}" title="Pin">${ICONS.pin}</button>
                      <button class="icon-btn share-btn" data-id="${item.id}" data-public="${item.isPublic || false}" title="Share">${ICONS.share}</button>
                      <button class="icon-btn md-btn ${isMarkdown ? 'active' : ''}" data-id="${item.id}" data-md="${isMarkdown}" title="Markdown">${ICONS.markdown}</button>
                      <button class="icon-btn edit-btn" data-id="${item.id}" data-text="${escapeHtml(item.text)}" title="Edit">${ICONS.edit}</button>
                      <button class="icon-btn archive-btn" data-id="${item.id}" data-status="${item.status || 'active'}" title="${isArchived ? 'Unarchive' : 'Archive'}">${ICONS.archive}</button>
                    ` : ''}
                    <button class="icon-btn delete-btn" data-id="${item.id}" data-status="${item.status || 'active'}" title="Delete">${ICONS.delete}</button>
                    ${isTrash ? `<button class="icon-btn restore-btn" data-id="${item.id}" title="Restore">${ICONS.restore}</button>` : ''}
                    <button class="icon-btn copy-btn" data-index="${i}" title="Copy">${ICONS.copy}</button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
    </div>
  `;

  document.querySelectorAll('.snippet-card').forEach(card => {
    card.onclick = (e) => {
      if (e.target.closest('.icon-btn')) return;
      const idx = card.dataset.index;
      navigator.clipboard.writeText(filteredSnippets[idx].text);
      showToast('Copied! 📋');
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

// ===== ACTIONS =====
async function addSnippet() {
  const input = document.getElementById('new-snippet');
  const val = input.value.trim();
  if (!val) return;
  const type = getSnippetType(val);
  const tags = type === 'link' ? ['#Link'] : (type === 'code' ? ['#Code'] : []);
  try {
    await addDoc(collection(db, 'snippets'), { text: val, userId: currentUser.uid, pinned: false, status: 'active', isPublic: false, isMarkdown: false, tags, createdAt: new Date().toISOString() });
    input.value = ''; 
    showToast('Synced! ✨'); 
    loadSnippets();
  } catch (e) { showToast('Sync failed.', '❌'); }
}

async function togglePin(id, current) {
  try { await updateDoc(doc(db, 'snippets', id), { pinned: !current }); loadSnippets(); } catch (e) {}
}

async function togglePublic(id, current) {
  try { 
    await updateDoc(doc(db, 'snippets', id), { isPublic: !current }); 
    if (!current) {
      const shareUrl = new URL(`public.html?id=${id}`, window.location.href.split('?')[0].split('#')[0]).href;
      navigator.clipboard.writeText(shareUrl);
      showToast('Link copied! 🔗');
    } else { showToast('Link disabled.'); }
    loadSnippets(); 
  } catch (e) {}
}

async function toggleMarkdown(id, current) {
  try { await updateDoc(doc(db, 'snippets', id), { isMarkdown: !current }); loadSnippets(); } catch (e) {}
}

async function updateStatus(id, newStatus) {
  try { await updateDoc(doc(db, 'snippets', id), { status: newStatus }); loadSnippets(); } catch (e) {}
}

async function handleDeletion(id, currentStatus) {
  if (currentStatus === 'trash') {
    if (confirm('Permanently delete?')) { await deleteDoc(doc(db, 'snippets', id)); showToast('Wiped.'); loadSnippets(); }
  } else { await updateStatus(id, 'trash'); showToast('Moved to Trash.'); }
}

async function editSnippet(id, old) {
  const res = prompt('Edit clip:', old);
  if (res && res.trim()) { await updateDoc(doc(db, 'snippets', id), { text: res.trim() }); showToast('Updated!'); loadSnippets(); }
}

async function loadSnippets() {
  if (!currentUser) return;
  try {
    const q = query(collection(db, 'snippets'), where('userId', '==', currentUser.uid));
    const snap = await getDocs(q);
    snippets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    snippets.sort((a, b) => a.pinned === b.pinned ? new Date(b.createdAt) - new Date(a.createdAt) : (a.pinned ? -1 : 1));
    renderSnippets();
  } catch (e) {}
}

function confirmDeleteAccount() {
  if (confirm('DANGER: Delete ALL data and account?')) {
    deleteUser(auth.currentUser).then(() => { window.location.reload(); }).catch(e => showError("Failed."));
  }
}

// ===== KEYBOARD =====
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter' && document.activeElement.id === 'new-snippet') addSnippet();
  if ((e.ctrlKey && e.key === 'f') || e.key === '/') {
    if (document.activeElement.tagName !== 'INPUT') { e.preventDefault(); document.getElementById('search-input')?.focus(); }
  }
  if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    if (e.key === 'j') { e.preventDefault(); selectedIdx = Math.min(selectedIdx + 1, filteredSnippets.length - 1); renderSnippets(); document.querySelector(`[data-index="${selectedIdx}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    if (e.key === 'k') { e.preventDefault(); selectedIdx = Math.max(selectedIdx - 1, 0); renderSnippets(); document.querySelector(`[data-index="${selectedIdx}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    if (e.key === 'y' && selectedIdx !== -1) { navigator.clipboard.writeText(filteredSnippets[selectedIdx].text); showToast('Copied! 📋'); }
  }
  if (e.altKey && e.key >= '1' && e.key <= '9') {
    const idx = parseInt(e.key) - 1;
    if (filteredSnippets[idx]) { navigator.clipboard.writeText(filteredSnippets[idx].text); showToast(`Snippet #${e.key} Copied!`); }
  }
  if (e.key === 'Escape') { searchTerm = ''; selectedIdx = -1; const si = document.getElementById('search-input'); if (si) si.value = ''; document.activeElement.blur(); renderSnippets(); }
});

// ===== INITIALIZATION =====
onAuthStateChanged(auth, (u) => { 
  if (u) { currentUser = u; renderApp(); loadSnippets(); } 
  else { currentUser = null; currentActivePage = ''; renderLogin(); } 
});
