export const palettes = [
  { name: 'Indigo', primary: '#6366f1', secondary: '#a855f7' },
  { name: 'Emerald', primary: '#10b981', secondary: '#3b82f6' },
  { name: 'Rose', primary: '#f43f5e', secondary: '#fb923c' },
  { name: 'Amber', primary: '#f59e0b', secondary: '#d946ef' },
  { name: 'Cyan', primary: '#06b6d4', secondary: '#6366f1' },
  { name: 'Slate', primary: '#475569', secondary: '#94a3b8' }
];

export let activePalette = JSON.parse(localStorage.getItem('quickcopy_palette')) || palettes[0];

export function applyPalette(palette) {
  activePalette = palette;
  localStorage.setItem('quickcopy_palette', JSON.stringify(palette));
  document.documentElement.style.setProperty('--primary', palette.primary);
  document.documentElement.style.setProperty('--primary-glow', palette.primary + '80');
  document.documentElement.style.setProperty('--secondary', palette.secondary);
}

export function initTheme() {
  applyPalette(activePalette);
  if (localStorage.getItem('quickcopy_dark_mode') === 'true') {
    document.body.classList.add('dark-mode');
  }
}

export function toggleTheme() {
  const isDarkMode = !document.body.classList.contains('dark-mode');
  document.body.classList.toggle('dark-mode', isDarkMode);
  localStorage.setItem('quickcopy_dark_mode', isDarkMode);
  return isDarkMode;
}