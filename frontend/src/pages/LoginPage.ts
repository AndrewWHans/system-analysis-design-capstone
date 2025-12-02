import { setToken } from "../utils/auth.ts";
import { getThemeToggleSVG, attachThemeToggle } from "../utils/theme.ts";

export const renderLoginPage = () => `
  <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 font-sans relative transition-colors duration-300">
    
    <div class="absolute top-4 right-4">
        ${getThemeToggleSVG()}
    </div>

    <div class="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md transition-colors duration-300">
      
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-2">Log in to continue your training</p>
      </div>

      <form id="login-form" class="space-y-6">
        <!-- Error Message Container -->
        <div id="login-error-msg" class="hidden bg-red-100 text-red-700 p-3 rounded text-sm"></div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username or Email</label>
          <input type="text" id="username" name="username" required 
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            placeholder="DrSmith or you@example.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <input type="password" id="password" name="password" required 
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            placeholder="••••••••"
          />
        </div>

        <button type="submit" id="login-submit-btn" 
          class="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition transform active:scale-95">
          Log In
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account? 
        <a href="#" id="link-register" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">Sign Up</a>
      </div>
    </div>
  </div>
`;

export const setupLoginPage = (navigate: (path: string) => void) => {
  const form = document.getElementById('login-form') as HTMLFormElement;
  const errorMsg = document.getElementById('login-error-msg')!;
  const submitBtn = document.getElementById('login-submit-btn') as HTMLButtonElement;
  const registerLink = document.getElementById('link-register')!;

  attachThemeToggle();

  // Handle Navigation to Register
  registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('/register'); 
  });

  // Handle Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Reset state
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

      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      // Success: Save token
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