import { isLoggedIn, removeToken, isAdmin } from "../utils/auth";
import chatHtml from "./templates/ChatPage.html?raw";

export const renderChatPage = () => {
  return chatHtml;
};

export const setupChatPage = (navigate: (path: string) => void) => {
  const adminNav = document.getElementById('nav-admin');
  if (adminNav && isAdmin()) {
    adminNav.classList.remove('hidden');
    adminNav.addEventListener('click', () => navigate('/admin'));
  }

  const authContainer = document.getElementById("auth-buttons-container");
  if (authContainer) {
    if (isLoggedIn()) {
        authContainer.innerHTML = `
            <button id="btn-logout-nav" class="px-6 py-2 rounded-full border border-gray-300 dark:border-gray-600 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 text-red-600 dark:text-red-400 transition">
                Logout
            </button>`;
        document.getElementById('btn-logout-nav')?.addEventListener('click', () => {
            removeToken();
            navigate('/'); 
        });
    } else {
        authContainer.innerHTML = `
            <div class="flex gap-4">
                <button id="btn-signup-nav" class="px-6 py-2 rounded-full border border-gray-300 dark:border-gray-600 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 text-black dark:text-white transition">Sign Up</button>
                <button id="btn-login-nav" class="px-6 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition">Login</button>
            </div>`;
        document.getElementById('btn-signup-nav')?.addEventListener('click', () => navigate('/register'));
        document.getElementById('btn-login-nav')?.addEventListener('click', () => navigate('/login'));
    }
  }

  document.getElementById('nav-home')?.addEventListener('click', () => navigate('/'));
  document.getElementById('sidebar-back')?.addEventListener('click', () => navigate('/'));

  const choiceButtons = document.querySelectorAll('.choice-btn');
  choiceButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      console.log("User selected:", target.innerText);
    });
  });
};