const mongoose = require("mongoose");

const savedJobSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    savedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate saves for the same candidate and job
savedJobSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model("SavedJob", savedJobSchema);
