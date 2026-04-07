export function showToast(message, icon = '✅') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icon}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('exit');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function createToastContainer() {
  const div = document.createElement('div');
  div.id = 'toast-container';
  div.className = 'toast-container';
  document.body.appendChild(div);
  return div;
}

export function getSnippetType(text) {
  if (text.startsWith('http://') || text.startsWith('https://')) return 'link';
  if (text.includes('{') || text.includes('}') || text.includes('=>') || text.includes('const ') || text.includes('function')) return 'code';
  return 'text';
}

export function escapeHtml(t) { 
  if (t == null) return '';
  return String(t)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function showError(m, i) { 
  const e = document.getElementById(i); 
  if (e) { 
    e.textContent = m; 
    e.style.display = 'block'; 
    setTimeout(() => e.style.display = 'none', 4000); 
  } 
}

export function getFriendlyAuthError(c) { 
  return c.replace('auth/', '').replace(/-/g, ' '); 
}

export function showJokeModal() {
  const upiId = 'abhiramkodicherla-1@oksbi';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=${upiId}%26pn=Abhiram%26cu=INR`;
  
  const jokes = [
    "Why do programmers prefer dark mode? Because light attracts bugs. 🪲",
    "How many developers does it take to change a lightbulb? None, that's a hardware problem. 💡",
    "A SQL query walks into a bar, walks up to two tables, and asks... 'Can I join you?' 🍺",
    "Why was the cell phone wearing glasses? Because it lost its contacts. 📱",
    "An optimist says: 'The glass is half full.' A programmer says: 'The glass is twice as large as it needs to be.' 🥃",
    "I'd tell you a joke about UDP, but you might not get it. 📡",
    "There are only 10 types of people in the world: those who understand binary, and those who don't. 0️⃣1️⃣"
  ];

  const getJoke = () => jokes[Math.floor(Math.random() * jokes.length)];

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.zIndex = '10001';
  modal.innerHTML = `
    <div class="modal-content" style="text-align:center; animation: fadeIn 0.3s ease-out; max-width: 400px;">
      <h2 style="margin-bottom:12px;">Quick Humor 🎭</h2>
      <div id="joke-text" style="font-size: 1.05rem; line-height: 1.5; color: var(--text); margin-bottom: 24px; min-height: 60px; display: flex; align-items: center; justify-content: center; font-style: italic;">
        "${getJoke()}"
      </div>
      
      <button id="next-joke-btn" class="btn btn-outline" style="width:100%; height:44px; margin-bottom:32px; font-size:0.85rem; border-color:var(--primary); color:var(--primary);">
        Next Joke! 🔄
      </button>

      <div style="padding:20px; background:white; border-radius:24px; border:1px solid var(--glass-border); display:flex; flex-direction:column; align-items:center; gap:12px;">
        <div style="font-weight:800; font-size:0.75rem; color:#1e293b; letter-spacing:1px;">COFFEE FUND (UPI) ☕</div>
        <img src="${qrUrl}" style="width:160px; height:160px; border-radius:12px;" alt="UPI QR Code" />
        <p style="font-size:0.75rem; color:#64748b; font-weight:600; line-height:1.4;">"Buying me a coffee prevents 99% of future bugs."</p>
        <button id="copy-upi-btn" class="btn btn-link" style="font-size:0.75rem; color:var(--primary); padding:0;">Copy UPI ID instead</button>
      </div>
      
      <button id="close-joke-modal" class="btn-link" style="margin-top:20px; opacity:0.6; text-decoration:none;">Back to Work</button>
    </div>
  `;
  document.body.appendChild(modal);
  
  document.getElementById('next-joke-btn').onclick = () => {
    const textEl = document.getElementById('joke-text');
    textEl.style.opacity = '0';
    setTimeout(() => {
      textEl.textContent = `"${getJoke()}"`;
      textEl.style.opacity = '1';
    }, 200);
  };

  document.getElementById('copy-upi-btn').onclick = () => {
    navigator.clipboard.writeText(upiId);
    showToast('UPI ID Copied! 📋');
  };
  
  document.getElementById('close-joke-modal').onclick = () => modal.remove();
  modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
}