import React, { useState, useEffect } from "react";
import { getJobApplications } from "../services/api";

const ApplicantsList = ({ jobId }) => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchApplicants = async () => {
      if (!jobId) return;
      setLoading(true);
      setError("");
      try {
        const res = await getJobApplications(jobId);
        setApplicants(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch applications.");
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [jobId]);

  if (loading) {
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
    <div className="applicants-container">
      <h3>CANDIDATE APPLICATIONS ({applicants.length})</h3>
      
      {applicants.length === 0 ? (
        <div className="applicants-empty">
          <p>No applications received yet for this job position.</p>
        </div>
      ) : (
        <div className="applicants-table-wrapper">
          <table className="applicants-table">
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Contact Details</th>
                <th>Experience</th>
                <th>Message</th>
                <th>Resume</th>
                <th>Applied Date</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((app) => (
                <tr key={app._id}>
                  <td className="candidate-name">{app.fullName}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <a href={`mailto:${app.email}`} className="candidate-email-link">
                        {app.email}
                      </a>
                      <span style={{ fontSize: "10px", color: "#888" }}>{app.phone}</span>
                    </div>
                  </td>
                  <td>{app.experience || "Not specified"}</td>
                  <td style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={app.coverLetter}>
                    {app.coverLetter || "None"}
                  </td>
                  <td>
                    {app.resumeName && app.resumeData ? (
                      <a
                        href={app.resumeData}
                        download={app.resumeName}
                        className="candidate-email-link"
                        style={{ fontWeight: "bold", textDecoration: "underline" }}
                      >
                        Resume
                      </a>
                    ) : (
                      <span style={{ color: "#666" }}>None</span>
                    )}
                  </td>
                  <td className="applied-date">
                    {new Date(app.appliedDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ApplicantsList;
