import { setToken } from "../utils/auth";
import loginHtml from "./templates/LoginPage.html?raw";

export const renderLoginPage = () => {
  return loginHtml;
};

export const setupLoginPage = (navigate: (path: string) => void) => {
  const form = document.getElementById('login-form') as HTMLFormElement;
  const errorMsg = document.getElementById('login-error-msg')!;
  const submitBtn = document.getElementById('login-submit-btn') as HTMLButtonElement;
  const registerLink = document.getElementById('link-register')!;

  registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('/register'); 
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Login failed');

      if (result.token) {
        setToken(result.token);
        navigate('/chat');
      } else {
        throw new Error("No token received from server");
      }

    } catch (err: any) {
      errorMsg.textContent = err.message;
      errorMsg.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Log In";
    }
  });
};