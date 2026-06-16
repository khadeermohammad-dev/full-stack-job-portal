const Job = require("../models/Job");
const Application = require("../models/Application");
const SavedJob = require("../models/SavedJob");
const ActivityLog = require("../models/ActivityLog");

// Get all active jobs (with search, filter, pagination, & sorting)
const getJobs = async (req, res) => {
  try {
    const { search, location, minSalary, jobType, page, limit, sortBy, sortOrder, showClosed } = req.query;
    let query = { isDeleted: { $ne: true } };

    // If showClosed is not true, filter out Closed status jobs
    if (showClosed !== "true") {
      query.status = { $ne: "Closed" };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    if (minSalary) {
      query.salary = { $gte: Number(minSalary) };
    }

    if (jobType) {
      query.jobType = jobType;
    }

    // Dynamic sorting
    let sortOptions = {};
    if (sortBy) {
      const order = sortOrder === "desc" ? -1 : 1;
      sortOptions[sortBy] = order;
    } else {
      sortOptions.createdAt = -1; // Default: newest first
    }

    // Pagination
    const pageNum = page ? parseInt(page) : null;
    const limitNum = limit ? parseInt(limit) : null;

    let jobs;
    let totalJobs = 0;
    let totalPages = 1;

    if (pageNum && limitNum) {
      const skip = (pageNum - 1) * limitNum;
      totalJobs = await Job.countDocuments(query);
      jobs = await Job.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum);
      totalPages = Math.ceil(totalJobs / limitNum);
    } else {
      jobs = await Job.find(query).sort(sortOptions);
      totalJobs = jobs.length;
    }

    res.status(200).json({
      jobs,
      totalJobs,
      currentPage: pageNum || 1,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Error fetching jobs" });
  }
};

// Get single job
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job || job.isDeleted) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ message: "Error fetching job" });
  }
};

// Create job (associated with recruiter if logged in)
const createJob = async (req, res) => {
  try {
    const { title, company, location, salary, description, jobType } = req.body;

    if (!title || !company || !location || !salary || !description || !jobType) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const job = await Job.create({
      title,
      company,
      location,
      salary,
      description,
      jobType,
      recruiterId: req.user ? req.user._id : null,
    });

    // Record activity log
    if (req.user) {
      await ActivityLog.create({
        recruiterId: req.user._id,
        message: `Posted a new job listing: "${title}" at "${company}"`,
      });
    }

    res.status(201).json(job);
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ message: "Error creating job" });
  }
};

// Update job
const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.recruiterId && req.user && job.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this job" });
    }

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updatedJob);
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ message: "Error updating job" });
  }
};

// Soft delete job (marks isDeleted: true)
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.recruiterId && req.user && job.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this job" });
    }

    job.isDeleted = true;
    job.deletedAt = new Date();
    await job.save();

    // Record activity log
    if (req.user) {
      await ActivityLog.create({
        recruiterId: req.user._id,
        message: `Moved job listing "${job.title}" to Recycle Bin`,
      });
    }

    res.status(200).json({ message: "Job moved to Recycle Bin" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ message: "Error deleting job" });
  }
};

// Get all soft-deleted jobs (for logged-in recruiter)
const getDeletedJobs = async (req, res) => {
  try {
    const query = { isDeleted: true };
    if (req.user) {
      query.recruiterId = req.user._id;
    }
    const jobs = await Job.find(query).sort({ deletedAt: -1 });
    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error fetching deleted jobs:", error);
    res.status(500).json({ message: "Error fetching deleted jobs" });
  }
};

// Restore a soft-deleted job
const restoreJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.recruiterId && req.user && job.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to restore this job" });
    }

    job.isDeleted = false;
    job.deletedAt = null;
    await job.save();

    // Record activity log
    if (req.user) {
      await ActivityLog.create({
        recruiterId: req.user._id,
        message: `Restored job listing "${job.title}" from Recycle Bin`,
      });
    }

    res.status(200).json(job);
  } catch (error) {
    console.error("Error restoring job:", error);
    res.status(500).json({ message: "Error restoring job" });
  }
};

// Permanently delete a job
const permanentDeleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.recruiterId && req.user && job.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to permanently delete this job" });
    }

    await Job.findByIdAndDelete(req.params.id);
    // Remove all applications associated with this job
    await Application.deleteMany({ jobId: req.params.id });

    res.status(200).json({ message: "Job permanently deleted" });
  } catch (error) {
    console.error("Error permanently deleting job:", error);
    res.status(500).json({ message: "Error permanently deleting job" });
  }
};

// Apply to a job
const applyToJob = async (req, res) => {
  try {
    let { fullName, email, phone, experience, coverLetter, resumeName, resumeData } = req.body;
    const jobId = req.params.id;

    // If no resume is uploaded/provided, require contact details
    if (!resumeName && (!fullName || !email || !phone)) {
      return res.status(400).json({ message: "Please fill in all details or upload a resume." });
    }

    // Default missing fields from user profile if applicant is logged in
    if (req.user) {
      if (!fullName) fullName = req.user.fullName || "Anonymous Applicant";
      if (!email) email = req.user.email;
      if (!phone) phone = req.user.phone || "Not set";
    }

    const job = await Job.findById(jobId);
    if (!job || job.isDeleted) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if job is closed
    if (job.status === "Closed") {
      return res.status(400).json({ message: "This job is closed and no longer accepting applications" });
    }

    // Check if user has already applied
    if (req.user) {
      const alreadyApplied = await Application.findOne({ jobId, applicantId: req.user._id });
      if (alreadyApplied) {
        return res.status(400).json({ message: "You have already applied for this job" });
      }
    }

    const application = await Application.create({
      fullName,
      email,
      phone,
      experience,
      coverLetter,
      resumeName,
      resumeData,
      jobId,
      applicantId: req.user ? req.user._id : null,
    });

    res.status(201).json(application);
  } catch (error) {
    console.error("Error applying to job:", error);
    res.status(500).json({ message: "Error applying to job" });
  }
};

// Get applications for a job (recruiter only)
const getJobApplications = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.recruiterId && req.user && job.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view applications" });
    }

    const applications = await Application.find({ jobId }).sort({ appliedDate: -1 });
    res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ message: "Error fetching applications" });
  }
};

// Get applied job IDs for applicant
const getAppliedJobIds = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    const applications = await Application.find({ applicantId: req.user._id }).select("jobId");
    const jobIds = applications.map(app => app.jobId);
    res.status(200).json(jobIds);
  } catch (error) {
    console.error("Error fetching applied job IDs:", error);
    res.status(500).json({ message: "Error fetching applied jobs" });
  }
};

// Save a job
const saveJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const candidateId = req.user._id;

    const job = await Job.findById(jobId);
    if (!job || job.isDeleted) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if already saved
    const alreadySaved = await SavedJob.findOne({ candidateId, jobId });
    if (alreadySaved) {
      return res.status(400).json({ message: "Job already saved" });
    }

    const savedJob = await SavedJob.create({ candidateId, jobId });
    res.status(201).json(savedJob);
  } catch (error) {
    console.error("Error saving job:", error);
    res.status(500).json({ message: "Error saving job" });
  }
};

// Unsave a job
const unsaveJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const candidateId = req.user._id;

    const result = await SavedJob.findOneAndDelete({ candidateId, jobId });
    if (!result) {
      return res.status(404).json({ message: "Saved job relation not found" });
    }

    res.status(200).json({ message: "Job unsaved successfully" });
  } catch (error) {
    console.error("Error unsaving job:", error);
    res.status(500).json({ message: "Error unsaving job" });
  }
};

// Get all saved jobs for candidate
const getSavedJobs = async (req, res) => {
  try {
    const candidateId = req.user._id;
    
    // Find all saved jobs and populate job details
    const savedJobs = await SavedJob.find({ candidateId }).populate("jobId");
    
    // Filter out deleted jobs or missing relations
    const activeSavedJobs = savedJobs
      .filter((item) => item.jobId && !item.jobId.isDeleted)
      .map((item) => item.jobId);

    res.status(200).json(activeSavedJobs);
  } catch (error) {
    console.error("Error fetching saved jobs:", error);
    res.status(500).json({ message: "Error fetching saved jobs" });
  }
};

// Toggle / Update Job Status (Open/Closed)
const updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Open", "Closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.recruiterId && req.user && job.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this job status" });
    }

    const oldStatus = job.status || "Open";
    job.status = status;
    await job.save();

    // Record activity log
    if (req.user) {
      await ActivityLog.create({
        recruiterId: req.user._id,
        message: `Changed job status of "${job.title}" from "${oldStatus}" to "${status}"`,
      });
    }

    res.status(200).json(job);
  } catch (error) {
    console.error("Error updating job status:", error);
    res.status(500).json({ message: "Error updating job status" });
  }
};

// Update Application status in pipeline
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { appId } = req.params;

    const validStatuses = ["Applied", "Under Review", "Shortlisted", "Interview Scheduled", "Rejected", "Hired"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const application = await Application.findById(appId).populate("jobId");
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Verify authorized recruiter
    if (application.jobId && application.jobId.recruiterId && req.user && application.jobId.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update application status" });
    }

    const oldStatus = application.status || "Applied";
    application.status = status;
    await application.save();

    // Log activity
    if (req.user) {
      await ActivityLog.create({
        recruiterId: req.user._id,
        message: `Updated status of applicant "${application.fullName || 'Candidate'}" for "${application.jobId.title}" to "${status}"`,
      });
    }

    res.status(200).json(application);
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ message: "Error updating application status" });
  }
};

// Bulk update application statuses
const bulkUpdateApplications = async (req, res) => {
  try {
    const { applicationIds, status } = req.body;
    const validStatuses = ["Applied", "Under Review", "Shortlisted", "Interview Scheduled", "Rejected", "Hired"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ message: "Application IDs array is required" });
    }

    // Find applications and ensure they belong to jobs posted by this recruiter
    const applications = await Application.find({ _id: { $in: applicationIds } }).populate("jobId");
    
    const authorizedApps = [];
    for (const app of applications) {
      if (!app.jobId) continue;
      if (req.user && app.jobId.recruiterId && app.jobId.recruiterId.toString() !== req.user._id.toString()) {
        continue;
      }
      authorizedApps.push(app);
    }

    if (authorizedApps.length === 0) {
      return res.status(403).json({ message: "No authorized applications found for status update" });
    }

    const authIds = authorizedApps.map(app => app._id);
    await Application.updateMany({ _id: { $in: authIds } }, { $set: { status } });

    // Log bulk activity
    if (req.user) {
      await ActivityLog.create({
        recruiterId: req.user._id,
        message: `Bulk updated status of ${authorizedApps.length} applicants to "${status}"`,
      });
    }

    res.status(200).json({ message: `Successfully updated ${authorizedApps.length} applications to "${status}"`, updatedCount: authorizedApps.length });
  } catch (error) {
    console.error("Error in bulk update applications:", error);
    res.status(500).json({ message: "Error in bulk status update" });
  }
};

// Recruiter notes: add note
const addNote = async (req, res) => {
  try {
    const { appId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Note content is required" });
    }

    const application = await Application.findById(appId).populate("jobId");
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Verify authorized recruiter
    if (application.jobId && application.jobId.recruiterId && req.user && application.jobId.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to manage notes" });
    }

    application.notes.push({ content });
    await application.save();

    res.status(201).json(application);
  } catch (error) {
    console.error("Error adding note:", error);
    res.status(500).json({ message: "Error adding note" });
  }
};

// Recruiter notes: edit note
const editNote = async (req, res) => {
  try {
    const { appId, noteId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Note content is required" });
    }

    const application = await Application.findById(appId).populate("jobId");
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Verify authorized recruiter
    if (application.jobId && application.jobId.recruiterId && req.user && application.jobId.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to manage notes" });
    }

    const note = application.notes.id(noteId);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    note.content = content;
    await application.save();

    res.status(200).json(application);
  } catch (error) {
    console.error("Error editing note:", error);
    res.status(500).json({ message: "Error editing note" });
  }
};

// Recruiter notes: delete note
const deleteNote = async (req, res) => {
  try {
    const { appId, noteId } = req.params;

    const application = await Application.findById(appId).populate("jobId");
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Verify authorized recruiter
    if (application.jobId && application.jobId.recruiterId && req.user && application.jobId.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to manage notes" });
    }

    application.notes.pull(noteId);
    await application.save();

    res.status(200).json(application);
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ message: "Error deleting note" });
  }
};

// Interview scheduler: schedule or update interview
const scheduleInterview = async (req, res) => {
  try {
    const { appId } = req.params;
    const { date, time, mode, meetingLink, remarks } = req.body;

    if (!date || !time || !mode) {
      return res.status(400).json({ message: "Date, time, and mode are required" });
    }

    const application = await Application.findById(appId).populate("jobId");
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Verify authorized recruiter
    if (application.jobId && application.jobId.recruiterId && req.user && application.jobId.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to schedule interviews" });
    }

    application.interview = { date, time, mode, meetingLink, remarks };
    
    // Auto-advance candidate to Interview Scheduled
    const oldStatus = application.status || "Applied";
    application.status = "Interview Scheduled";
    await application.save();

    // Log activity
    if (req.user) {
      await ActivityLog.create({
        recruiterId: req.user._id,
        message: `Scheduled interview for "${application.fullName || 'Candidate'}" on ${date} at ${time}. Auto-advanced status from "${oldStatus}" to "Interview Scheduled"`,
      });
    }

    res.status(200).json(application);
  } catch (error) {
    console.error("Error scheduling interview:", error);
    res.status(500).json({ message: "Error scheduling interview" });
  }
};

// Interview scheduler: cancel interview
const cancelInterview = async (req, res) => {
  try {
    const { appId } = req.params;

    const application = await Application.findById(appId).populate("jobId");
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Verify authorized recruiter
    if (application.jobId && application.jobId.recruiterId && req.user && application.jobId.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel interviews" });
    }

    application.interview = undefined;
    
    // Revert status to Shortlisted if it was Interview Scheduled
    if (application.status === "Interview Scheduled") {
      application.status = "Shortlisted";
    }
    
    await application.save();

    // Log activity
    if (req.user) {
      await ActivityLog.create({
        recruiterId: req.user._id,
        message: `Cancelled interview for "${application.fullName || 'Candidate'}"`,
      });
    }

    res.status(200).json(application);
  } catch (error) {
    console.error("Error cancelling interview:", error);
    res.status(500).json({ message: "Error cancelling interview" });
  }
};

// Recruiter Analytics dashboard metrics
const getRecruiterAnalytics = async (req, res) => {
  try {
    const recruiterId = req.user ? req.user._id : null;
    if (!recruiterId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // 1. Get all jobs posted by this recruiter
    const recruiterJobs = await Job.find({ recruiterId, isDeleted: { $ne: true } });
    const jobIds = recruiterJobs.map(job => job._id);

    const totalJobs = recruiterJobs.length;
    const activeJobs = recruiterJobs.filter(job => job.status === "Open" || !job.status).length;
    const closedJobs = recruiterJobs.filter(job => job.status === "Closed").length;

    // 2. Get applications for these jobs
    const applications = await Application.find({ jobId: { $in: jobIds } }).populate("jobId");
    const totalApplications = applications.length;

    // 3. Shortlisted candidates (specifically in 'Shortlisted' status)
    const shortlistedCandidates = applications.filter(app => app.status === "Shortlisted").length;

    // 4. Number of applications per job
    const appCountPerJobMap = {};
    recruiterJobs.forEach(job => {
      appCountPerJobMap[job._id.toString()] = {
        title: job.title,
        company: job.company,
        count: 0
      };
    });

    applications.forEach(app => {
      const jobIdStr = app.jobId ? app.jobId._id.toString() : null;
      if (jobIdStr && appCountPerJobMap[jobIdStr]) {
        appCountPerJobMap[jobIdStr].count++;
      }
    });

    const applicationsPerJob = Object.values(appCountPerJobMap);

    // 5. Top Performing Job
    let topPerformingJob = null;
    let maxApps = -1;
    applicationsPerJob.forEach(jobData => {
      if (jobData.count > maxApps) {
        maxApps = jobData.count;
        topPerformingJob = jobData;
      }
    });
    if (maxApps === 0) {
      topPerformingJob = recruiterJobs.length > 0 ? { title: recruiterJobs[0].title, count: 0 } : null;
    }

    // 6. Funnel stages
    const funnelStages = {
      "Applied": 0,
      "Under Review": 0,
      "Shortlisted": 0,
      "Interview Scheduled": 0,
      "Rejected": 0,
      "Hired": 0
    };

    applications.forEach(app => {
      const status = app.status || "Applied";
      if (funnelStages[status] !== undefined) {
        funnelStages[status]++;
      } else {
        funnelStages["Applied"]++;
      }
    });

    res.status(200).json({
      totalJobs,
      activeJobs,
      closedJobs,
      totalApplications,
      shortlistedCandidates,
      applicationsPerJob,
      topPerformingJob,
      funnelStages
    });
  } catch (error) {
    console.error("Error fetching recruiter analytics:", error);
    res.status(500).json({ message: "Error fetching analytics data" });
  }
};

// Recent recruiter activities log feed
const getRecentActivities = async (req, res) => {
  try {
    const recruiterId = req.user ? req.user._id : null;
    if (!recruiterId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const activities = await ActivityLog.find({ recruiterId })
      .sort({ timestamp: -1 })
      .limit(10);

    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res.status(500).json({ message: "Error fetching activities" });
  }
};

module.exports = {
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
};
