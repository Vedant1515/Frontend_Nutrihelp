import { UserIcon } from "lucide-react";
import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { UserContext } from "../../context/user.context";
import { useDarkMode } from "../DarkModeToggle/DarkModeContext";
import "./Login.css";
import FramerClient from "../../components/framer-client";
import NutrihelpLogo from "./Nutrihelp_Logo.PNG";

const API_BASE =
  (window.__ENV__ && window.__ENV__.API_BASE) ||
  "https://nutrihelp-api-ved.onrender.com/api";

// Try /auth/login first, then /login (your API lists both in docs)
async function apiLogin({ email, password }) {
  const opts = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  };

  // 1) /auth/login
  let res = await fetch(`${API_BASE}/auth/login`, opts);
  if (res.ok) return res.json();

  // 2) fallback /login (if server uses that route)
  if (res.status === 404 || res.status === 405) {
    res = await fetch(`${API_BASE}/login`, opts);
    if (res.ok) return res.json();
  }

  // Throw detailed error
  let msg = "Failed to sign in.";
  try {
    const data = await res.json();
    msg = data?.error || data?.message || msg;
  } catch {}
  throw new Error(msg);
}

const Login = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useContext(UserContext);
  const [showPassword, setShowPassword] = useState(false);
  const [contact, setContact] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const { darkMode } = useDarkMode();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setContact((prev) => ({ ...prev, [name]: value }));
  };

  const { email, password } = contact;

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      const data = await apiLogin({ email, password });

      // Optional: store tokens if your API returns them
      if (data.accessToken || data.token) {
        localStorage.setItem("nh_access", data.accessToken || data.token);
      }
      if (data.refreshToken) {
        localStorage.setItem("nh_refresh", data.refreshToken);
      }

      // Persist user (your context’s API)
      const expirationTimeInMillis = isChecked ? 3600000 : 0; // 1h if checked, else session
      if (data.user) {
        setCurrentUser(data.user, expirationTimeInMillis);
      }

      // Toast
      toast.success(
        "💧 Welcome back! Don’t forget to check your meal plan & track your water intake!",
        {
          position: "top-right",
          autoClose: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          hideProgressBar: false,
          theme: "colored",
          style: {
            fontSize: "1.1rem",
            fontWeight: "bold",
            padding: "1.2rem",
            borderRadius: "10px",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
            backgroundColor: "#d1f0ff",
            color: "#0d47a1",
          },
        }
      );

      // If your flow does MFA next, keep your route:
      setTimeout(() => {
        navigate("/MFAform", { state: { email, password } });
      }, 300);
    } catch (err) {
      console.error("Error signing in:", err);
      setError(err.message || "Failed to sign in. Please try again.");
    }
  };

  const handleToggleCheckbox = () => setIsChecked((v) => !v);
  const handleForgotPasswordClick = () => navigate("/forgotPassword");

  return (
    <FramerClient>
      <div className={`w-screen h-screen ${darkMode && "bg-[#555555]"}`}>
        <div className="h-auto w-[70%] flex flex-col md:flex-row justify-center items-center mt-24 ml-auto mr-auto shadow-2xl border-none rounded-2xl overflow-hidden p-[20px]">
          <div className="w-[100%]">
            <img
              src={NutrihelpLogo}
              alt="Nutrihelp Logo"
              className="rounded-xl w-[500px] mx-auto"
            />
            <h2 className={`font-bold text-4xl mt-4 ${darkMode && "text-white"}`}>
              LOG IN
            </h2>
            <p className="text-lg text-center text-gray-500">
              Enter your email and password to sign in!
            </p>

            {error && <p className="error-message">{error}</p>}

            <label htmlFor="email" className="input-label">Email*</label>
            <input
              className={`border-1 ${darkMode && "bg-gray-700 text-white font-semibold"}`}
              name="email"
              type="text"
              placeholder="Enter Your Email"
              onChange={handleChange}
              value={email}
            />

            <div>
              <label htmlFor="password" className="input-label">Password*</label>
              <div className="password-field">
                <input
                  className={`border-1 ${darkMode && "bg-gray-700 text-white font-semibold"}`}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  onChange={handleChange}
                  value={password}
                />
                <span
                  className="eye-icon tts-ignore cursor-pointer"
                  aria-hidden="true"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </span>
              </div>
            </div>

            <div className="options">
              <div className="keep-logged-in ">
                <div
                  className={`checkbox-div ${isChecked ? "checked" : ""}`}
                  onClick={handleToggleCheckbox}
                >
                  <span className="checkbox-indicator"></span>
                </div>
                <label htmlFor="keepLoggedIn" className="ml-2">Keep me logged in</label>
              </div>
              <div
                className={`forgot-password ${darkMode ? "text-purple-300" : "text-purple-800"}`}
                onClick={handleForgotPasswordClick}
              >
                Forgot password?
              </div>
            </div>

            <button
              className={`w-full rounded-full mb-6 text-2xl font-bold flex justify-center gap-3 items-center ${
                darkMode
                  ? "bg-purple-700 hover:bg-purple-500"
                  : "bg-purple-400 text-gray-800 hover:bg-purple-700 hover:text-white"
              }`}
              onClick={handleSignIn}
            >
              <UserIcon size={24} />
              Sign In
            </button>

            <p className="text-2xl font-semibold text-center mt-4 mb-4">Or</p>

            <button
              className={`w-full rounded-full mb-6 text-2xl font-bold flex justify-center gap-3 items-center ${
                darkMode
                  ? "bg-green-700 hover:bg-green-500"
                  : "bg-green-500 text-gray-800 hover:bg-green-700 hover:text-white"
              }`}
              onClick={handleSignIn}
            >
              <img
                src="https://static.vecteezy.com/system/resources/previews/022/613/027/non_2x/google-icon-logo-symbol-free-png.png"
                className="w-[25px]"
              />
              Sign In With Google
            </button>

            <p className={`signup-link mb-5`}>
              Not registered yet?{" "}
              <Link
                to="/signUp"
                className={`${darkMode ? "text-purple-300" : "text-purple-800"}`}
              >
                Create an Account
              </Link>
            </p>
          </div>

          <div className="flex flex-col justify-center items-center m-auto">
            <img
              src="https://cdni.iconscout.com/illustration/premium/thumb/woman-watching-food-menu-while-checkout-order-using-application-illustration-download-in-svg-png-gif-file-formats--online-service-mobile-app-pack-e-commerce-shopping-illustrations-10107922.png"
              alt="Nutrihelp Logo 2"
            />
          </div>
        </div>
      </div>
    </FramerClient>
  );
};

export default Login;
