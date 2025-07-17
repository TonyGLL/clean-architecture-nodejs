document.addEventListener('DOMContentLoaded', () => {
  const stripePublicKey = document.body.dataset.stripeKey;
  initializeAddCardFlow(stripePublicKey);
});

let stripe, elements;

const loginPrompt = document.getElementById('login-prompt');
const addCardContent = document.getElementById('add-card-content');
const addCardBtn = document.getElementById('add-card-btn');
const spinner = document.getElementById('spinner');
const errorMessage = document.getElementById('error-message');

function initializeAddCardFlow(publicKey) {
  if (!publicKey) {
    showError('Error: Clave pública de Stripe no configurada.');
    return;
  }

  stripe = Stripe(publicKey);

  document.addEventListener('loginSuccess', checkLoginStatus);
  addCardBtn.addEventListener('click', handleAddCard);

  checkLoginStatus();
}

function checkLoginStatus() {
  const token = localStorage.getItem('authToken');
  if (token) {
    loginPrompt.classList.add('hidden');
    addCardContent.classList.remove('hidden');
    setupStripeForm(token);
  } else {
    loginPrompt.classList.remove('hidden');
    addCardContent.classList.add('hidden');
  }
}

async function setupStripeForm(token) {
  setLoading(true);
  try {
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

    elements = stripe.elements({ clientSecret: data.clientSecret });
    const paymentElement = elements.create('payment');
    paymentElement.mount('#payment-element');
  } catch (error) {
    showError('Error al inicializar Stripe: ' + error.message);
  } finally {
    setLoading(false);
  }
}

async function handleAddCard() {
  if (!elements) {
    showError('El formulario de tarjeta no está listo.');
    return;
  }

  setLoading(true);
  const token = localStorage.getItem('authToken');
  const isDefault = document.getElementById('default-card-checkbox').checked;

  try {
    const { error: setupError, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: window.location.href.split('?')[0],
      },
    });

    if (setupError) throw new Error(setupError.message);
    if (setupIntent.status !== 'succeeded') {
      throw new Error(`El guardado falló con estado: ${setupIntent.status}`);
    }

    const paymentMethodId = setupIntent.payment_method;

    // Llamamos al backend para asociar y marcar como predeterminado si aplica
    const response = await fetch(
      '/api/v1/client/payments/stripe/payment-methods',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentMethodId,
          isDefault,
        }),
      }
    );

    const result = await response.json();
    if (!response.ok) throw new Error(result.message);

    window.location.href = '/checkout';
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  errorMessage.classList.add('hidden');
  spinner.classList.toggle('hidden', !isLoading);
  addCardBtn.disabled = isLoading;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
}
