import './style.css'
import { renderRegisterPage, setupRegisterPage } from './pages/RegisterPage';
import { renderLoginPage, setupLoginPage } from './pages/LoginPage';
import { renderChatPage, setupChatPage } from './pages/ChatPage';
import { renderHomePage, setupHomePage } from './pages/HomePage';
import { renderAdminPage, setupAdminPage } from './pages/AdminPage';
import { initTheme } from './utils/theme';
import { isAdmin, isLoggedIn } from './utils/auth';

const app = document.querySelector<HTMLDivElement>('#app')!;

// Initialize theme
initTheme(); 

const navigate = (path: string) => {
  window.history.pushState({}, "", path);
  app.innerHTML = '';

  // Protected Routes Guard
  if ((path === '/chat' || path === '/admin') && !isLoggedIn()) {
    // Redirect to login if token is missing or expired
    navigate('/login');
    return;
  }

  if (path === '/' || path === '/home') {
    app.innerHTML = renderHomePage();
    setupHomePage(navigate);
  }
  else if (path === '/register') {
    app.innerHTML = renderRegisterPage();
    setupRegisterPage(navigate);
  } 
  else if (path === '/login') {
    app.innerHTML = renderLoginPage();
    setupLoginPage(navigate);
  }
  else if (path === '/chat') {
    app.innerHTML = renderChatPage();
    setupChatPage(navigate);
  }
  else if (path === '/admin') {
    if(!isAdmin()) {
        navigate('/');
        return;
    }
    app.innerHTML = renderAdminPage();
    setupAdminPage(navigate);
  }
  else {
    navigate('/');
  }
};

window.onpopstate = () => {
  navigate(window.location.pathname);
};

// Listen for forced logout events (triggered by authFetch on 401)
window.addEventListener('auth-logout', () => {
  navigate('/login');
});

const initialPath = window.location.pathname === '/' ? '/' : window.location.pathname;
navigate(initialPath);