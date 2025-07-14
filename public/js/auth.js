/**
 * Este archivo es el ÚNICO responsable de toda la lógica
 * del modal de login: mostrar, ocultar y procesar el envío.
 */

// --- DOM Elements ---
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const showLoginBtn = document.getElementById('show-login-btn'); // El botón del mensaje inicial

// --- Funciones para Mostrar/Ocular el Modal ---

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

// --- Petición a la API de Login ---

async function handleLogin(email, password) {
  try {
    const response = await fetch('/api/v1/client/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al iniciar sesión.');
    }

    if (data.token) {
      localStorage.setItem('authToken', data.token);
      return { success: true };
    } else {
      throw new Error('No se recibió un token de autenticación.');
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// --- Conexión de Event Listeners ---

// 1. Conectar el botón del mensaje inicial para que muestre el modal.
if (showLoginBtn) {
  showLoginBtn.addEventListener('click', showLoginModal);
}

// 2. Conectar el evento SUBMIT del formulario DENTRO del modal.
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevenir que la página se recargue
    const button = loginForm.querySelector('button');
    button.disabled = true;
    button.textContent = 'Ingresando...';

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const result = await handleLogin(email, password);

    button.disabled = false;
    button.textContent = 'Ingresar';

    if (result.success) {
      hideLoginModal();
      // ¡Clave! Notifica al resto de la aplicación que el login fue exitoso.
      document.dispatchEvent(new CustomEvent('loginSuccess'));
    } else {
      loginError.textContent = result.message;
      loginError.classList.remove('hidden');
    }
  });
}
