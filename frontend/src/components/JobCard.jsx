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

function JobCard({ job, onDeleteJob, onEditJob }) {
  return (
    <div className="job-card">
      <div>
        <h3>{job.title}</h3>
        <p className="company">{job.company}</p>
      </div>

      <p>
        <strong>Location:</strong> {job.location}
      </p>
      <p>
        <strong>Salary:</strong> {formatSalary(job.salary)}
      </p>
      <p className="description">{job.description}</p>
      
      <div className="card-actions">
        <button className="edit-btn" onClick={() => onEditJob(job)}>
          Edit
        </button>

        <button className="delete-btn" onClick={() => onDeleteJob(job._id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default JobCard;
