// src/routes/MFAform/MFAform.jsx
import React, { useState, useContext, useEffect } from "react";
import "./MFAform.css";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../../context/user.context";

// ✅ Use the single source of truth for API calls
import api, { auth as apiAuth, setTokens } from "../../apiClient";

const MFAform = () => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();
  const { setCurrentUser } = useContext(UserContext);

  const location = useLocation();
  const { email, password } = location.state || {};

  // If someone hits this page directly without coming from Login, send them back.
  useEffect(() => {
    if (!email || !password) {
      navigate("/login");
    }
  }, [email, password, navigate]);

  const handleChange = (index, value) => {
    const safe = value.replace(/\D/, ""); // numeric only
    const next = [...code];
    next[index] = safe;
    setCode(next);

    if (safe && index < code.length - 1) {
      const nextInput = document.getElementById(`mfa-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleMfaVerification = async (e) => {
    e.preventDefault();
    setError("");

    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    try {
      // ✅ Call your API via apiClient (hits Render by default)
      const data = await apiAuth.mfa({
        email,
        password,
        mfa_token: fullCode,
      });

      // Store tokens if backend returns them
      try {
        setTokens({
          accessToken: data?.accessToken || data?.token,
          refreshToken: data?.refreshToken,
        });
      } catch {
        /* No tokens in body or using httpOnly cookies – that's fine */
      }

      // Update user context
      const userPayload =
        data?.user || data?.profile || data?.data || { email };
      setCurrentUser(userPayload);

      alert("MFA verification successful!");
      navigate("/");
    } catch (err) {
      console.error("Error verifying MFA token:", err?.message || err);
      setError(err?.message || "Failed to verify MFA token.");
    }
  };

  const handleResendCode = async () => {
    // If you add a backend route later, call it here via apiClient.
    // Example:
    // await api.someNamespace.resendMfa({ email });
    alert("Code resent to your email.");
    setCountdown(10);
  };

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  return (
    <div className="mfa-auth-wrapper">
      <div className="mfa-card-container">
        <div className="mfa-auth-card">
          <h2 className="mfa-title">Multi-Factor Authentication</h2>
          <p className="mfa-subtitle">
            Please enter the 6-digit code sent to your email
          </p>

          {error && <div className="mfa-error">{error}</div>}

          <form onSubmit={handleMfaVerification} autoComplete="off">
            <div className="mfa-input-container">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`mfa-input-${index}`}
                  className="mfa-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                />
              ))}
            </div>

            <p className="resend-text">
              Didn’t get the code?{" "}
              <span
                className={`resend-link ${countdown > 0 ? "disabled" : ""}`}
                onClick={countdown > 0 ? undefined : handleResendCode}
              >
                {countdown > 0
                  ? `Resending Code in ${countdown} seconds`
                  : "Resend code"}
              </span>
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
