// Centralized API base URL for frontend
export const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL + '/api';

// Loader for reCAPTCHA v3 script
export function loadRecaptchaScript(siteKey) {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha) {
      resolve(window.grecaptcha);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.grecaptcha);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
