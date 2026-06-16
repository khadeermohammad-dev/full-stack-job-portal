import React, { useState, useEffect } from "react";
import {
  getJobApplications,
  updateApplicationStatus,
  bulkUpdateApplications,
  addNote,
  editNote,
  deleteNote,
  scheduleInterview,
  cancelInterview,
} from "../services/api";
import CustomSelect from "./CustomSelect";

const ApplicantsList = ({ jobId }) => {
  const statusOptions = [
    { value: "", label: "ALL PIPELINE STAGES" },
    { value: "Applied", label: "APPLIED" },
    { value: "Under Review", label: "UNDER REVIEW" },
    { value: "Shortlisted", label: "SHORTLISTED" },
    { value: "Interview Scheduled", label: "INTERVIEW SCHEDULED" },
    { value: "Rejected", label: "REJECTED" },
    { value: "Hired", label: "HIRED" },
  ];
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Active / Selected candidate details panel
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  // Note actions
  const [noteContent, setNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");

  // Interview Scheduler states
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewMode, setInterviewMode] = useState("Online");
  const [interviewLink, setInterviewLink] = useState("");
  const [interviewRemarks, setInterviewRemarks] = useState("");

  const fetchApplicants = async () => {
    if (!jobId) return;
    setLoading(true);
    setError("");
    try {
      const res = await getJobApplications(jobId);
      const data = res.data || [];
      setApplicants(data);
      
      // If we have an active selected applicant, sync their state from response
      if (selectedApplicant) {
        const updatedApp = data.find((a) => a._id === selectedApplicant._id);
        if (updatedApp) {
          setSelectedApplicant(updatedApp);
        } else {
          setSelectedApplicant(null);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedApplicant(null);
    setSelectedIds([]);
    fetchApplicants();
  }, [jobId]);

  // Filter applicants
  const filteredApplicants = applicants.filter((app) => {
    const name = app.fullName || "";
    const email = app.email || "";
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
    const matchesStatus = statusFilter ? app.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  // Handle individual checkbox selection
  const handleSelectApplicant = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Handle select/unselect all
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredApplicants.map((a) => a._id));
    } else {
      setSelectedIds([]);
    }
  };

  // Bulk Status Update Action
  const handleBulkStatus = async (status) => {
    if (selectedIds.length === 0) return;
    try {
      await bulkUpdateApplications(selectedIds, status);
      setSelectedIds([]);
      await fetchApplicants();
    } catch (err) {
      console.error("Bulk status update failed:", err);
      alert("Failed to update status for selected candidates.");
    }
  };

  // CSV Export Action
  const handleExportCSV = () => {
    if (filteredApplicants.length === 0) return;
    const headers = ["Name", "Email", "Phone", "Experience", "Applied Date", "Status", "Cover Letter"];
    const csvRows = [headers.join(",")];

    filteredApplicants.forEach((app) => {
      const dateStr = new Date(app.appliedDate).toLocaleDateString("en-GB");
      const row = [
        `"${(app.fullName || "").replace(/"/g, '""')}"`,
        `"${(app.email || "").replace(/"/g, '""')}"`,
        `"${(app.phone || "").replace(/"/g, '""')}"`,
        `"${(app.experience || "").replace(/"/g, '""')}"`,
        `"${dateStr}"`,
        `"${app.status || "Applied"}"`,
        `"${(app.coverLetter || "").replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `applicants_job_${jobId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pipeline Status Transition
  const handleUpdateStatus = async (appId, status) => {
    try {
      await updateApplicationStatus(appId, status);
      await fetchApplicants();
    } catch (err) {
      console.error("Status update failed:", err);
      alert("Failed to update status.");
    }
  };

  // Notes CRUD
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim() || !selectedApplicant) return;
    try {
      await addNote(selectedApplicant._id, noteContent);
      setNoteContent("");
      await fetchApplicants();
    } catch (err) {
      console.error("Error adding note:", err);
      alert("Failed to add note.");
    }
  };

  const handleStartEditNote = (note) => {
    setEditingNoteId(note._id);
    setEditingNoteContent(note.content);
  };

  const handleSaveEditNote = async (noteId) => {
    if (!editingNoteContent.trim() || !selectedApplicant) return;
    try {
      await editNote(selectedApplicant._id, noteId, editingNoteContent);
      setEditingNoteId(null);
      setEditingNoteContent("");
      await fetchApplicants();
    } catch (err) {
      console.error("Error updating note:", err);
      alert("Failed to update note.");
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?") || !selectedApplicant) return;
    try {
      await deleteNote(selectedApplicant._id, noteId);
      await fetchApplicants();
    } catch (err) {
      console.error("Error deleting note:", err);
      alert("Failed to delete note.");
    }
  };

  // Interview Scheduler
  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!selectedApplicant) return;
    try {
      const interviewData = {
        date: interviewDate,
        time: interviewTime,
        mode: interviewMode,
        meetingLink: interviewMode === "Online" ? interviewLink : "",
        remarks: interviewRemarks,
      };
      await scheduleInterview(selectedApplicant._id, interviewData);
      
      // Clear scheduling fields
      setInterviewDate("");
      setInterviewTime("");
      setInterviewLink("");
      setInterviewRemarks("");
      
      await fetchApplicants();
    } catch (err) {
      console.error("Error scheduling interview:", err);
      alert("Failed to schedule interview.");
    }
  };

  const handleCancelInterview = async () => {
    if (!window.confirm("Are you sure you want to cancel this interview?") || !selectedApplicant) return;
    try {
      await cancelInterview(selectedApplicant._id);
      await fetchApplicants();
    } catch (err) {
      console.error("Error cancelling interview:", err);
      alert("Failed to cancel interview.");
    }
  };

  // Populate interview scheduling fields if edit requested
  const handleLoadInterviewForm = () => {
    if (selectedApplicant?.interview) {
      setInterviewDate(selectedApplicant.interview.date || "");
      setInterviewTime(selectedApplicant.interview.time || "");
      setInterviewMode(selectedApplicant.interview.mode || "Online");
      setInterviewLink(selectedApplicant.interview.meetingLink || "");
      setInterviewRemarks(selectedApplicant.interview.remarks || "");
    }
  };

  if (loading && applicants.length === 0) {
    return (
      <div className="applicants-loading">
        <div className="mini-loader"></div>
        <span>Loading applications...</span>
      </div>
    );
  }

  if (error) {
    return <div className="applicants-error">{error}</div>;
  }

  return (
    <div className="applicants-dashboard">
      {/* Left Column: Candidates List & Filters */}
      <div className="applicants-list-section">
        {/* Search, Filter & CSV Export bar */}
        <div className="applicants-search-filter-bar">
          <input
            type="text"
            placeholder="Search candidates by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="candidate-search-input"
          />

          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={statusOptions}
            placeholder="ALL PIPELINE STAGES"
          />

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredApplicants.length === 0}
            className="export-csv-btn"
            title="Export Filtered Candidates to CSV"
          >
            EXPORT CSV
          </button>
        </div>

        {/* Bulk Actions Header */}
        {selectedIds.length > 0 && (
          <div className="applicants-bulk-actions">
            <span>{selectedIds.length} candidate(s) selected:</span>
            <div className="bulk-buttons-group">
              <button
                type="button"
                className="bulk-btn bulk-shortlist"
                onClick={() => handleBulkStatus("Shortlisted")}
              >
                SHORTLIST
              </button>
              <button
                type="button"
                className="bulk-btn bulk-under-review"
                onClick={() => handleBulkStatus("Under Review")}
              >
                UNDER REVIEW
              </button>
              <button
                type="button"
                className="bulk-btn bulk-reject"
                onClick={() => handleBulkStatus("Rejected")}
              >
                REJECT
              </button>
            </div>
          </div>
        )}

        {/* Select All Checkbox Row */}
        {filteredApplicants.length > 0 && (
          <div className="select-all-row">
            <input
              type="checkbox"
              id="select-all-checkbox"
              onChange={handleSelectAll}
              checked={
                selectedIds.length === filteredApplicants.length
              }
            />
            <label htmlFor="select-all-checkbox">SELECT ALL CANDIDATES</label>
          </div>
        )}

        <div className="applicants-cards-wrapper">
          {applicants.length === 0 ? (
            <div className="applicants-empty">
              <p>No applications received yet for this job position.</p>
            </div>
          ) : filteredApplicants.length === 0 ? (
            <div className="applicants-empty">
              <p>No candidates match the selected filters.</p>
            </div>
          ) : (
            <div className="applicants-list-cards">
              {filteredApplicants.map((app) => (
                <div
                  key={app._id}
                  className={`candidate-card ${
                    selectedApplicant && selectedApplicant._id === app._id ? "active" : ""
                  }`}
                  onClick={() => setSelectedApplicant(app)}
                >
                  <div className="candidate-card-top">
                    <div className="candidate-card-left" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(app._id)}
                        onChange={() => handleSelectApplicant(app._id)}
                      />
                    </div>
                    <div className="candidate-card-profile">
                      <span className="candidate-name">{app.fullName}</span>
                      <span className="candidate-email">{app.email}</span>
                    </div>
                    <span className={`status-badge status-${app.status?.toLowerCase().replace(" ", "-") || "applied"}`}>
                      {app.status || "Applied"}
                    </span>
                  </div>
                  <div className="candidate-card-bottom">
                    <span className="candidate-exp">
                      <strong>Exp:</strong> {app.experience || "0"} Yrs
                    </span>
                    <span className="candidate-date">
                      {new Date(app.appliedDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    <div className="candidate-actions" onClick={(e) => e.stopPropagation()}>
                      {app.resumeName && app.resumeData ? (
                        <a
                          href={app.resumeData}
                          download={app.resumeName}
                          className="candidate-resume-link"
                        >
                          Resume 📄
                        </a>
                      ) : (
                        <span className="no-doc">No Resume</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Candidate Dossier Panel */}
      <div className="applicants-detail-section">
        {selectedApplicant ? (
          <div className="candidate-dossier-card">
            <div className="drawer-header">
              <h4>CANDIDATE DOSSIER</h4>
              <button
                type="button"
                className="drawer-close"
                onClick={() => setSelectedApplicant(null)}
              >
                ✕ UNSELECT
              </button>
            </div>

            <div className="drawer-content">
              <div className="candidate-summary-section">
                <h5>{selectedApplicant.fullName}</h5>
                <p className="summary-meta">
                  <strong>Email:</strong>{" "}
                  <a href={`mailto:${selectedApplicant.email}`}>
                    {selectedApplicant.email}
                  </a>
                </p>
                <p className="summary-meta">
                  <strong>Phone:</strong> {selectedApplicant.phone || "Not set"}
                </p>
                <p className="summary-meta">
                  <strong>Experience:</strong>{" "}
                  {selectedApplicant.experience || "Not specified"}
                </p>
                <p className="summary-meta">
                  <strong>Applied On:</strong>{" "}
                  {new Date(selectedApplicant.appliedDate).toLocaleDateString(
                    "en-US",
                    { dateStyle: "long" }
                  )}
                </p>
                {selectedApplicant.coverLetter && (
                  <div className="cover-letter-box">
                    <h6>COVER LETTER / MESSAGE:</h6>
                    <p>{selectedApplicant.coverLetter}</p>
                  </div>
                )}
              </div>

              {/* Pipeline Workflow Action Grid */}
              <div className="pipeline-action-section">
                <h6>PIPELINE TRANSITION</h6>
                <div className="pipeline-buttons">
                  <button
                    type="button"
                    disabled={selectedApplicant.status === "Under Review"}
                    onClick={() =>
                      handleUpdateStatus(selectedApplicant._id, "Under Review")
                    }
                    className="p-btn p-review"
                  >
                    Under Review
                  </button>
                  <button
                    type="button"
                    disabled={selectedApplicant.status === "Shortlisted"}
                    onClick={() =>
                      handleUpdateStatus(selectedApplicant._id, "Shortlisted")
                    }
                    className="p-btn p-shortlist"
                  >
                    Shortlist
                  </button>
                  <button
                    type="button"
                    disabled={selectedApplicant.status === "Rejected"}
                    onClick={() =>
                      handleUpdateStatus(selectedApplicant._id, "Rejected")
                    }
                    className="p-btn p-reject"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={selectedApplicant.status === "Hired"}
                    onClick={() =>
                      handleUpdateStatus(selectedApplicant._id, "Hired")
                    }
                    className="p-btn p-hire"
                  >
                    Hire
                  </button>
                </div>
              </div>

              {/* Interview Scheduler Form */}
              <div className="interview-scheduler-section">
                <h6>INTERVIEW SCHEDULER</h6>
                {selectedApplicant.interview && selectedApplicant.interview.date ? (
                  <div className="active-interview-info">
                    <div className="interview-badge">SCHEDULED</div>
                    <p>
                      <strong>Date:</strong> {selectedApplicant.interview.date}
                    </p>
                    <p>
                      <strong>Time:</strong> {selectedApplicant.interview.time}
                    </p>
                    <p>
                      <strong>Mode:</strong> {selectedApplicant.interview.mode}
                    </p>
                    {selectedApplicant.interview.mode === "Online" &&
                      selectedApplicant.interview.meetingLink && (
                        <p>
                          <strong>Link:</strong>{" "}
                          <a
                            href={selectedApplicant.interview.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="meeting-anchor"
                          >
                            Join Call
                          </a>
                        </p>
                      )}
                    {selectedApplicant.interview.remarks && (
                      <p>
                        <strong>Remarks:</strong>{" "}
                        {selectedApplicant.interview.remarks}
                      </p>
                    )}
                    <div className="interview-actions">
                      <button
                        type="button"
                        className="sched-action-btn edit-sched"
                        onClick={handleLoadInterviewForm}
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        className="sched-action-btn cancel-sched"
                        onClick={handleCancelInterview}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="no-interview-text">No interview scheduled yet.</p>
                )}

                <form
                  onSubmit={handleScheduleInterview}
                  className="interview-form"
                >
                  <div className="form-row">
                    <div className="form-group-sub">
                      <label>Date:</label>
                      <input
                        type="date"
                        required
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                      />
                    </div>
                    <div className="form-group-sub">
                      <label>Time:</label>
                      <input
                        type="time"
                        required
                        value={interviewTime}
                        onChange={(e) => setInterviewTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group-sub">
                    <label>Mode:</label>
                    <select
                      value={interviewMode}
                      onChange={(e) => setInterviewMode(e.target.value)}
                    >
                      <option value="Online">Online Meeting</option>
                      <option value="Offline">In-Person (Office)</option>
                    </select>
                  </div>

                  {interviewMode === "Online" && (
                    <div className="form-group-sub">
                      <label>Meeting Link:</label>
                      <input
                        type="url"
                        placeholder="https://zoom.us/j/..."
                        value={interviewLink}
                        onChange={(e) => setInterviewLink(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="form-group-sub">
                    <label>Remarks:</label>
                    <textarea
                      rows="2"
                      placeholder="Topics to cover, instructions..."
                      value={interviewRemarks}
                      onChange={(e) => setInterviewRemarks(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="submit-schedule-btn">
                    {selectedApplicant.interview && selectedApplicant.interview.date
                      ? "UPDATE SCHEDULE"
                      : "SCHEDULE & NOTIFY"}
                  </button>
                </form>
              </div>

              {/* Recruiter Notes Board */}
              <div className="recruiter-notes-section">
                <h6>RECRUITER NOTES</h6>
                <form onSubmit={handleAddNote} className="add-note-form">
                  <textarea
                    required
                    placeholder="Add timestamped note for other recruiters..."
                    rows="2"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                  />
                  <button type="submit" className="add-note-btn">
                    ADD NOTE
                  </button>
                </form>

                <div className="notes-list">
                  {selectedApplicant.notes &&
                  selectedApplicant.notes.length > 0 ? (
                    selectedApplicant.notes.map((note) => (
                      <div key={note._id} className="note-card">
                        {editingNoteId === note._id ? (
                          <div className="edit-note-box">
                            <textarea
                              value={editingNoteContent}
                              onChange={(e) =>
                                setEditingNoteContent(e.target.value)
                              }
                              rows="2"
                            />
                            <div className="edit-note-actions">
                              <button
                                type="button"
                                className="save-note-btn"
                                onClick={() => handleSaveEditNote(note._id)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="cancel-note-btn"
                                onClick={() => setEditingNoteId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="note-meta">
                              <span>RECRUITER NOTE</span>
                              <span>
                                {new Date(note.createdAt).toLocaleString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                            <p className="note-text">{note.content}</p>
                            <div className="note-actions">
                              <button
                                type="button"
                                className="note-action-btn edit-note"
                                onClick={() => handleStartEditNote(note)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="note-action-btn delete-note"
                                onClick={() => handleDeleteNote(note._id)}
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="no-notes-text">
                      No internal notes added yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="dossier-placeholder">
            <div className="dossier-placeholder-inner">
              <svg className="dossier-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p>Select a candidate from the left panel to review dossier, scheduler, and recruiter notes.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicantsList;
