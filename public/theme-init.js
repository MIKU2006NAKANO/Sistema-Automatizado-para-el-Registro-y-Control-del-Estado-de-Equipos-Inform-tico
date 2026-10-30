// Apply the existing preference before rendering, compatible with script-src 'self'.
try {
 const saved = localStorage.getItem('techcontrol-theme');
 document.documentElement.dataset.theme = saved === 'dark' || saved === 'light'
  ? saved : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
} catch {
 document.documentElement.dataset.theme = 'light';
}
