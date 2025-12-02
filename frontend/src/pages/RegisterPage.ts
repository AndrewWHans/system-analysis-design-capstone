import { setToken } from "../utils/auth.ts";
import { getThemeToggleSVG, attachThemeToggle } from "../utils/theme.ts";

// Render the HTML
export const renderRegisterPage = () => `
  <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 font-sans relative transition-colors duration-300">
    
    <div class="absolute top-4 right-4">
        ${getThemeToggleSVG()}
    </div>

    <div class="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md transition-colors duration-300">
      
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-2">Join Therabot to start training</p>
      </div>

      <form id="register-form" class="space-y-6">
        <!-- Error Message Container -->
        <div id="error-msg" class="hidden bg-red-100 text-red-700 p-3 rounded text-sm"></div>
        <div id="success-msg" class="hidden bg-green-100 text-green-700 p-3 rounded text-sm"></div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username or Email</label>
          <input type="text" id="identifier" name="identifier" required 
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            placeholder="DrSmith or you@example.com"
          />
          <p class="text-xs text-gray-400 mt-1">You can use either your username or email address.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <input type="password" id="password" name="password" required 
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            placeholder="••••••••"
          />
        </div>

        <button type="submit" id="submit-btn" 
          class="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition transform active:scale-95">
          Sign Up
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account? 
        <a href="#" id="link-login" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">Log in</a>
      </div>
    </div>
  </div>
`;

// Attach Logic
export const setupRegisterPage = (navigate: (path: string) => void) => {
  const form = document.getElementById('register-form') as HTMLFormElement;
  const errorMsg = document.getElementById('error-msg')!;
  const successMsg = document.getElementById('success-msg')!;
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
  const loginLink = document.getElementById('link-login')!;

  attachThemeToggle();

  // Handle Navigation to Login
  loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('/login'); 
  });

  // Handle Submission
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

      // Login automatically
      if (result.token) {
        setToken(result.token); // Save token
        successMsg.textContent = "Account created! Redirecting to chat...";
        successMsg.classList.remove('hidden');
        form.reset();
        
        setTimeout(() => {
          navigate('/chat'); // Redirect to Chat page
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