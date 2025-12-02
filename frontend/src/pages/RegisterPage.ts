import { setToken } from "../utils/auth";
import { getThemeToggleSVG, attachThemeToggle } from "../utils/theme";
import registerHtml from "./templates/RegisterPage.html?raw";

export const renderRegisterPage = () => {
    return registerHtml;
};

export const setupRegisterPage = (navigate: (path: string) => void) => {
  // Inject Theme Toggle
  const themeContainer = document.getElementById("theme-toggle-container");
  if(themeContainer) themeContainer.innerHTML = getThemeToggleSVG();
  attachThemeToggle();

  // Select Elements
  const form = document.getElementById('register-form') as HTMLFormElement;
  const errorMsg = document.getElementById('error-msg')!;
  const successMsg = document.getElementById('success-msg')!;
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
  const loginLink = document.getElementById('link-login')!;

  // Navigation logic
  loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('/login'); 
  });

  // Form Submission Logic
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Reset messages
    errorMsg.classList.add('hidden');
    successMsg.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating Account...";

    const formData = new FormData(form);
    const identifier = formData.get('identifier') as string;
    const password = formData.get('password') as string;
    const isEmail = identifier.includes('@');

    const payload = {
        username: isEmail ? undefined : identifier,
        email: isEmail ? identifier : undefined,
        password: password
    };

    try {
      const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      // Login automatically if token provided
      if (result.token) {
        setToken(result.token); // Save token
        successMsg.textContent = "Account created! Redirecting to chat...";
        successMsg.classList.remove('hidden');
        form.reset();
        
        setTimeout(() => {
          navigate('/chat');
        }, 1500);
      } else {
        successMsg.textContent = "Account created! Redirecting to login...";
        successMsg.classList.remove('hidden');
        setTimeout(() => navigate('/login'), 1500);
      }

    } catch (err: any) {
      errorMsg.textContent = err.message;
      errorMsg.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign Up";
    }
  });
};