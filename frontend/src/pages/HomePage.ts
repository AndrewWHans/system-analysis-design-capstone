import { isLoggedIn, removeToken } from "../utils/auth";
import { getThemeToggleSVG, attachThemeToggle } from "../utils/theme";
import homeHtml from "./templates/HomePage.html?raw";

export const renderHomePage = () => {
  return homeHtml;
};

export const setupHomePage = (navigate: (path: string) => void) => {
  // Inject theme toggle into placeholder
  const themeContainer = document.getElementById("theme-toggle-container");
  if (themeContainer) themeContainer.innerHTML = getThemeToggleSVG();
  attachThemeToggle();

  // Inject dynamic nav nuttons based on auth state
  const navContainer = document.getElementById("nav-buttons-container");
  if (navContainer) {
    if (isLoggedIn()) {
      navContainer.innerHTML = `
        <button id="nav-chat" class="text-gray-600 dark:text-gray-300 font-medium hover:text-black dark:hover:text-white transition">Chat</button>
        <button id="nav-logout" class="bg-black dark:bg-white text-white dark:text-black px-5 py-2 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition">Logout</button>
      `;
    } else {
      navContainer.innerHTML = `
        <button id="nav-login" class="text-gray-600 dark:text-gray-300 font-medium hover:text-black dark:hover:text-white transition">Login</button>
        <button id="nav-register" class="bg-black dark:bg-white text-white dark:text-black px-5 py-2 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition">Sign Up</button>
      `;
    }
  }

  // Helper to attach navigation listeners safely
  const handleNav = (id: string, path: string) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => navigate(path));
  };

  // Attach listeners to potential buttons
  handleNav('nav-register', '/register');
  handleNav('nav-login', '/login');
  handleNav('nav-chat', '/chat');
  handleNav('hero-chat', '/chat');

  // Special Logout Logic
  const logoutBtn = document.getElementById('nav-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      removeToken();
      navigate('/'); // Refresh home to update UI state
    });
  }
}