/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import CustomSelect from "./CustomSelect";

function JobForm({ onAddJob, editingJob, onUpdateJob, onCancelEdit }) {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    salary: "",
    jobType: "Full Time",
    description: "",
  });

  useEffect(() => {
    if (editingJob) {
      setFormData({
        title: editingJob.title || "",
        company: editingJob.company || "",
        location: editingJob.location || "",
        salary: editingJob.salary || "",
        jobType: editingJob.jobType || "Full Time",
        description: editingJob.description || "",
      });
    }
  }, [editingJob]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      company: "",
      location: "",
      salary: "",
      jobType: "Full Time",
      description: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingJob) {
      onUpdateJob(editingJob._id, formData);
    } else {
      onAddJob(formData);
    }

    resetForm();
  };

  return (
    <form className="job-form" onSubmit={handleSubmit}>
      <h2>{editingJob ? "Update Job" : "Post a New Job"}</h2>

      <input
        type="text"
        name="title"
        placeholder="Job Title"
        value={formData.title}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="company"
        placeholder="Company Name"
        value={formData.company}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="location"
        placeholder="Location"
        value={formData.location}
        onChange={handleChange}
        required
      />
      
      <div className="form-row-split">
        <input
          type="number"
          name="salary"
          placeholder="Salary"
          value={formData.salary}
          onChange={handleChange}
          required
        />
        <CustomSelect
          value={formData.jobType}
          onChange={(val) => setFormData({ ...formData, jobType: val })}
          options={[
            { value: "Full Time", label: "Full Time" },
            { value: "Part Time", label: "Part Time" },
            { value: "Contract", label: "Contract" }
          ]}
          placeholder="Full Time"
        />
      </div>

      <textarea
        name="description"
        placeholder="Job Description"
        value={formData.description}
        onChange={handleChange}
        required
      />

      <div className="form-actions">
        <button type="submit">{editingJob ? "Update Job" : "Add Job"}</button>

        {editingJob && (
          <button type="button" className="cancel-btn" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default JobForm;
