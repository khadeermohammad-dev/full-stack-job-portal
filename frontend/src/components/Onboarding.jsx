import React, { useState } from "react";
import { updateProfile } from "../services/api";

const Onboarding = ({ user, onOnboardingComplete }) => {
  const [role, setRole] = useState(null); // 'recruiter' or 'applicant'
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [errors, setErrors] = useState({ fullName: "", phone: "", companyName: "", server: "" });
  const [loading, setLoading] = useState(false);

  const validateFullName = (val) => {
    if (!val.trim()) return "Full name is required";
    if (val.trim().length < 2) return "Name must be at least 2 characters";
    return "";
  };

  const validatePhone = (val) => {
    if (!val.trim()) return "Phone number is required";
    const phoneRegex = /^\+?[0-9\s-]{10,15}$/;
    if (!phoneRegex.test(val.replace(/\s+/g, ""))) {
      return "Please enter a valid phone number (at least 10 digits)";
    }
    return "";
  };

  const validateCompany = (val) => {
    if (role === "recruiter" && !val.trim()) return "Company name is required";
    return "";
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setFullName(val);
    setErrors((prev) => ({ ...prev, fullName: validateFullName(val) }));
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setPhone(val);
    setErrors((prev) => ({ ...prev, phone: validatePhone(val) }));
  };

  const handleCompanyChange = (e) => {
    const val = e.target.value;
    setCompanyName(val);
    setErrors((prev) => ({ ...prev, companyName: validateCompany(val) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameErr = validateFullName(fullName);
    const phoneErr = validatePhone(phone);
    const compErr = validateCompany(companyName);

    if (nameErr || phoneErr || compErr) {
      setErrors({ fullName: nameErr, phone: phoneErr, companyName: compErr, server: "" });
      return;
    }

    setLoading(true);
    setErrors((prev) => ({ ...prev, server: "" }));

    try {
      const payload = {
        role,
        fullName,
        phone,
        companyName: role === "recruiter" ? companyName : undefined,
      };
      const res = await updateProfile(payload);
      onOnboardingComplete(res.data);
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({
        ...prev,
        server: err.response?.data?.message || "Failed to update profile. Please try again.",
      }));
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="onboarding-container">
        <div className="onboarding-card">
          <h2>WHO ARE YOU?</h2>
          <p className="onboarding-subtitle">CHOOSE YOUR IDENTITY IN HIRESPACE</p>

          <div className="role-choices">
            <button
              type="button"
              className="role-btn recruiter-choice"
              onClick={() => setRole("recruiter")}
            >
              <div className="role-icon-box">
                {/* SVG for recruiter (briefcase/user) */}
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <span className="role-title">RECRUITER</span>
              <span className="role-desc">Post jobs, view applications, hire talent</span>
            </button>

            <button
              type="button"
              className="role-btn applicant-choice"
              onClick={() => setRole("applicant")}
            >
              <div className="role-icon-box">
                {/* SVG for applicant (resume/user) */}
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <span className="role-title">APPLICANT</span>
              <span className="role-desc">Search active opportunities, apply to jobs</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isFormInvalid = !!(errors.fullName || errors.phone || errors.companyName);
  const isFormEmpty = !fullName || !phone || (role === "recruiter" && !companyName);

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <button
          type="button"
          className="back-role-btn"
          onClick={() => {
            setRole(null);
            setErrors({ fullName: "", phone: "", companyName: "", server: "" });
          }}
        >
          &larr; Back to Role Selection
        </button>
        <h2>COMPLETE YOUR PROFILE</h2>
        <p className="onboarding-subtitle">AS A {role.toUpperCase()}</p>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="auth-input-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              placeholder="Enter your full name"
              value={fullName}
              onChange={handleNameChange}
              className={errors.fullName ? "input-error" : ""}
            />
            {errors.fullName && <span className="inline-error">{errors.fullName}</span>}
          </div>

          <div className="auth-input-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="text"
              id="phone"
              placeholder="Enter phone number"
              value={phone}
              onChange={handlePhoneChange}
              className={errors.phone ? "input-error" : ""}
            />
            {errors.phone && <span className="inline-error">{errors.phone}</span>}
          </div>

          {role === "recruiter" && (
            <div className="auth-input-group">
              <label htmlFor="companyName">Company Name</label>
              <input
                type="text"
                id="companyName"
                placeholder="Enter company name"
                value={companyName}
                onChange={handleCompanyChange}
                className={errors.companyName ? "input-error" : ""}
              />
              {errors.companyName && <span className="inline-error">{errors.companyName}</span>}
            </div>
          )}

          {errors.server && <div className="server-error">{errors.server}</div>}

          <button
            type="submit"
            disabled={isFormInvalid || isFormEmpty || loading}
            className="auth-submit-btn"
          >
            {loading ? "Saving Profile..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
