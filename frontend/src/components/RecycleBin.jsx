import React, { useState, useEffect } from "react";
import { getDeletedJobs, restoreJob, permanentDeleteJob } from "../services/api";

const RecycleBin = ({ onJobsChanged }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [deletedJobs, setDeletedJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  const fetchDeleted = async () => {
    try {
      const res = await getDeletedJobs();
      setDeletedJobs(res.data);
      if (res.data.length > 0 && !selectedJob) {
        setSelectedJob(res.data[0]);
      } else if (res.data.length === 0) {
        setSelectedJob(null);
      } else if (selectedJob) {
        // Refresh selected job reference
        const updatedSelected = res.data.find(j => j._id === selectedJob._id);
        setSelectedJob(updatedSelected || res.data[0]);
      }
    } catch (err) {
      console.error("Error fetching deleted jobs:", err);
    }
  };

  useEffect(() => {
    // Fetch deleted jobs on mount
    fetchDeleted();
  }, []);

  // Poll or fetch deleted jobs when hover or overlay opens
  useEffect(() => {
    if (isOpen || isHovered) {
      fetchDeleted();
    }
  }, [isOpen, isHovered]);

  const handleRestore = async (id) => {
    try {
      await restoreJob(id);
      await fetchDeleted();
      if (onJobsChanged) onJobsChanged();
    } catch (err) {
      console.error("Error restoring job:", err);
    }
  };

  const handlePermanentDeleteClick = (job) => {
    const skipConfirm = localStorage.getItem("hirespace_skip_delete_confirm") === "true";
    if (skipConfirm) {
      executePermanentDelete(job._id);
    } else {
      setJobToDelete(job);
      setDontShowAgain(false);
      setShowConfirm(true);
    }
  };

  const executePermanentDelete = async (id) => {
    try {
      await permanentDeleteJob(id);
      await fetchDeleted();
      if (onJobsChanged) onJobsChanged();
    } catch (err) {
      console.error("Error permanently deleting job:", err);
    }
  };

  const confirmDelete = () => {
    if (dontShowAgain) {
      localStorage.setItem("hirespace_skip_delete_confirm", "true");
    }
    if (jobToDelete) {
      executePermanentDelete(jobToDelete._id);
    }
    setShowConfirm(false);
    setJobToDelete(null);
  };

  return (
    <>
      {/* Floating Circle Button bottom-left */}
      <div
        className="recycle-bin-trigger-container"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          type="button"
          className="recycle-bin-btn"
          onClick={() => setIsOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
          {deletedJobs.length > 0 && (
            <span className="recycle-bin-badge">{deletedJobs.length}</span>
          )}
        </button>

        {/* Hover Tooltip/List Preview on side */}
        {isHovered && !isOpen && (
          <div className="recycle-bin-tooltip">
            <h4>RECYCLE BIN ({deletedJobs.length})</h4>
            {deletedJobs.length === 0 ? (
              <p className="empty-text">No deleted jobs.</p>
            ) : (
              <div className="tooltip-job-list">
                {deletedJobs.slice(0, 5).map((job) => (
                  <div key={job._id} className="tooltip-job-item">
                    <span className="title">{job.title}</span>
                    <span className="company">{job.company}</span>
                  </div>
                ))}
                {deletedJobs.length > 5 && (
                  <div className="more-text">+{deletedJobs.length - 5} more items</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Overlay (Click State) */}
      {isOpen && (
        <div className="recycle-overlay">
          <div className="recycle-overlay-card">
            <div className="recycle-overlay-header">
              <div className="recycle-title-box">
                <h2>RECYCLE BIN</h2>
                <p>RESTORE OR PERMANENTLY ERASE JOBS</p>
              </div>
              <button
                type="button"
                className="close-overlay-btn"
                onClick={() => setIsOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="recycle-split-content">
              {/* Left Side: List of soft-deleted jobs */}
              <div className="recycle-left-panel">
                <h3>DELETED JOBS ({deletedJobs.length})</h3>
                {deletedJobs.length === 0 ? (
                  <div className="recycle-empty-state">
                    <p>Trash is empty.</p>
                  </div>
                ) : (
                  <div className="recycle-job-list">
                    {deletedJobs.map((job) => (
                      <button
                        key={job._id}
                        type="button"
                        className={`recycle-job-card ${selectedJob?._id === job._id ? "active" : ""}`}
                        onClick={() => setSelectedJob(job)}
                      >
                        <span className="job-title">{job.title}</span>
                        <span className="job-company">{job.company}</span>
                        <span className="job-deleted-date">
                          Deleted: {job.deletedAt ? new Date(job.deletedAt).toLocaleDateString("en-GB") : "Recently"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Side: Details of selected deleted job */}
              <div className="recycle-right-panel">
                {selectedJob ? (
                  <div className="recycle-details-content">
                    <h3>JOB DETAILS</h3>
                    <div className="detail-field">
                      <span className="field-label">Job Title</span>
                      <span className="field-val title-val">{selectedJob.title}</span>
                    </div>
                    <div className="detail-field">
                      <span className="field-label">Company Name</span>
                      <span className="field-val">{selectedJob.company}</span>
                    </div>
                    <div className="detail-field mb-row">
                      <div>
                        <span className="field-label">Location</span>
                        <span className="field-val">{selectedJob.location}</span>
                      </div>
                      <div>
                        <span className="field-label">Job Type</span>
                        <span className="field-val badge-val">{selectedJob.jobType || "Full Time"}</span>
                      </div>
                    </div>
                    <div className="detail-field">
                      <span className="field-label">Salary</span>
                      <span className="field-val font-jersey">${selectedJob.salary?.toLocaleString()}</span>
                    </div>
                    <div className="detail-field flex-grow-field">
                      <span className="field-label">Full Description</span>
                      <div className="field-desc-box">{selectedJob.description}</div>
                    </div>

                    <div className="recycle-action-buttons">
                      <button
                        type="button"
                        className="recycle-restore-btn"
                        onClick={() => handleRestore(selectedJob._id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 4 23 10 17 10"></polyline>
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                        Restore Job
                      </button>
                      <button
                        type="button"
                        className="recycle-delete-permanent-btn"
                        onClick={() => handlePermanentDeleteClick(selectedJob)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Delete Permanently
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="recycle-no-selection">
                    <p>Select a deleted job from the left list to view details.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styled Popup Alert Modal for Permanent Deletion */}
      {showConfirm && jobToDelete && (
        <div className="modal-overlay z-index-top">
          <div className="confirm-alert-card">
            <div className="confirm-alert-header">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff8c00" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <h3>CRITICAL WARNING</h3>
            </div>
            
            <div className="confirm-alert-body">
              <p>Are you sure you want to permanently delete the job <strong>{jobToDelete.title}</strong>?</p>
              <p className="warning-text">This action cannot be undone. All applications associated with this job post will also be deleted.</p>
            </div>

            <div className="confirm-alert-checkbox-row">
              <label htmlFor="dont-show-again-checkbox" className="custom-checkbox-container">
                <input
                  type="checkbox"
                  id="dont-show-again-checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                />
                <span className="checkbox-text">Don't show this again</span>
              </label>
            </div>

            <div className="confirm-alert-actions">
              <button
                type="button"
                className="confirm-cancel-btn"
                onClick={() => {
                  setShowConfirm(false);
                  setJobToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-delete-btn"
                onClick={confirmDelete}
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecycleBin;
