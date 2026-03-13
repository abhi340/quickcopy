// Use Firebase from window.firebase
const { auth, db, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, deleteUser, updateEmail, collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc } = window.firebase;

let currentUser = null;
let snippets = [];
let filteredSnippets = [];
let isDarkMode = localStorage.getItem('quickcopy_dark_mode') === 'true';
let searchTerm = '';

if (isDarkMode) document.body.classList.add('dark-mode');

function toggleTheme() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
  localStorage.setItem('quickcopy_dark_mode', isDarkMode);
}

// ===== TOAST SYSTEM =====
function showToast(message, icon = '✅') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icon}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
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

// ===== HELPERS =====
function getSnippetType(text) {
  if (text.startsWith('http://') || text.startsWith('https://')) return 'link';
  if (text.includes('{') || text.includes('}') || text.includes('=>') || text.includes('const ') || text.includes('function')) return 'code';
  return 'text';
}

// ===== RENDER LOGIN =====
function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="auth-container">
      <h1>QuickCopy</h1>
      <p class="auth-subtitle">Your clipboard, everywhere.</p>
      <div class="glass-card">
        <div class="input-group">
          <input type="email" id="login-email" placeholder="Email" autocomplete="email" />
        </div>
        <div class="input-group">
          <input type="password" id="login-password" placeholder="Password" autocomplete="current-password" />
        </div>
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
    if (!email || !password) return showError('Please fill in both fields.', 'login-error');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      showError(getFriendlyAuthError(err.code), 'login-error');
    }
  };

  document.getElementById('forgot-password').onclick = showForgotPasswordModal;
  document.getElementById('show-signup').onclick = renderSignup;
  document.getElementById('google-signin-btn').onclick = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      showError(getFriendlyAuthError(err.code), 'login-error');
    }
  };
}

// ===== FORGOT PASSWORD MODAL =====
function showForgotPasswordModal() {
  document.getElementById('app').innerHTML = `
    <div class="auth-container">
      <h1>Reset</h1>
      <p class="auth-subtitle">Enter email to receive reset link.</p>
      <div class="glass-card">
        <div class="input-group">
          <input type="email" id="reset-email" placeholder="Email" />
        </div>
        <button class="btn btn-primary" id="send-reset">Send Reset Link</button>
        <button class="btn btn-outline" id="back-to-login">← Back to Sign In</button>
        <div id="reset-error" class="error" style="display:none;"></div>
      </div>
    </div>
  `;

  document.getElementById('send-reset').onclick = async () => {
    const email = document.getElementById('reset-email').value.trim();
    if (!email) return showError('Please enter your email.', 'reset-error');
    try {
      await sendPasswordResetEmail(auth, email);
      showToast('Reset email sent! 📧');
      renderLogin();
    } catch (err) {
      showError(getFriendlyAuthError(err.code), 'reset-error');
    }
  };

  document.getElementById('back-to-login').onclick = renderLogin;
}

// ===== SIGNUP =====
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
        <button class="btn btn-outline" id="back-to-login">Already have an account? Sign In</button>
        <div id="signup-error" class="error" style="display:none;"></div>
      </div>
    </div>
  `;

  document.getElementById('signup-btn').onclick = async () => {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;

    if (!name || !email || !password) return showError('Please fill all fields.', 'signup-error');
    if (password.length < 8) return showError('Password too short (8+ chars).', 'signup-error');
    if (password !== confirm) return showError('Passwords do not match.', 'signup-error');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await addDoc(collection(db, 'users'), {
        uid: userCredential.user.uid,
        name: name,
        email: email,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      showError(getFriendlyAuthError(err.code), 'signup-error');
    }
  };

  document.getElementById('back-to-login').onclick = renderLogin;
}

// ===== MAIN APP =====
function renderApp() {
  const displayName = currentUser.email.split('@')[0];
  
  // Filter snippets based on search
  filteredSnippets = snippets.filter(s => 
    s.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  document.getElementById('app').innerHTML = `
    <div class="header">
      <h2 style="font-weight:800;font-size:1.5rem;">Hello, ${displayName}</h2>
      <div class="profile-dropdown">
        <button class="profile-btn" id="profile-btn">👤</button>
        <div class="dropdown-menu" id="dropdown-menu" style="display:none;">
          <button class="dropdown-item" id="view-profile"><span>👤</span> Profile</button>
          <button class="dropdown-item" id="toggle-theme"><span>${isDarkMode ? '☀️' : '🌙'}</span> ${isDarkMode ? 'Light' : 'Dark'} Mode</button>
          <button class="dropdown-item danger" id="delete-account"><span>🗑️</span> Delete Account</button>
          <button class="dropdown-item" id="sign-out"><span>🚪</span> Sign Out</button>
        </div>
      </div>
    </div>

    <div class="glass-card" style="padding: 16px; margin-bottom: 24px;">
      <div id="input-area" style="display:flex; gap:12px;">
        <input type="text" id="new-snippet" placeholder="Paste anything here..." autocomplete="off" style="margin:0;"/>
        <button id="add-btn" class="btn-primary" style="padding:0 20px; border-radius:14px; border:none; cursor:pointer; font-weight:600;">Add</button>
      </div>
    </div>

    <div class="search-container">
      <span class="search-icon">🔍</span>
      <input type="text" id="search-input" placeholder="Search your clips..." value="${searchTerm}" />
    </div>

    <div id="snippets-list">
      ${filteredSnippets.length === 0 
        ? `<div class="glass-card" style="text-align:center; color:var(--text-dim);">No clips found.</div>` 
        : filteredSnippets.map((item, i) => {
            const type = getSnippetType(item.text);
            return `
              <div class="snippet-card ${item.pinned ? 'pinned' : ''}">
                <span class="badge badge-${type}">${type}</span>
                <div class="snippet-content">${escapeHtml(item.text)}</div>
                <div class="snippet-footer">
                  <div class="actions-group">
                    <button class="icon-btn copy-btn" data-index="${i}" title="Copy">📋</button>
                    <button class="icon-btn pin-btn ${item.pinned ? 'active' : ''}" data-id="${item.id}" data-pinned="${item.pinned}" title="Pin">📌</button>
                  </div>
                  <div class="actions-group">
                    <button class="icon-btn edit-btn" data-id="${item.id}" data-text="${escapeHtml(item.text)}" title="Edit">✏️</button>
                    <button class="icon-btn delete-btn" data-id="${item.id}" title="Delete">🗑️</button>
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
  profileBtn.onclick = (e) => { e.stopPropagation(); dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block'; };
  document.onclick = () => dropdown.style.display = 'none';

  document.getElementById('toggle-theme').onclick = () => { toggleTheme(); renderApp(); };
  document.getElementById('sign-out').onclick = () => signOut(auth);
  document.getElementById('delete-account').onclick = confirmDeleteAccount;
  document.getElementById('view-profile').onclick = showProfile;
  document.getElementById('add-btn').onclick = addSnippet;
  document.getElementById('new-snippet').onkeypress = (e) => { if (e.key === 'Enter') addSnippet(); };

  // Search Logic
  const searchInput = document.getElementById('search-input');
  searchInput.oninput = (e) => {
    searchTerm = e.target.value;
    renderApp();
    document.getElementById('search-input').focus(); // Keep focus
  };

  // Snippet Actions
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = btn.dataset.index;
      navigator.clipboard.writeText(filteredSnippets[idx].text);
      showToast('Copied to clipboard! 📋');
    };
  });

  document.querySelectorAll('.pin-btn').forEach(btn => {
    btn.onclick = () => togglePin(btn.dataset.id, btn.dataset.pinned === 'true');
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = () => editSnippet(btn.dataset.id, btn.dataset.text);
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = () => deleteSnippet(btn.dataset.id);
  });
}

// ===== SNIPPET ACTIONS =====
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
    showToast('Snippet added! ✨');
    loadSnippets();
  } catch (e) { showToast('Error adding snippet.', '❌'); }
}

async function togglePin(id, currentStatus) {
  try {
    await updateDoc(doc(db, 'snippets', id), { pinned: !currentStatus });
    loadSnippets();
  } catch (e) { showToast('Error pinning.', '❌'); }
}

async function editSnippet(id, oldText) {
  const newText = prompt('Edit clip:', oldText);
  if (newText === null || newText.trim() === '') return;
  try {
    await updateDoc(doc(db, 'snippets', id), { text: newText.trim() });
    showToast('Updated! ✏️');
    loadSnippets();
  } catch (e) { showToast('Update failed.', '❌'); }
}

async function deleteSnippet(id) {
  if (!confirm('Delete forever?')) return;
  try {
    await deleteDoc(doc(db, 'snippets', id));
    showToast('Deleted. 🗑️');
    loadSnippets();
  } catch (e) { showToast('Delete failed.', '❌'); }
}

// ===== PROFILE =====
async function showProfile() {
  const user = auth.currentUser;
  let name = user.email.split('@')[0];
  const snap = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
  if (!snap.empty) name = snap.docs[0].data().name;

  document.getElementById('app').innerHTML = `
    <div class="header">
      <button class="icon-btn" id="back-to-app" style="width:auto; padding:0 12px;">← Back</button>
      <h2 style="font-weight:800;">Profile</h2>
    </div>
    <div class="glass-card" style="text-align:center;">
      <div style="font-size:4rem; margin-bottom:16px;">👤</div>
      <h2 style="margin-bottom:4px;">${name}</h2>
      <p style="color:var(--text-dim); margin-bottom:24px;">${user.email}</p>
      
      <div style="text-align:left; background:rgba(0,0,0,0.1); padding:16px; border-radius:14px; font-size:0.9rem;">
        <p style="margin-bottom:8px;"><strong>Account UID:</strong><br>${user.uid}</p>
        <p><strong>Member Since:</strong><br>${new Date(user.metadata.creationTime).toLocaleDateString()}</p>
      </div>
    </div>
  `;
  document.getElementById('back-to-app').onclick = renderApp;
}

// ===== ACCOUNT MANAGEMENT =====
function confirmDeleteAccount() {
  if (!confirm('⚠️ Wipe ALL data and delete account permanently?')) return;
  deleteUser(auth.currentUser).then(async () => {
    const q = query(collection(db, 'snippets'), where('userId', '==', currentUser.uid));
    const snap = await getDocs(q);
    const promises = [];
    snap.forEach(d => promises.push(deleteDoc(d.ref)));
    await Promise.all(promises);
    currentUser = null;
    renderLogin();
  }).catch(e => showToast('Failed to delete account.', '❌'));
}

// ===== INIT & LOAD =====
async function loadSnippets() {
  try {
    const q = query(collection(db, 'snippets'), where('userId', '==', currentUser.uid));
    const snap = await getDocs(q);
    snippets = [];
    snap.forEach(d => snippets.push({ id: d.id, ...d.data() }));
    
    // Sort: Pinned first, then by date
    snippets.sort((a, b) => {
      if (a.pinned === b.pinned) return new Date(b.createdAt) - new Date(a.createdAt);
      return a.pinned ? -1 : 1;
    });
    
    renderApp();
  } catch (e) { showToast('Error loading snippets.', '❌'); }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showError(msg, id) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 4000);
  }
}

function getFriendlyAuthError(code) {
  switch (code) {
    case 'auth/invalid-email': return 'Invalid email.';
    case 'auth/user-not-found': return 'Account not found.';
    case 'auth/wrong-password': return 'Incorrect password.';
    case 'auth/email-already-in-use': return 'Email already registered.';
    case 'auth/weak-password': return 'Password too weak.';
    default: return 'Something went wrong.';
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loadSnippets();
  } else {
    currentUser = null;
    renderLogin();
  }
});
