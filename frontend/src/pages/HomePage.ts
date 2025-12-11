import { isLoggedIn, removeToken } from "../utils/auth";
import homeHtml from "./templates/HomePage.html?raw";

export const renderHomePage = () => {
  return homeHtml;
};

export const setupHomePage = (navigate: (path: string) => void) => {
  // Inject dynamic nav buttons based on auth state
  const navContainer = document.getElementById("nav-buttons-container");
  if (navContainer) {
    if (isLoggedIn()) {
      navContainer.innerHTML = `
        <button id="nav-chat" class="text-gray-600 dark:text-gray-300 font-medium hover:text-black dark:hover:text-white cursor-pointer transition">Chat</button>
        <button id="nav-profile" class="text-gray-600 dark:text-gray-300 font-medium hover:text-black dark:hover:text-white cursor-pointer transition">Profile</button>
        <button id="nav-logout" class="bg-black dark:bg-white text-white dark:text-black px-5 py-2 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-200 cursor-pointer transition">Logout</button>
      `;
    } else {
      navContainer.innerHTML = `
        <button id="nav-login" class="text-gray-600 dark:text-gray-300 font-medium hover:text-black dark:hover:text-white transition">Login</button>
        <button id="nav-register" class="bg-black dark:bg-white text-white dark:text-black px-5 py-2 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-200 cursor-pointer transition">Sign Up</button>
      `;
    }
  }

  // Helpers
  const handleNav = (id: string, path: string) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => navigate(path));
  };

  handleNav('nav-register', '/register');
  handleNav('nav-login', '/login');
  handleNav('nav-chat', '/chat');
  handleNav('nav-profile', '/profile');
  handleNav('hero-chat', '/chat');

  const logoutBtn = document.getElementById('nav-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      removeToken();
      navigate('/');
    });
  }
}