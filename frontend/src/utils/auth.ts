export const setToken = (token: string) => {
  localStorage.setItem('therabot_token', token);
};

export const getToken = () => {
  return localStorage.getItem('therabot_token');
};

export const removeToken = () => {
  localStorage.removeItem('therabot_token');
};

export const isLoggedIn = () => {
  return !!getToken();
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

export const isAdmin = () => {
  const payload = getPayload();
  return payload && payload.isAdmin === true;
};