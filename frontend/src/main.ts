import './style.css'
import { renderRegisterPage, setupRegisterPage } from './pages/RegisterPage';
import { renderLoginPage, setupLoginPage } from './pages/LoginPage';
import { renderChatPage, setupChatPage } from './pages/ChatPage';
import { renderHomePage, setupHomePage } from './pages/HomePage';
import { renderAdminPage, setupAdminPage } from './pages/AdminPage';
import { renderProfilePage, setupProfilePage } from './pages/ProfilePage';
import { initTheme } from './utils/theme';
import { isAdmin, isLoggedIn } from './utils/auth';

const app = document.querySelector<HTMLDivElement>('#app')!;

// Initialize theme
initTheme(); 

const navigate = (path: string) => {
  // Push state so URL updates with query params
  window.history.pushState({}, "", path);
  app.innerHTML = '';

  // Extract pure pathname for routing logic (ignoring query strings like ?sessionId=1)
  const tempUrl = new URL(path, window.location.origin);
  const pathname = tempUrl.pathname;

  // Protected routes
  if ((pathname === '/chat' || pathname === '/admin' || pathname === '/profile') && !isLoggedIn()) {
    // Redirect to login if token is missing or expired
    navigate('/login');
    return;
  }

  if (pathname === '/' || pathname === '/home') {
    app.innerHTML = renderHomePage();
    setupHomePage(navigate);
  }
  else if (pathname === '/register') {
    app.innerHTML = renderRegisterPage();
    setupRegisterPage(navigate);
  } 
  else if (pathname === '/login') {
    app.innerHTML = renderLoginPage();
    setupLoginPage(navigate);
  }
  else if (pathname === '/chat') {
    app.innerHTML = renderChatPage();
    setupChatPage(navigate);
  }
  else if (pathname === '/profile') {
    app.innerHTML = renderProfilePage();
    setupProfilePage(navigate);
  }
  else if (pathname === '/admin') {
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
  // Pass the full path including search/query string
  navigate(window.location.pathname + window.location.search);
};

// Listen for forced logout events (triggered by authFetch on 401)
window.addEventListener('auth-logout', () => {
  navigate('/login');
});

// Handle initial load with query strings
const initialPath = window.location.pathname === '/' ? '/' : (window.location.pathname + window.location.search);
navigate(initialPath);