export const initTheme = () => {
  const userTheme = localStorage.getItem('theme');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (userTheme === 'dark' || (!userTheme && systemTheme)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const toggleTheme = () => {
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
};

export const THEME_TOGGLE_BTN_ID = 'theme-toggle-btn';

// Uses Tailwind classes to swap icons automatically based on the 'dark' class on <html>
export const getThemeToggleSVG = () => `
<div id="${THEME_TOGGLE_BTN_ID}" class="cursor-pointer p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
  <!-- Sun Icon (Show in Dark Mode) -->
  <svg class="w-6 h-6 text-yellow-400 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
  <!-- Moon Icon (Show in Light Mode) -->
  <svg class="w-6 h-6 text-gray-600 block dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
</div>
`;

export const attachThemeToggle = () => {
  const btn = document.getElementById(THEME_TOGGLE_BTN_ID);
  if (btn) {
    btn.addEventListener('click', () => {
        toggleTheme();
    });
  }
};