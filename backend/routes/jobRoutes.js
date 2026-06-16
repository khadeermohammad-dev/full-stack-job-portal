const express = require("express");
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getDeletedJobs,
  restoreJob,
  permanentDeleteJob,
  applyToJob,
  getJobApplications,
  getAppliedJobIds,
  saveJob,
  unsaveJob,
  getSavedJobs,
  updateJobStatus,
  updateApplicationStatus,
  bulkUpdateApplications,
  addNote,
  editNote,
  deleteNote,
  scheduleInterview,
  cancelInterview,
  getRecruiterAnalytics,
  getRecentActivities,
} = require("../controllers/jobController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// General job fetch & search
router.get("/", getJobs);

// Recruiter Dashboard statistics & activities
router.get("/analytics", protect, getRecruiterAnalytics);
router.get("/activities", protect, getRecentActivities);

// Recycle Bin & Application lists
router.get("/deleted", protect, getDeletedJobs);
router.get("/applied", protect, getAppliedJobIds);
router.get("/saved", protect, getSavedJobs);

// Applicant Pipeline: Bulk operations
router.put("/applications/bulk", protect, bulkUpdateApplications);

// Applicant Pipeline: Candidate status update
router.put("/applications/:appId/status", protect, updateApplicationStatus);

// Applicant Pipeline: Recruiter Notes
router.post("/applications/:appId/notes", protect, addNote);
router.put("/applications/:appId/notes/:noteId", protect, editNote);
router.delete("/applications/:appId/notes/:noteId", protect, deleteNote);

// Applicant Pipeline: Interview Scheduler
router.post("/applications/:appId/interview", protect, scheduleInterview);
router.delete("/applications/:appId/interview", protect, cancelInterview);

// Single Job Operations (order matters: specific status route before general ID parameters)
router.put("/:id/status", protect, updateJobStatus);

router.get("/:id", getJobById);
router.post("/", protect, createJob);
router.put("/:id", protect, updateJob);
router.delete("/:id", protect, deleteJob);

router.put("/:id/restore", protect, restoreJob);
router.delete("/:id/permanent", protect, permanentDeleteJob);

router.post("/:id/apply", protect, applyToJob);
router.get("/:id/applications", protect, getJobApplications);

router.post("/:id/save", protect, saveJob);
router.delete("/:id/save", protect, unsaveJob);

module.exports = router;
