import { isLoggedIn, removeToken, isAdmin } from "../utils/auth.ts";
import { getThemeToggleSVG, attachThemeToggle } from "../utils/theme.ts";

const ROBOT_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="11" width="18" height="10" rx="2"></rect>
  <circle cx="12" cy="5" r="2"></circle>
  <path d="M12 7v4"></path>
  <line x1="8" y1="16" x2="8" y2="16"></line>
  <line x1="16" y1="16" x2="16" y2="16"></line>
</svg>
`;

const ROBOT_AVATAR_LARGE = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-24 h-24 text-black dark:text-white">
  <rect x="2" y="10" width="20" height="10" rx="4" fill="currentColor" class="text-white dark:text-gray-800" stroke="none"></rect>
  <rect x="2" y="10" width="20" height="10" rx="4" fill="none"></rect>
  <circle cx="7.5" cy="15" r="2.5"></circle>
  <circle cx="16.5" cy="15" r="2.5"></circle>
  <path d="M10 18h4"></path>
  <path d="M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"></path>
  <rect x="5" y="20" width="14" height="4" rx="1" fill="currentColor" class="text-white dark:text-gray-800" stroke="none"></rect>
  <rect x="5" y="20" width="14" height="4" rx="1" fill="none"></rect>
</svg>
`;

const ARROW_LEFT = `
<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
</svg>
`;

const CHEVRON_DOWN = `<svg class="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;
const CHEVRON_RIGHT = `<svg class="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;

const Sidebar = () => {
  const adminBtn = isAdmin() 
    ? `<div id="nav-admin" class="font-medium text-red-600 dark:text-red-400 cursor-pointer hover:text-red-800 dark:hover:text-red-300 mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">Admin Dashboard</div>` 
    : '';

  return `
  <aside class="w-64 bg-gray-50 dark:bg-gray-900 h-screen border-r border-gray-200 dark:border-gray-800 flex flex-col p-6 hidden md:flex font-sans transition-colors duration-300">
    <div class="flex justify-between items-start mb-10">
      <div class="p-2 border-2 border-black dark:border-white rounded-lg text-black dark:text-white">
        ${ROBOT_ICON}
      </div>
      <button class="hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1" id="sidebar-back">
        ${ARROW_LEFT}
      </button>
    </div>

    <nav class="space-y-4 mb-10">
      <div id="nav-home" class="font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">Home</div>
      <div id="nav-new-chat" class="font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">New Chat</div>
      ${adminBtn}
    </nav>

    <div>
      <h3 class="text-gray-400 font-medium mb-4 text-sm">History</h3>
      <div class="space-y-2">
        <div class="text-black dark:text-white font-semibold cursor-pointer py-1">Brandan</div>
        <div class="flex items-center text-gray-700 dark:text-gray-300 cursor-pointer py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
          <span>Alyssa</span>
          ${CHEVRON_RIGHT}
        </div>
        <div class="group cursor-pointer py-1 text-gray-700 dark:text-gray-300">
          <div class="flex items-center">
            <span>Kaitlyn</span>
            ${CHEVRON_DOWN}
          </div>
          <div class="pl-4 mt-1 text-sm text-black dark:text-gray-400">
            Diagnosed: No
          </div>
        </div>
      </div>
    </div>
  </aside>
`;
};

const ChatHeader = () => {
  const loggedIn = isLoggedIn();

  const buttonsHtml = loggedIn 
    ? `<button id="btn-logout-nav" class="px-6 py-2 rounded-full border border-gray-300 dark:border-gray-600 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 text-red-600 dark:text-red-400 transition">
         Logout
       </button>`
    : `<div class="flex gap-4">
        <button id="btn-signup-nav" class="px-6 py-2 rounded-full border border-gray-300 dark:border-gray-600 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 text-black dark:text-white transition">
          Sign Up
        </button>
        <button id="btn-login-nav" class="px-6 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition">
          Login
        </button>
       </div>`;

  return `
  <header class="h-20 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-8 bg-white dark:bg-gray-900 transition-colors duration-300">
    <h1 class="text-3xl font-medium text-black dark:text-white">Brandan</h1>
    <div class="flex items-center gap-4">
        ${getThemeToggleSVG()}
        ${buttonsHtml}
    </div>
  </header>
  `;
};

const UserMessage = (text: string) => `
  <div class="flex justify-end mb-6">
    <div class="bg-blue-500 text-white p-5 rounded-xl rounded-tr-none max-w-md text-lg leading-relaxed shadow-sm">
      ${text}
    </div>
  </div>
`;

const BotMessage = (text: string, showAvatar: boolean = false) => `
  <div class="flex items-end gap-4 mb-6">
    ${showAvatar ? `<div class="mb-2 shrink-0">${ROBOT_AVATAR_LARGE}</div>` : '<div class="w-24 shrink-0"></div>'}
    <div class="bg-gray-200 dark:bg-gray-800 text-black dark:text-gray-100 p-5 rounded-xl rounded-tl-none max-w-md text-lg leading-relaxed shadow-sm transition-colors duration-300">
      ${text}
    </div>
  </div>
`;

const ChoiceButton = (text: string, colorClass: string) => `
  <button class="choice-btn ${colorClass} text-white p-6 rounded-2xl text-lg text-left shadow-md hover:opacity-90 transition transform hover:-translate-y-1 h-full flex items-center justify-center text-center">
    ${text}
  </button>
`;

export const renderChatPage = () => `
  <div class="flex h-screen bg-white dark:bg-gray-950 font-sans overflow-hidden transition-colors duration-300">
    ${Sidebar()}
    
    <main class="flex-1 flex flex-col relative">
      ${ChatHeader()}

      <!-- Chat Container -->
      <div id="chat-container" class="flex-1 overflow-y-auto p-8 pb-32 scroll-smooth">
        <div class="max-w-5xl mx-auto pt-8">
          
          ${UserMessage("Nec metus bibendum egestas iaculis massa nisl malesuada.Nec metus bibendum?")}
          
          ${BotMessage("Himenaeos orci varius natoque penatibus et magnis dis.", true)}
          
          ${UserMessage("Montes nascetur ridiculus mus donec rhoncus eros lobortis?")}

          <!-- Choice Area -->
          <div class="grid grid-cols-2 gap-6 mt-12 ml-28"> 
             ${ChoiceButton(
               "Quisque faucibus ex sapien vitae pellentesque sem placerat. Vitae pellentesque sem placerat in id cursus mi?", 
               "bg-[#5B3E86] dark:bg-[#6D4C9D]"
             )}

             ${ChoiceButton(
               "Lorem ipsum dolor sit amet consectetur adipiscing elit. Dolor sit amet consectetur adipiscing elit quisque faucibus?", 
               "bg-[#FF9F45] !text-black font-medium"
             )}
          </div>

        </div>
      </div>
    </main>
  </div>
`;

export const setupChatPage = (navigate: (path: string) => void) => {
  attachThemeToggle();

  // Sidebar Navigation
  document.getElementById('nav-home')?.addEventListener('click', () => navigate('/'));
  document.getElementById('sidebar-back')?.addEventListener('click', () => navigate('/'));
  
  // Admin Nav Listener
  const adminNav = document.getElementById('nav-admin');
  if(adminNav) adminNav.addEventListener('click', () => navigate('/admin'));

  // Auth Buttons
  const signupBtn = document.getElementById('btn-signup-nav');
  const loginBtn = document.getElementById('btn-login-nav');
  const logoutBtn = document.getElementById('btn-logout-nav');

  if (signupBtn) signupBtn.addEventListener('click', () => navigate('/register'));
  if (loginBtn) loginBtn.addEventListener('click', () => navigate('/login'));
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      removeToken();
      navigate('/'); 
    });
  }

  const choiceButtons = document.querySelectorAll('.choice-btn');
  choiceButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      console.log("User selected:", target.innerText);
    });
  });
};