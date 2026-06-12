import React from "react";

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

function JobCard({ job, onDeleteJob, onEditJob, user }) {
  const isRecruiter = user?.role === "recruiter";

  return (
    <div className="job-card">
      <div className="job-card-header">
        <div>
          <h3>{job.title}</h3>
          <p className="company">{job.company}</p>
        </div>
        <span className="job-card-type-badge">{job.jobType || "Full Time"}</span>
      </div>

      <div className="job-card-meta">
        <p>
          <strong>Location:</strong> {job.location}
        </p>
        <p>
          <strong>Salary:</strong> {formatSalary(job.salary)}
        </p>
      </div>
      
      <p className="description">{job.description}</p>
      
      {isRecruiter && onEditJob && onDeleteJob && (
        <div className="card-actions">
          <button type="button" className="edit-btn" onClick={() => onEditJob(job)}>
            Edit
          </button>
          <button type="button" className="delete-btn" onClick={() => onDeleteJob(job._id)}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default JobCard;
