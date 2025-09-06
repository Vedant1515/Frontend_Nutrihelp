// script.js (ES module)
import api, { setTokens } from "./apiClient.js";

// UI refs
const container = document.getElementById("container");
const registerBtn = document.getElementById("register");
const loginBtn = document.getElementById("login");
const toSignup1 = document.getElementById("to-signup-1");
const toLogin1 = document.getElementById("to-login-1");

registerBtn?.addEventListener("click", () => container.classList.add("active"));
loginBtn?.addEventListener("click", () => container.classList.remove("active"));
toSignup1?.addEventListener("click", () => container.classList.add("active"));
toLogin1?.addEventListener("click", () => container.classList.remove("active"));

const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const signupError = document.getElementById("signup-error");
const loginError = document.getElementById("login-error");
const toast = document.getElementById("toast");

function showToast(msg, ms = 2600) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), ms);
}
function setLoading(form, loading) {
  const btn = form.querySelector('button[type="submit"]');
  if (!btn) return;
  if (!btn.dataset.label) btn.dataset.label = btn.textContent;
  btn.disabled = loading;
  btn.textContent = loading ? "Please wait..." : btn.dataset.label;
}
const t = (v) => (v || "").trim();

// ------- SIGN UP -------
signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  signupError.textContent = "";
  const name = t(document.getElementById("signup-name")?.value);
  const email = t(document.getElementById("signup-email")?.value);
  const password = t(document.getElementById("signup-password")?.value);
  if (!name || !email || !password) {
    signupError.textContent = "Please fill all fields.";
    return;
  }
  if (password.length < 6) {
    signupError.textContent = "Password must be at least 6 characters.";
    return;
  }

  setLoading(signupForm, true);
  try {
    const data = await api.auth.register({ name, email, password });
    // if API returns tokens immediately:
    if (data.accessToken || data.refreshToken || data.token) {
      setTokens({
        accessToken: data.accessToken || data.token,
        refreshToken: data.refreshToken,
      });
    }
    showToast("Account created. You can now sign in.");
    container.classList.remove("active");
  } catch (err) {
    signupError.textContent = err.message || "Registration failed.";
  } finally {
    setLoading(signupForm, false);
  }
});

// ------- LOGIN -------
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  const email = t(document.getElementById("login-email")?.value);
  const password = t(document.getElementById("login-password")?.value);
  if (!email || !password) {
    loginError.textContent = "Please enter email and password.";
    return;
  }

  setLoading(loginForm, true);
  try {
    const data = await api.auth.login({ email, password });
    // expected: { accessToken, refreshToken, user }
    setTokens({
      accessToken: data.accessToken || data.token,
      refreshToken: data.refreshToken,
    });
    if (data.user) localStorage.setItem("nh_user", JSON.stringify(data.user));
    showToast("Signed in successfully!");

    // Example: fetch profile after login, then redirect
    try {
      await api.auth.profile();
    } catch {}
    window.location.href = "/"; // change to your app's main page or route
  } catch (err) {
    loginError.textContent = err.message || "Login failed.";
  } finally {
    setLoading(loginForm, false);
  }
});
