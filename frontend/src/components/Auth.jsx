import React, { useState } from "react";
import { login, register, resetPassword } from "../services/api";
import hirespacelogo from "../assets/hirespacelogo.png";

const Auth = ({ onAuthSuccess }) => {
  const [authMode, setAuthMode] = useState("login"); // "login", "signup", "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "", confirmPassword: "", server: "" });
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (val) => {
    if (!val) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (val) => {
    if (!val) return "Password is required";
    if (val.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const validateConfirmPassword = (val, pass) => {
    if (authMode === "forgot") {
      if (!val) return "Confirm password is required";
      if (val !== pass) return "Passwords do not match";
    }
    return "";
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setErrors((prev) => ({ ...prev, email: validateEmail(val), server: "" }));
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setErrors((prev) => ({
      ...prev,
      password: validatePassword(val),
      confirmPassword: validateConfirmPassword(confirmPassword, val),
      server: ""
    }));
  };

  const handleConfirmPasswordChange = (e) => {
    const val = e.target.value;
    setConfirmPassword(val);
    setErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(val, password), server: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    const confirmErr = validateConfirmPassword(confirmPassword, password);

    if (emailErr || passErr || confirmErr) {
      setErrors({ email: emailErr, password: passErr, confirmPassword: confirmErr, server: "" });
      return;
    }

    setLoading(true);
    setErrors((prev) => ({ ...prev, server: "" }));
    setSuccessMessage("");

    try {
      if (authMode === "signup") {
        const res = await register({ email, password });
        localStorage.setItem("hirespace_token", res.data.token);
        onAuthSuccess(res.data);
      } else if (authMode === "login") {
        const res = await login({ email, password });
        localStorage.setItem("hirespace_token", res.data.token);
        onAuthSuccess(res.data);
      } else if (authMode === "forgot") {
        const res = await resetPassword({ email, password });
        setSuccessMessage(res.data.message || "Password updated successfully!");
        // Clear password fields
        setPassword("");
        setConfirmPassword("");
        // Toggle back to login
        setAuthMode("login");
      }
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({
        ...prev,
        server: err.response?.data?.message || "Action failed. Try again.",
      }));
    } finally {
      setLoading(false);
    }
  };

  const isFormEmpty = () => {
    if (authMode === "forgot") {
      return !email || !password || !confirmPassword;
    }
    return !email || !password;
  };

  const hasErrors = () => {
    if (authMode === "forgot") {
      return !!(errors.email || errors.password || errors.confirmPassword);
    }
    return !!(errors.email || errors.password);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo-section">
          <div className="auth-favicon-placeholder">
            <img src={hirespacelogo} alt="Hirespace Logo" className="auth-logo-img" />
          </div>
          <h2>HIRESPACE</h2>
          <p className="auth-subtitle">ACCESS THE ACCRETION DISK OF OPPORTUNITIES</p>
        </div>

        {authMode !== "forgot" ? (
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${authMode === "login" ? "active" : ""}`}
              onClick={() => {
                setAuthMode("login");
                setErrors({ email: "", password: "", confirmPassword: "", server: "" });
                setSuccessMessage("");
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${authMode === "signup" ? "active" : ""}`}
              onClick={() => {
                setAuthMode("signup");
                setErrors({ email: "", password: "", confirmPassword: "", server: "" });
                setSuccessMessage("");
              }}
            >
              Sign Up
            </button>
          </div>
        ) : (
          <div className="auth-tabs">
            <button type="button" className="auth-tab active" style={{ cursor: "default" }}>
              Renew Password
            </button>
          </div>
        )}

        {successMessage && <div className="success-toast" style={{ marginBottom: "12px" }}>{successMessage}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && <span className="inline-error">{errors.email}</span>}
          </div>

          <div className="auth-input-group">
            <label htmlFor="password">
              {authMode === "forgot" ? "New Password" : "Password"}
            </label>
            <input
              type="password"
              id="password"
              placeholder={authMode === "forgot" ? "Enter new password" : "Enter password"}
              value={password}
              onChange={handlePasswordChange}
              className={errors.password ? "input-error" : ""}
            />
            {errors.password && <span className="inline-error">{errors.password}</span>}

            {authMode === "login" && (
              <div style={{ textAlign: "right", marginTop: "6px" }}>
                <button
                  type="button"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#ff9900",
                    fontSize: "11px",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontFamily: "inherit",
                    fontWeight: "bold"
                  }}
                  onClick={() => {
                    setAuthMode("forgot");
                    setErrors({ email: "", password: "", confirmPassword: "", server: "" });
                    setSuccessMessage("");
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </div>

          {authMode === "forgot" && (
            <div className="auth-input-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className={errors.confirmPassword ? "input-error" : ""}
              />
              {errors.confirmPassword && <span className="inline-error">{errors.confirmPassword}</span>}
            </div>
          )}

          {errors.server && <div className="server-error">{errors.server}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
            <button
              type="submit"
              disabled={hasErrors() || isFormEmpty() || loading}
              className="auth-submit-btn"
              style={{ marginTop: 0 }}
            >
              {loading
                ? "Processing..."
                : authMode === "signup"
                ? "Sign Up"
                : authMode === "login"
                ? "Sign In"
                : "Renew Password"}
            </button>

            {authMode === "forgot" && (
              <button
                type="button"
                className="cancel-btn"
                style={{
                  height: "38px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  background: "transparent",
                  color: "#aaa",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
                onClick={() => {
                  setAuthMode("login");
                  setErrors({ email: "", password: "", confirmPassword: "", server: "" });
                  setSuccessMessage("");
                }}
              >
                Back to Sign In
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
