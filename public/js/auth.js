/**
 * This file is SOLELY responsible for all the logic
 * of the login modal: showing, hiding, and processing the submission.
 */

// --- DOM Elements ---
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const showLoginBtn = document.getElementById('show-login-btn'); // The button from the initial message

// --- Functions to Show/Hide the Modal ---

function showLoginModal() {
  if (loginModal) {
    loginModal.classList.remove('hidden');
  }
}

function hideLoginModal() {
  if (loginModal) {
    loginModal.classList.add('hidden');
  }
  if (loginError) {
    loginError.classList.add('hidden');
    loginError.textContent = '';
  }
  if (loginForm) {
    loginForm.reset();
  }
}

// --- Login API Request ---

async function handleLogin(email, password) {
  try {
    const response = await fetch('/api/v1/client/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error logging in.');
    }

    if (data.token) {
      localStorage.setItem('authToken', data.token);
      return { success: true };
    } else {
      throw new Error('Authentication token not received.');
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// --- Event Listener Connections ---

// 1. Connect the button from the initial message to show the modal.
if (showLoginBtn) {
  showLoginBtn.addEventListener('click', showLoginModal);
}

// 2. Connect the SUBMIT event of the form INSIDE the modal.
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the page from reloading
    const button = loginForm.querySelector('button');
    button.disabled = true;
    button.textContent = 'Logging in...';

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const result = await handleLogin(email, password);

    button.disabled = false;
    button.textContent = 'Login';

    if (result.success) {
      hideLoginModal();
      // Key! Notify the rest of the application that the login was successful.
      document.dispatchEvent(new CustomEvent('loginSuccess'));
    } else {
      loginError.textContent = result.message;
      loginError.classList.remove('hidden');
    }
  });
}
