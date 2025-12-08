export const setToken = (token: string) => {
  localStorage.setItem('therabot_token', token);
};

export const getToken = () => {
  return localStorage.getItem('therabot_token');
};

export const removeToken = () => {
  localStorage.removeItem('therabot_token');
};

export const getPayload = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const isTokenExpired = () => {
  const payload = getPayload();
  if (!payload || !payload.exp) return true;
  // JWT exp is in seconds, Date.now() is in milliseconds
  return (payload.exp * 1000) < Date.now();
};

export const isLoggedIn = () => {
  const token = getToken();
  if (!token) return false;
  
  if (isTokenExpired()) {
    removeToken();
    return false;
  }
  return true;
};

export const isAdmin = () => {
  const payload = getPayload();
  return isLoggedIn() && payload && payload.isAdmin === true;
};

// Wrapper for fetch that handles Authentication and Expiration automatically
export const authFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = getToken();
  const headers = new Headers(init?.headers || {});

  // Attach token if it exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });

  // If session is expired (401), force logout
  if (response.status === 401) {
    removeToken();
    window.dispatchEvent(new Event('auth-logout')); // Notify main.ts to redirect
    throw new Error("Session expired. Please log in again.");
  }

  return response;
};