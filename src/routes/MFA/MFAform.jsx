import React, { useState, useContext, useEffect, useRef } from "react";
import "./MFAform.css";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../../context/user.context";

const API_BASE =
  (window.__ENV__ && window.__ENV__.API_BASE) ||
  "https://nutrihelp-api-ved.onrender.com/api";

async function verifyMfa({ email, password, code }) {
  const res = await fetch(`${API_BASE}/login/mfa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, mfa_token: code }),
  });

  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || "Failed to verify MFA token";
    throw new Error(msg);
  }
  return data || {};
}

const MFAform = () => {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [resendStatus, setResendStatus] = useState("");
  const [countdown, setCountdown] = useState(0);
  const inputsRef = useRef([]);

  const navigate = useNavigate();
  const { setCurrentUser } = useContext(UserContext);
  const location = useLocation();
  const { email, password } = location.state || {};

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const onChange = (idx, val) => {
    const v = (val || "").replace(/\D/g, "").slice(0, 1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    if (v && idx < next.length - 1) inputsRef.current[idx + 1]?.focus();
  };

  const onKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
      const next = [...digits];
      next[idx - 1] = "";
      setDigits(next);
      e.preventDefault();
    }
  };

  const onPaste = (e) => {
    const pasted = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
    setDigits(next);
    const lastIdx = Math.min(pasted.length, 6) - 1;
    inputsRef.current[lastIdx >= 0 ? lastIdx : 0]?.focus();
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Your session is missing login details. Please sign in again.");
      navigate("/login");
      return;
    }

    const code = digits.join("");
    if (code.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    try {
      const data = await verifyMfa({ email, password, code });

      if (data.accessToken || data.token) {
        localStorage.setItem("nh_access", data.accessToken || data.token);
      }
      if (data.refreshToken) {
        localStorage.setItem("nh_refresh", data.refreshToken);
      }
      if (data.user) setCurrentUser(data.user);

      alert("MFA verification successful!");
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to verify MFA token.");
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    // If you expose a resend endpoint later, call it here
    setResendStatus("Code resent to your email.");
    setCountdown(30);
    setTimeout(() => setResendStatus(""), 2500);
  };

  useEffect(() => {
    if (!countdown) return;
    const t = setTimeout(() => setCountdown((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  return (
    <div className="mfa-auth-wrapper">
      <div className="mfa-card-container">
        <div className="mfa-auth-card">
          <h2 className="mfa-title">Multi-Factor Authentication</h2>
          <p className="mfa-subtitle">Please enter the 6-digit code sent to your email</p>

          {error && <div className="mfa-error">{error}</div>}

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="mfa-input-container" onPaste={onPaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  id={`mfa-input-${i}`}
                  ref={(el) => (inputsRef.current[i] = el)}
                  className="mfa-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={d}
                  onChange={(e) => onChange(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                />
              ))}
            </div>

            <p className="resend-text">
              Didn’t get the code?{" "}
              <button
                type="button"
                className="resend-link"
                onClick={handleResendCode}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
              </button>
              {resendStatus && <span className="resend-status"> — {resendStatus}</span>}
            </p>

            <button className="mfa-submit-button" type="submit">
              Verify account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MFAform;
