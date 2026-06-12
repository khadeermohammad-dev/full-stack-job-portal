const Job = require("../models/Job");
const Application = require("../models/Application");
const SavedJob = require("../models/SavedJob");

// Get all active jobs (with search, filter, pagination, & sorting)
const getJobs = async (req, res) => {
  try {
    const { search, location, minSalary, jobType, page, limit, sortBy, sortOrder } = req.query;
    let query = { isDeleted: { $ne: true } };

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
};
