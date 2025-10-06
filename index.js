// Use Firebase from window.firebase (initialized in index.html)
const { auth, db, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, deleteUser, updateEmail, collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc } = window.firebase;

let currentUser = null;
let snippets = [];
let isDarkMode = localStorage.getItem('quickcopy_dark_mode') === 'true';

if (isDarkMode) document.body.classList.add('dark-mode');

function toggleTheme() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
  localStorage.setItem('quickcopy_dark_mode', isDarkMode);
}

// ===== RENDER LOGIN =====
function renderLogin() {
  document.getElementById('app').innerHTML = `
    <h1>QuickCopy</h1>
    <div class="card">
      <h2>Sign In</h2>
      <input type="email" id="login-email" placeholder="Email" autocomplete="email" />
      <input type="password" id="login-password" placeholder="Password" autocomplete="current-password" />
      <button class="btn primary" id="login-btn">Sign In</button>
      <button class="btn text" id="forgot-password" style="text-align:right;">Forgot Password?</button>
      <button class="btn outline" id="show-signup">Create Account</button>
      <div class="google-btn" id="google-signin-btn">
        <span class="g-logo"></span>
        <span>Sign in with Google</span>
      </div>
      <div id="login-error" class="error" style="display:none;"></div>
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
    <h1>Reset Password</h1>
    <div class="card">
      <p>Enter your email and we’ll send you a link to reset your password.</p>
      <input type="email" id="reset-email" placeholder="Email" autocomplete="email" />
      <button class="btn primary" id="send-reset">Send Reset Link</button>
      <button class="btn text" id="back-to-login">← Back to Sign In</button>
      <div id="reset-error" class="error" style="display:none;"></div>
    </div>
  `;

  document.getElementById('send-reset').onclick = async () => {
    const email = document.getElementById('reset-email').value.trim();
    if (!email) return showError('Please enter your email.', 'reset-error');
    try {
      await sendPasswordResetEmail(auth, email);
      showError('✅ Reset email sent! Check your inbox.', 'reset-error');
    } catch (err) {
      showError(getFriendlyAuthError(err.code), 'reset-error');
    }
  };

  document.getElementById('back-to-login').onclick = renderLogin;
}

// ===== SIGNUP =====
function renderSignup() {
  document.getElementById('app').innerHTML = `
    <h1>QuickCopy</h1>
    <div class="card">
      <h2>Create Account</h2>
      <input type="text" id="signup-name" placeholder="Full Name" autocomplete="name" />
      <input type="email" id="signup-email" placeholder="Email" autocomplete="email" />
      <input type="password" id="signup-password" placeholder="Password (8+ chars)" autocomplete="new-password" />
      <input type="password" id="signup-confirm" placeholder="Confirm Password" autocomplete="new-password" />
      <button class="btn primary" id="signup-btn">Create Account</button>
      <button class="btn text" id="back-to-login">← Back to Sign In</button>
      <div id="signup-error" class="error" style="display:none;"></div>
    </div>
  `;

  document.getElementById('signup-btn').onclick = async () => {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;

    if (!name) return showError('Please enter your full name.', 'signup-error');
    if (!email) return showError('Please enter your email.', 'signup-error');
    if (!password) return showError('Please enter a password.', 'signup-error');
    if (password.length < 8) return showError('Password must be at least 8 characters long.', 'signup-error');
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
  const displayName = currentUser.email.split('@')[0] || 'User';
  document.getElementById('app').innerHTML = `
    <div class="header">
      <h1>Welcome, ${displayName}!</h1>
      <div class="profile-dropdown">
        <button class="profile-btn" id="profile-btn">👤</button>
        <div class="dropdown-menu" id="dropdown-menu" style="display:none;">
          <button class="dropdown-item" id="view-profile"><span>👤</span> Profile</button>
          <button class="dropdown-item" id="toggle-theme"><span>${isDarkMode ? '☀️' : '🌙'}</span> ${isDarkMode ? 'Light Mode' : 'Dark Mode'}</button>
          <button class="dropdown-item danger" id="delete-account"><span>🗑️</span> Delete Account</button>
          <button class="dropdown-item" id="sign-out"><span>🚪</span> Sign Out</button>
        </div>
      </div>
    </div>
    <div id="input-area">
      <input type="text" id="new-snippet" placeholder="Add a new snippet..." autocomplete="off" />
      <button id="add-btn">Add</button>
    </div>
    <div id="snippets">
      ${snippets.length === 0 
        ? '<p class="empty">No snippets yet.</p>' 
        : snippets.map((item, i) => `
          <div class="snippet">
            <span class="snippet-text">${escapeHtml(item.text)}</span>
            <div class="snippet-actions">
              <button class="copy-btn" data-index="${i}">Copy</button>
              <button class="icon-btn edit-btn" data-id="${item.id}" data-index="${i}" title="Edit">✏️</button>
              <button class="icon-btn delete-btn" data-id="${item.id}" title="Delete">🗑️</button>
            </div>
          </div>
        `).join('')}
    </div>
  `;

  const profileBtn = document.getElementById('profile-btn');
  const dropdown = document.getElementById('dropdown-menu');
  profileBtn.onclick = (e) => { e.stopPropagation(); dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block'; };
  document.onclick = () => dropdown.style.display = 'none';

  document.getElementById('toggle-theme').onclick = () => { toggleTheme(); renderApp(); };
  document.getElementById('sign-out').onclick = () => signOut(auth).catch(err => showError('Failed to sign out.'));
  document.getElementById('delete-account').onclick = confirmDeleteAccount;
  document.getElementById('view-profile').onclick = showProfile;
  document.getElementById('add-btn').onclick = addSnippet;
  document.getElementById('new-snippet').onkeypress = (e) => { if (e.key === 'Enter') addSnippet(); };

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.onclick = () => copyHandler(btn.dataset.index, btn);
  });
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = () => editSnippet(btn.dataset.id, btn.dataset.index);
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = () => deleteSnippet(btn.dataset.id);
  });
}

// ===== PROFILE =====
async function showProfile() {
  document.getElementById('dropdown-menu').style.display = 'none';
  const user = auth.currentUser;
  let userName = user.email.split('@')[0];
  const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
  if (!userDoc.empty) {
    const data = userDoc.docs[0].data();
    userName = data.name || userName;
  }

  document.getElementById('app').innerHTML = `
    <div class="header">
      <h1>👤 Profile</h1>
      <button class="back-btn" id="back-to-app">← Back</button>
    </div>
    <div class="card">
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:48px;">👤</div>
        <h2>${escapeHtml(userName)}</h2>
        <p style="color:var(--text-secondary);">${user.email}</p>
      </div>
      <div class="form-group">
        <label>Account ID</label>
        <input type="text" value="${user.uid}" readonly class="form-input" />
      </div>
      <div class="form-group">
        <label>Created</label>
        <input type="text" value="${new Date(user.metadata.creationTime).toLocaleString()}" readonly class="form-input" />
      </div>
      <button class="btn outline" id="back-to-app2" style="margin-top:20px;">← Back to App</button>
    </div>
  `;

  document.getElementById('back-to-app').onclick = renderApp;
  document.getElementById('back-to-app2').onclick = renderApp;
}

// ===== SNIPPET FUNCTIONS =====
async function addSnippet() {
  const input = document.getElementById('new-snippet');
  const value = input.value.trim();
  if (!value) return;
  try {
    await addDoc(collection(db, 'snippets'), {
      text: value,
      userId: currentUser.uid,
      createdAt: new Date().toISOString()
    });
    input.value = '';
    await loadSnippets();
  } catch (err) {
    showError('Failed to save snippet.');
  }
}

function editSnippet(id, index) {
  const currentText = snippets[index].text;
  const newText = prompt('Edit your snippet:', currentText);
  if (newText === null || newText.trim() === '') return;
  updateDoc(doc(db, 'snippets', id), { text: newText.trim() })
    .then(() => loadSnippets())
    .catch(err => showError('Failed to update snippet.'));
}

function deleteSnippet(id) {
  if (!confirm('Delete this snippet permanently?')) return;
  deleteDoc(doc(db, 'snippets', id))
    .then(() => loadSnippets())
    .catch(err => showError('Failed to delete snippet.'));
}

// ✅ FIXED: Copy button shows "Copy" → "Copied!" → back to "Copy"
async function copyHandler(index, button) {
  try {
    await navigator.clipboard.writeText(snippets[index].text);
    
    // Save original text ("Copy")
    const originalText = button.textContent;
    
    // Show feedback
    button.textContent = 'Copied!';
    button.classList.add('copied');
    
    // Restore to "Copy" after 1.5 seconds
    setTimeout(() => {
      button.textContent = originalText; // Always "Copy"
      button.classList.remove('copied');
    }, 1500);
    
  } catch (err) {
    showError('Clipboard access denied.');
  }
}

// ===== ACCOUNT MANAGEMENT =====
function confirmDeleteAccount() {
  if (!confirm('⚠️ This will delete your account and ALL snippets permanently. Continue?')) return;
  deleteUser(auth.currentUser).then(async () => {
    const q = query(collection(db, 'snippets'), where('userId', '==', currentUser.uid));
    const snap = await getDocs(q);
    const promises = [];
    snap.forEach(doc => promises.push(deleteDoc(doc.ref)));
    await Promise.all(promises);
    renderLogin();
  }).catch(err => showError('Failed to delete account.'));
}

// ===== UTILITIES =====
async function loadSnippets() {
  try {
    const q = query(collection(db, 'snippets'), where('userId', '==', currentUser.uid));
    const snap = await getDocs(q);
    snippets = [];
    snap.forEach(doc => snippets.push({ id: doc.id, ...doc.data() }));
    snippets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    renderApp();
  } catch (err) {
    showError('Failed to load snippets.');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showError(message, id = 'login-error') {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 4000);
  }
}

function getFriendlyAuthError(code) {
  switch (code) {
    case 'auth/invalid-email': return 'Invalid email format.';
    case 'auth/user-not-found': return 'No account found with this email. Please create an account.';
    case 'auth/wrong-password': return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use': return 'Email already registered. Try signing in instead.';
    case 'auth/weak-password': return 'Password too weak. Use at least 8 characters.';
    default: return 'Something went wrong. Please try again.';
  }
}

// ===== INIT =====
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loadSnippets();
  } else {
    renderLogin();
  }
});