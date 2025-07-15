// public/js/checkout.js (CORREGIDO Y FUNCIONAL)

/**
 * Lógica para la página de checkout.
 * Implementa el flujo de dos caminos:
 * 1. Tarjeta guardada -> PaymentIntent directo.
 * 2. Tarjeta nueva -> SetupIntent, luego PaymentIntent.
 */

document.addEventListener('DOMContentLoaded', () => {
  const stripePublicKey = document.body.dataset.stripeKey;
  initializeCheckout(stripePublicKey);
});

let stripe, elements;

// --- DOM Elements ---
const loginPrompt = document.getElementById('login-prompt');
const checkoutContent = document.getElementById('checkout-content');
const payBtn = document.getElementById('pay-btn');
const newCardContainer = document.getElementById('new-card-container');
const spinner = document.getElementById('spinner');
const errorMessage = document.getElementById('error-message');

function initializeCheckout(publicKey) {
  if (!publicKey) {
    showError('Error: Clave pública de Stripe no configurada.');
    return;
  }
  stripe = Stripe(publicKey);
  addEventListeners(); // Moved before checkLoginStatus
  checkLoginStatus();
}

function addEventListeners() {
  // El listener de 'loginSuccess' sigue siendo útil si el modal está en la misma página
  document.addEventListener('loginSuccess', checkLoginStatus);
  payBtn.addEventListener('click', handlePayment);

  document.querySelectorAll('input[name="payment-method"]').forEach((radio) => {
    radio.addEventListener('change', handlePaymentMethodChange);
  });
}

function handlePaymentMethodChange(event) {
  const isNewCard = event.target.value === 'new';
  newCardContainer.classList.toggle('hidden', !isNewCard);

  if (isNewCard && !elements) {
    // Si se selecciona "nueva tarjeta" y el formulario no existe, lo creamos.
    // Esto funciona tanto al hacer clic como en la carga inicial.
    setupNewCardForm();
  }
}

function checkLoginStatus() {
  if (localStorage.getItem('authToken')) {
    showCheckoutContent();
  } else {
    loginPrompt.classList.remove('hidden');
    checkoutContent.classList.add('hidden');
  }
}

// ===================================================================
// =================== AQUÍ ESTÁ EL CAMBIO PRINCIPAL ===================
// ===================================================================
function showCheckoutContent() {
  loginPrompt.classList.add('hidden');
  checkoutContent.classList.remove('hidden');

  // ANTES: Usabas un dispatchEvent() que era poco fiable.

  // AHORA: Hacemos una comprobación directa y explícita del estado inicial.
  // Esto es mucho más robusto.
  const initialSelection = document.querySelector(
    'input[name="payment-method"]:checked'
  );
  if (initialSelection) {
    // Simulamos el evento 'change' llamando directamente a su manejador
    // con un objeto que imita la estructura de un evento.
    handlePaymentMethodChange({ target: initialSelection });
  }
}

async function handlePayment() {
  const selectedPM = document.querySelector(
    'input[name="payment-method"]:checked'
  ).value;

  if (selectedPM === 'new') {
    await payWithNewCard();
  } else {
    await payWithSavedCard(selectedPM);
  }
}

// --- Flujo 1: Pagar con Tarjeta Guardada ---
async function payWithSavedCard(paymentMethodId) {
  setLoading(true);
  const token = localStorage.getItem('authToken');

  try {
    const response = await fetch(
      '/api/v1/client/payments/stripe/create-payment-intent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currency: 'mxn',
          paymentMethodId: paymentMethodId,
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    handleBackendPaymentResponse(data);
  } catch (error) {
    showError(error.message);
    setLoading(false);
  }
}

// --- Flujo 2: Pagar con Tarjeta Nueva ---
async function setupNewCardForm() {
  setLoading(true);
  const token = localStorage.getItem('authToken');
  try {
    // 1. Pedimos al backend un "client secret" para el SetupIntent
    const response = await fetch(
      '/api/v1/client/payments/stripe/create-setup-intent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    // 2. Usamos el secret para inicializar los Stripe Elements
    elements = stripe.elements({ clientSecret: data.clientSecret });

    // 3. Creamos el componente de pago (que incluye CVV, fecha, etc.)
    const paymentElement = elements.create('payment');

    // 4. ¡LA MAGIA! "Pintamos" el formulario dentro de nuestro div vacío.
    paymentElement.mount('#payment-element');
  } catch (error) {
    showError('No se pudo cargar el formulario de pago: ' + error.message);
  } finally {
    setLoading(false);
  }
}

async function payWithNewCard() {
  if (!elements) {
    showError(
      'El formulario de pago no está listo. Por favor, espera un momento.'
    );
    return;
  }
  setLoading(true);

  // Confirmamos el setup para tokenizar la tarjeta de forma segura
  const { error: setupError, setupIntent } = await stripe.confirmSetup({
    elements,
    redirect: 'if_required',
    confirmParams: {
      return_url: window.location.href.split('?')[0], // URL sin parámetros
    },
  });

  if (setupError) {
    showError(setupError.message);
    setLoading(false);
    return;
  }

  if (setupIntent.status === 'succeeded') {
    // Éxito. Stripe nos devuelve un ID para el método de pago (`setupIntent.payment_method`)
    // Ahora hacemos el cobro real usando ese ID.
    await payWithSavedCard(setupIntent.payment_method);
  } else {
    showError(
      `El guardado de la tarjeta falló con estado: ${setupIntent.status}`
    );
    setLoading(false);
  }
}

// --- Manejo de Respuestas y Resultados ---
async function handleBackendPaymentResponse({ clientSecret, status, orderId }) {
  if (status === 'succeeded') {
    window.location.href = `/success?order_id=${orderId}`;
  } else if (status === 'requires_action') {
    // Para autenticación 3D Secure (la ventanita del banco)
    await stripe.handleNextAction({ clientSecret }).then(handleStripeResult);
  } else if (status === 'requires_confirmation') {
    const selectedPM = document.querySelector(
      'input[name="payment-method"]:checked'
    ).value;

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: selectedPM,
      }
    );

    if (error) {
      showError(error.message);
      setLoading(false);
    } else if (paymentIntent.status === 'succeeded') {
      window.location.href = `/success?order_id=${
        paymentIntent.metadata?.order_id ?? ''
      }`;
    } else {
      showError(`Pago fallido con estado: ${paymentIntent.status}`);
      setLoading(false);
    }
  } else {
    showError(`Pago fallido con estado: ${status}`);
    setLoading(false);
  }
}

function handleStripeResult({ error, paymentIntent }) {
  if (error) {
    showError(error.message);
    setLoading(false);
  } else if (paymentIntent && paymentIntent.status === 'succeeded') {
    window.location.href = `/success?order_id=${paymentIntent.metadata.order_id}`;
  }
}

// --- Funciones de UI (sin cambios) ---
function setLoading(isLoading) {
  errorMessage.classList.add('hidden');
  spinner.classList.toggle('hidden', !isLoading);
  payBtn.disabled = isLoading;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
}
