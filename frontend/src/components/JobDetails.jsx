import React from "react";
import ApplicantsList from "./ApplicantsList";

const formatSalary = (val) => {
  const num = Number(val);
  if (isNaN(num) || val === null || val === undefined) return val;
  if (num >= 1000000) {
    const millions = num / 1000000;
    return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (num >= 1000) {
    const thousands = num / 1000;
    return `$${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`;
  }
  return `$${num}`;
};

function JobDetails({ job, onClose, user, onApplyClick, hasApplied, isSaved, onToggleSave, onShowApplicants }) {
  if (!job) return null;

  const isRecruiter = user?.role === "recruiter";

  return (
    <div className="job-details-panel">
      {!isRecruiter && (
        <button
          type="button"
          className={`details-save-star ${isSaved ? "saved" : ""}`}
          onClick={onToggleSave}
          aria-label={isSaved ? "Unsave Job" : "Save Job"}
        >
          {isSaved ? "★" : "☆"}
        </button>
      )}
      <button className="close-btn" onClick={onClose} aria-label="Close Details">
        ✕
      </button>

      <div className="details-header">
        <span className="detail-badge">JOB DETAILS</span>
        <h2>{job.title}</h2>
        <h3>{job.company}</h3>
      </div>

      <div className="details-meta">
        <div className="meta-item">
          <span className="meta-label">LOCATION</span>
          <span className="meta-value">{job.location}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">JOB TYPE</span>
          <span className="meta-value font-orange">{job.jobType || "Full Time"}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">SALARY</span>
          <span className="meta-value">{formatSalary(job.salary)}</span>
        </div>
      </div>

      <div className="details-body">
        <h4>JOB DESCRIPTION</h4>
        <div className="details-description">
          {job.description}
        </div>
      </div>

      {isRecruiter ? (
        <div className="details-footer">
          <button
            type="button"
            className="show-applicants-btn"
            onClick={() => onShowApplicants(job)}
          >
            SHOW APPLICANTS 👥
          </button>
        </div>
      ) : (
        <div className="details-footer">
          <button
            type="button"
            className={`apply-btn ${hasApplied ? "applied" : ""}`}
            onClick={onApplyClick}
            disabled={hasApplied}
          >
            {hasApplied ? (
              <>
                COMPLETED
                <svg
                  className="btn-icon"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="#000000"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
              </>
            ) : (
              "APPLY NOW"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default JobDetails;
