// src/hooks/useRecaptcha.js
import { useEffect } from "react";
import { loadRecaptchaScript, API_BASE_URL } from "../utils/api";
import toast from "react-hot-toast";

export function useRecaptcha() {
  useEffect(() => {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    loadRecaptchaScript(siteKey).then(grecaptcha => {
      grecaptcha.ready(() => {
        grecaptcha.execute(siteKey, { action: "page_load" })
          .then((token) => {
           
            // Send token to backend to verify and set secure cookie
            fetch(`${API_BASE_URL.replace(/\/api$/, '')}/verify_captcha`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token }),
              credentials: "include", // Important! includes cookies
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  toast.success(" Human verified:" + data.score);
                } else {
                  toast.error("CAPTCHA verification failed:" + data.error);
                }
              })
              .catch((err) => toast.error("Verification error:" + err));
          });
      });
    });
  }, []);
}
