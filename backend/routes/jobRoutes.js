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
} = require("../controllers/jobController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", getJobs);
router.get("/deleted", protect, getDeletedJobs);
router.get("/applied", protect, getAppliedJobIds);
router.get("/saved", protect, getSavedJobs);
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
