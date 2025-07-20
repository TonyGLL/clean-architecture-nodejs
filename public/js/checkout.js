// public/js/checkout.js (FIXED AND FUNCTIONAL)

/**
 * Logic for the checkout page.
 * Implements the two-path flow:
 * 1. Saved card -> Direct PaymentIntent.
 * 2. New card -> SetupIntent, then PaymentIntent.
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
    showError('Error: Stripe public key not configured.');
    return;
  }
  stripe = Stripe(publicKey);
  addEventListeners(); // Moved before checkLoginStatus
  checkLoginStatus();
}

function addEventListeners() {
  // The 'loginSuccess' listener is still useful if the modal is on the same page
  document.addEventListener('loginSuccess', checkLoginStatus);
  payBtn.addEventListener('click', handlePayment);

  document.querySelectorAll('input[name="payment-method"]').forEach((radio) => {
    radio.addEventListener('change', handlePaymentMethodChange);
  });

  document.querySelectorAll('.delete-method-button').forEach((btn) => {
    btn.addEventListener('click', handleDeletePaymentMethod);
  });
}

function handlePaymentMethodChange(event) {
  const isNewCard = event.target.value === 'new';
  newCardContainer.classList.toggle('hidden', !isNewCard);

  if (isNewCard && !elements) {
    // If "new card" is selected and the form does not exist, we create it.
    // This works both on click and on initial load.
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
// =================== HERE IS THE MAIN CHANGE ===================
// ===================================================================
function showCheckoutContent() {
  loginPrompt.classList.add('hidden');
  checkoutContent.classList.remove('hidden');

  // BEFORE: You used a dispatchEvent() which was unreliable.

  // NOW: We do a direct and explicit check of the initial state.
  // This is much more robust.
  const initialSelection = document.querySelector(
    'input[name="payment-method"]:checked'
  );
  if (initialSelection) {
    // We simulate the 'change' event by directly calling its handler
    // with an object that mimics the structure of an event.
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

// --- Flow 1: Pay with Saved Card ---
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

    handleBackendPaymentResponse(data, paymentMethodId);
  } catch (error) {
    showError(error.message);
    setLoading(false);
  }
}

// --- Flow 2: Pay with New Card ---
async function setupNewCardForm() {
  setLoading(true);
  const token = localStorage.getItem('authToken');
  try {
    // 1. We ask the backend for a "client secret" for the SetupIntent
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

    // 2. We use the secret to initialize the Stripe Elements
    elements = stripe.elements({ clientSecret: data.clientSecret });

    // 3. We create the payment component (which includes CVV, date, etc.)
    const paymentElement = elements.create('payment');

    // 4. THE MAGIC! We "paint" the form inside our empty div.
    paymentElement.mount('#payment-element');
  } catch (error) {
    showError('Could not load the payment form: ' + error.message);
  } finally {
    setLoading(false);
  }
}

async function payWithNewCard() {
  if (!elements) {
    showError(
      'The payment form is not ready. Please wait a moment.'
    );
    return;
  }
  setLoading(true);

  // We confirm the setup to tokenize the card securely
  const { error: setupError, setupIntent } = await stripe.confirmSetup({
    elements,
    redirect: 'if_required',
    confirmParams: {
      return_url: window.location.href.split('?')[0], // URL without parameters
    },
  });

  if (setupError) {
    showError(setupError.message);
    setLoading(false);
    return;
  }

  if (setupIntent.status === 'succeeded') {
    // Success. Stripe returns a payment method ID (`setupIntent.payment_method`)
    // Now we make the actual charge using that ID.
    await payWithSavedCard(setupIntent.payment_method);
  } else {
    showError(
      `Card saving failed with status: ${setupIntent.status}`
    );
    setLoading(false);
  }
}

// --- Response and Result Handling ---
async function handleBackendPaymentResponse(
  { clientSecret, status, orderId },
  paymentMethod
) {
  if (status === 'succeeded') {
    window.location.href = `/success?order_id=${orderId}`;
  } else if (status === 'requires_action') {
    // For 3D Secure authentication (the bank's pop-up window)
    await stripe.handleNextAction({ clientSecret }).then(handleStripeResult);
  } else if (status === 'requires_confirmation') {
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: paymentMethod,
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
      showError(`Payment failed with status: ${paymentIntent.status}`);
      setLoading(false);
    }
  } else {
    showError(`Payment failed with status: ${status}`);
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

async function handleDeletePaymentMethod(event) {
  event.preventDefault();
  const button = event.currentTarget;
  const methodId = button.dataset.methodId;

  const confirmed = confirm(
    'Are you sure you want to delete this payment method?'
  );

  if (!confirmed) return;

  const token = localStorage.getItem('authToken');
  if (!token) {
    showError('You are not authenticated.');
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(
      `/api/v1/client/payments/stripe/payment-methods/${methodId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    await response.json();

    // Optional: visually remove the method from the DOM
    button.closest('.payment-method-row').remove();

    // If the deleted method was the selected one, select another one or "new card"
    const selected = document.querySelector(
      'input[name="payment-method"]:checked'
    );
    if (!selected || selected.id === methodId) {
      document.getElementById('pm_new').checked = true;
    }
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
}

// --- UI Functions (no changes) ---
function setLoading(isLoading) {
  errorMessage.classList.add('hidden');
  spinner.classList.toggle('hidden', !isLoading);
  payBtn.disabled = isLoading;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
}
