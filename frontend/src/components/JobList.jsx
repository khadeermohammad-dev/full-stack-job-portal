import JobCard from "./JobCard";

function JobList({ jobs, onDeleteJob, onEditJob }) {
  return (
    <div className="job-list">
      {jobs.length === 0 ? (
        <p className="empty-text">No jobs available</p>
      ) : (
        jobs.map((job) => (
          <JobCard
            key={job._id}
            job={job}
            onDeleteJob={onDeleteJob}
            onEditJob={onEditJob}
          />
        ))
      )}
    </div>
  );
}

export default JobList;
