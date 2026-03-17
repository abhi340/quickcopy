export function showToast(message, icon = '✅') {
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