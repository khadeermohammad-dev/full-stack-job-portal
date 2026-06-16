const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    experience: {
      type: String,
      required: false,
    },
    coverLetter: {
      type: String,
      required: false,
    },
    resumeName: {
      type: String,
      required: false,
    },
    resumeData: {
      type: String,
      required: false,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appliedDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Applied", "Under Review", "Shortlisted", "Interview Scheduled", "Rejected", "Hired"],
      default: "Applied",
    },
    notes: [
      {
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    interview: {
      date: { type: String },
      time: { type: String },
      mode: { type: String, enum: ["Online", "Offline"] },
      meetingLink: { type: String },
      remarks: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Application", applicationSchema);
