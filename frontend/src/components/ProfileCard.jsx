import React, { useState, useRef, useEffect } from "react";

const ProfileCard = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => setIsOpen(!isOpen);

  if (!user) return null;

  return (
    <div className="profile-card-container" ref={dropdownRef}>
      <button type="button" className="profile-pill" onClick={handleToggle}>
        <div className="profile-avatar-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div className="profile-pill-text">
          <span className="profile-pill-name">{user.fullName || "User"}</span>
          <span className="profile-pill-role">{user.role?.toUpperCase() || "VISITOR"}</span>
        </div>
        <div className="profile-pill-arrow">
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
            style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="profile-dropdown-card">
          <div className="profile-dropdown-header">
            <h4>{user.fullName}</h4>
            <span className="profile-dropdown-role-badge">{user.role?.toUpperCase()}</span>
          </div>

          <div className="profile-dropdown-details">
            <div className="detail-item">
              <span className="detail-label">Email</span>
              <span className="detail-val">{user.email}</span>
            </div>

            {user.role === "recruiter" && user.companyName && (
              <div className="detail-item">
                <span className="detail-label">Company</span>
                <span className="detail-val">{user.companyName}</span>
              </div>
            )}
          </div>

          <button type="button" className="profile-logout-btn" onClick={onLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "8px" }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
