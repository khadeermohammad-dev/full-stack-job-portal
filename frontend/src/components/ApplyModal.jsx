import React, { useState } from "react";
import { applyToJob } from "../services/api";

const ApplyModal = ({ job, user, onClose, onApplySuccess }) => {
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [experience, setExperience] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeData, setResumeData] = useState("");
  const [errors, setErrors] = useState({ fullName: "", email: "", phone: "", server: "" });
  const [loading, setLoading] = useState(false);

  const validateName = (val) => {
    if (!val.trim()) return "Full name is required";
    return "";
  };

  const validateEmail = (val) => {
    if (!val.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) return "Please enter a valid email address";
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

  const handleNameChange = (e) => {
    const val = e.target.value;
    setFullName(val);
    if (!resumeFile) {
      setErrors((prev) => ({ ...prev, fullName: validateName(val) }));
    } else {
      setErrors((prev) => ({ ...prev, fullName: "" }));
    }
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (!resumeFile) {
      setErrors((prev) => ({ ...prev, email: validateEmail(val) }));
    } else {
      setErrors((prev) => ({ ...prev, email: "" }));
    }
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setPhone(val);
    if (!resumeFile) {
      setErrors((prev) => ({ ...prev, phone: validatePhone(val) }));
    } else {
      setErrors((prev) => ({ ...prev, phone: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      setErrors((prev) => ({ ...prev, fullName: "", email: "", phone: "" }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setResumeData(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setResumeFile(null);
      setResumeData("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isResumeUploaded = !!resumeFile;
    const nameErr = isResumeUploaded ? "" : validateName(fullName);
    const emailErr = isResumeUploaded ? "" : validateEmail(email);
    const phoneErr = isResumeUploaded ? "" : validatePhone(phone);

    if (nameErr || emailErr || phoneErr) {
      setErrors({ fullName: nameErr, email: emailErr, phone: phoneErr, server: "" });
      return;
    }

    setLoading(true);
    setErrors((prev) => ({ ...prev, server: "" }));

    try {
      await applyToJob(job._id, {
        fullName,
        email,
        phone,
        experience,
        coverLetter,
        resumeName: resumeFile ? resumeFile.name : "",
        resumeData
      });
      onApplySuccess();
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({
        ...prev,
        server: err.response?.data?.message || "Failed to submit application. Try again.",
      }));
    } finally {
      setLoading(false);
    }
  };

  const isFormDisabled = () => {
    if (loading) return true;
    if (!resumeFile) {
      return !!(errors.fullName || errors.email || errors.phone || !fullName || !email || !phone);
    }
    return false;
  };

  return (
    <div className="modal-overlay">
      <div className="apply-modal-card">
        <div className="apply-modal-header">
          <div className="apply-modal-title-box">
            <h2>APPLY FOR POSITION</h2>
            <p className="job-title-highlight">{job.title} at {job.company}</p>
          </div>
          <button type="button" className="close-modal-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="apply-modal-form">
          <div className="auth-input-group">
            <label htmlFor="modal-fullname">Full Name {resumeFile ? "(Optional)" : "*"}</label>
            <input
              type="text"
              id="modal-fullname"
              placeholder="Enter your full name"
              value={fullName}
              onChange={handleNameChange}
              className={errors.fullName ? "input-error" : ""}
            />
            {errors.fullName && <span className="inline-error">{errors.fullName}</span>}
          </div>

          <div className="auth-input-group">
            <label htmlFor="modal-email">Email Address {resumeFile ? "(Optional)" : "*"}</label>
            <input
              type="email"
              id="modal-email"
              placeholder="Enter email address"
              value={email}
              onChange={handleEmailChange}
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && <span className="inline-error">{errors.email}</span>}
          </div>

          <div className="auth-input-group">
            <label htmlFor="modal-phone">Phone Number {resumeFile ? "(Optional)" : "*"}</label>
            <input
              type="text"
              id="modal-phone"
              placeholder="Enter phone number"
              value={phone}
              onChange={handlePhoneChange}
              className={errors.phone ? "input-error" : ""}
            />
            {errors.phone && <span className="inline-error">{errors.phone}</span>}
          </div>

          {/* Experience & Resume upload row */}
          <div className="form-row-split">
            <div className="auth-input-group">
              <label htmlFor="modal-experience">Experience (Years) (Optional)</label>
              <input
                type="text"
                id="modal-experience"
                placeholder="e.g. 3 years"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>
            <div className="auth-input-group">
              <label htmlFor="modal-resume">Resume / CV (Optional)</label>
              <input
                type="file"
                id="modal-resume"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <button
                type="button"
                className="custom-file-upload-btn"
                onClick={() => document.getElementById("modal-resume").click()}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: "6px" }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {resumeFile ? resumeFile.name : "Upload Resume File"}
              </button>
            </div>
          </div>

          <div className="auth-input-group">
            <label htmlFor="modal-coverletter">Cover Letter / Message (Optional)</label>
            <textarea
              id="modal-coverletter"
              placeholder="Write a brief message to the recruiter..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows="2"
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "8px",
                padding: "10px",
                color: "white",
                fontFamily: "inherit",
                fontSize: "12px",
                resize: "none",
                outline: "none"
              }}
            />
          </div>

          {errors.server && <div className="server-error">{errors.server}</div>}

          <div className="apply-modal-actions">
            <button type="button" className="modal-cancel-btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="modal-submit-btn"
              disabled={isFormDisabled()}
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyModal;
