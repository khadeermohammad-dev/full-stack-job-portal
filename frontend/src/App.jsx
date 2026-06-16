/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import JobForm from "./components/JobForm";
import JobDetails from "./components/JobDetails";
import LocationGenerator from "./components/LocationGenerator";
import CustomSelect from "./components/CustomSelect";
import Auth from "./components/Auth";
import Onboarding from "./components/Onboarding";
import ProfileCard from "./components/ProfileCard";
import RecycleBin from "./components/RecycleBin";
import ApplyModal from "./components/ApplyModal";
import ApplicantsList from "./components/ApplicantsList";
import {
  createJob,
  deleteJob,
  getJobs,
  updateJob,
  getMe,
  getAppliedJobIds,
  getSavedJobs,
  saveJob,
  unsaveJob,
  updateJobStatus,
  getRecruiterAnalytics,
  getRecentActivities
} from "./services/api";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  
  // Pagination & Sorting states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(5);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [savedJobs, setSavedJobs] = useState([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [showAppliedOnly, setShowAppliedOnly] = useState(false);
  
  const [editingJob, setEditingJob] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [search, setSearch] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterSalary, setFilterSalary] = useState("");
  const [filterJobType, setFilterJobType] = useState("");
  
  const [time, setTime] = useState(new Date());
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  
  const [stars, setStars] = useState([]);
  const [fallingStars, setFallingStars] = useState([]);

  // Recruiter Dashboard specific states
  const [recruiterTab, setRecruiterTab] = useState("overview"); // "overview", "jobs", "post"
  const [analytics, setAnalytics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [activeApplicantsJob, setActiveApplicantsJob] = useState(null);

  // Verify Auth on Mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("hirespace_token");
      if (token) {
        try {
          const res = await getMe();
          setUser(res.data);
        } catch (err) {
          console.error("Session token validation failed:", err);
          localStorage.removeItem("hirespace_token");
        }
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  // Sync jobs & applications once logged in and onboarded
  useEffect(() => {
    if (user && user.role) {
      fetchJobs();
      if (user.role === "applicant") {
        fetchAppliedJobs();
        fetchSavedJobs();
      } else if (user.role === "recruiter") {
        fetchAnalyticsAndActivities();
      }
    }
  }, [user]);

  // Re-fetch jobs when candidate filters, page, sorting, or filter mode changes
  useEffect(() => {
    if (user && user.role === "applicant") {
      fetchJobs();
    }
  }, [search, filterLocation, filterSalary, filterJobType, page, sortBy, sortOrder, showSavedOnly, showAppliedOnly]);

  // Re-fetch analytics when recruiter switches to overview
  useEffect(() => {
    if (user && user.role === "recruiter" && recruiterTab === "overview") {
      fetchAnalyticsAndActivities();
    }
  }, [recruiterTab]);

  // Update browser tab name dynamically based on user role
  useEffect(() => {
    if (user && user.role) {
      if (user.role === "recruiter") {
        document.title = "HireSpace - Recruiter ATS";
      } else if (user.role === "applicant") {
        document.title = "HireSpace - Applicant";
      } else {
        document.title = "HireSpace";
      }
    } else {
      document.title = "HireSpace";
    }
  }, [user]);

  // Live Date/Clock Updates
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    const hrs = String(date.getHours()).padStart(2, "0");
    const mins = String(date.getMinutes()).padStart(2, "0");
    const secs = String(date.getSeconds()).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}:${month}:${year}`;
  };

  const fetchJobs = async () => {
    try {
      const params = {
        search,
        location: filterLocation,
        minSalary: filterSalary,
        jobType: filterJobType
      };

      if (user) {
        if (user.role === "applicant") {
          // Only paginate when in "all" jobs mode (both showSavedOnly and showAppliedOnly are false)
          if (!showSavedOnly && !showAppliedOnly) {
            params.page = page;
            params.limit = limit;
          }
          params.sortBy = sortBy;
          params.sortOrder = sortOrder;
        } else if (user.role === "recruiter") {
          params.showClosed = "true"; // Recruiter retrieves both Open & Closed
        }
      }

      const response = await getJobs(params);
      if (response.data && response.data.jobs) {
        setJobs(response.data.jobs);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setJobs(Array.isArray(response.data) ? response.data : []);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  };

  const fetchAppliedJobs = async () => {
    try {
      const res = await getAppliedJobIds();
      setAppliedJobIds(res.data);
    } catch (err) {
      console.error("Error fetching applied jobs list:", err);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const response = await getSavedJobs();
      setSavedJobs(response.data || []);
    } catch (err) {
      console.error("Error fetching saved jobs:", err);
    }
  };

  const fetchAnalyticsAndActivities = async () => {
    setDashboardLoading(true);
    try {
      const [analyticsRes, activitiesRes] = await Promise.all([
        getRecruiterAnalytics(),
        getRecentActivities()
      ]);
      setAnalytics(analyticsRes.data);
      setActivities(activitiesRes.data || []);
    } catch (err) {
      console.error("Error fetching recruiter analytics:", err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleToggleSaveJob = async (jobId) => {
    try {
      const isAlreadySaved = savedJobs.some((j) => j._id === jobId);
      if (isAlreadySaved) {
        await unsaveJob(jobId);
      } else {
        await saveJob(jobId);
      }
      await fetchSavedJobs();
    } catch (err) {
      console.error("Error toggling save state for job:", err);
    }
  };

  const handleToggleJobStatus = async (jobId, currentStatus) => {
    const newStatus = currentStatus === "Closed" ? "Open" : "Closed";
    try {
      await updateJobStatus(jobId, newStatus);
      await fetchJobs();
      if (selectedJob && selectedJob._id === jobId) {
        setSelectedJob((prev) => ({ ...prev, status: newStatus }));
      }
      fetchAnalyticsAndActivities();
    } catch (err) {
      console.error("Error toggling job status:", err);
    }
  };

  // Background stars layout
  useEffect(() => {
    const generatedStars = [];
    for (let i = 0; i < 40; i++) {
      generatedStars.push({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 50}%`,
        size: `${Math.random() * 2.5 + 1}px`,
        delay: `${Math.random() * 4}s`,
        duration: `${Math.random() * 3 + 2}s`
      });
    }
    setStars(generatedStars);
  }, []);

  // Falling stars physics
  useEffect(() => {
    const triggerFallingStar = () => {
      const id = Date.now();
      const startX = Math.random() * 100;
      const startY = Math.random() * 40;
      
      setFallingStars((prev) => [...prev, { id, startX, startY }]);
      
      setTimeout(() => {
        setFallingStars((prev) => prev.filter((s) => s.id !== id));
      }, 1400);

      const nextDelay = Math.random() * 4000 + 3500;
      timerId = setTimeout(triggerFallingStar, nextDelay);
    };

    let timerId = setTimeout(triggerFallingStar, 3000);
    return () => clearTimeout(timerId);
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleOnboardingComplete = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("hirespace_token");
    setUser(null);
    setJobs([]);
    setAppliedJobIds([]);
    setSelectedJob(null);
    setEditingJob(null);
  };

  const handleAddJob = async (jobData) => {
    try {
      await createJob(jobData);
      setRecruiterTab("jobs");
      fetchJobs();
    } catch (err) {
      console.error("Error posting job:", err);
    }
  };

  const handleDeleteJob = async (id) => {
    try {
      await deleteJob(id);
      if (selectedJob && selectedJob._id === id) {
        setSelectedJob(null);
      }
      fetchJobs();
      fetchAnalyticsAndActivities();
    } catch (err) {
      console.error("Error soft-deleting job:", err);
    }
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setRecruiterTab("post");
  };

  const handleUpdateJob = async (id, jobData) => {
    try {
      await updateJob(id, jobData);
      setEditingJob(null);
      if (selectedJob && selectedJob._id === id) {
        setSelectedJob({ ...selectedJob, ...jobData });
      }
      setRecruiterTab("jobs");
      fetchJobs();
    } catch (err) {
      console.error("Error updating job:", err);
    }
  };

  const handleCancelEdit = () => {
    setEditingJob(null);
    setRecruiterTab("jobs");
  };

  const handleGenerateLocationJobs = async (mockJobs, detectedLocation) => {
    try {
      for (const jobData of mockJobs) {
        await createJob(jobData);
      }
      await fetchJobs();
      setSearch(detectedLocation);
    } catch (err) {
      console.error("Error saving generated jobs:", err);
    }
  };

  const handleApplySuccess = () => {
    if (selectedJob) {
      setAppliedJobIds((prev) => [...prev, selectedJob._id]);
    }
    setIsApplyOpen(false);
  };

  const getRelativeTime = (dateInput) => {
    if (!dateInput) return "Unknown";
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Auth Routing Check
  if (!authChecked) {
    return (
      <div className="app-loading-screen">
        <div className="cosmic-spinner"></div>
        <p>CONNECTING TO THE COSMIC DATABASE...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app">
        {/* Twinkling background */}
        <div className="stars-container">
          {stars.map((star) => (
            <div
              key={star.id}
              className="star"
              style={{
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
                animationDelay: star.delay,
                animationDuration: star.duration
              }}
            />
          ))}
        </div>
        <Auth onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  if (user && !user.role) {
    return (
      <div className="app">
        <div className="stars-container">
          {stars.map((star) => (
            <div
              key={star.id}
              className="star"
              style={{
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
                animationDelay: star.delay,
                animationDuration: star.duration
              }}
            />
          ))}
        </div>
        <Onboarding user={user} onOnboardingComplete={handleOnboardingComplete} />
      </div>
    );
  }

  // Active user role checking
  const isRecruiter = user.role === "recruiter";

  // Filter jobs based on active role context
  let displayJobs = jobs;
  if (user && user.role === "applicant") {
    if (showSavedOnly && showAppliedOnly) {
      // Changed to OR (||) based on requirement #4: show saved OR applied jobs
      const savedIds = savedJobs.map((j) => j._id);
      displayJobs = jobs.filter((j) => savedIds.includes(j._id) || appliedJobIds.includes(j._id));
    } else if (showSavedOnly) {
      displayJobs = savedJobs;
    } else if (showAppliedOnly) {
      displayJobs = jobs.filter((j) => appliedJobIds.includes(j._id));
    }
  } else if (isRecruiter) {
    displayJobs = jobs.filter((j) => j.recruiterId === user._id && !j.isDeleted);
  } else {
    displayJobs = jobs.filter((j) => !j.isDeleted);
  }

  const filteredJobs = displayJobs.filter((job) => {
    const matchesSearch = `${job.title} ${job.company} ${job.location}`
      .toLowerCase()
      .includes(search.toLowerCase());
      
    const matchesLocation = filterLocation ? job.location === filterLocation : true;
    const matchesJobType = filterJobType ? job.jobType === filterJobType : true;
    
    let matchesSalary = true;
    if (filterSalary) {
      const [minVal, maxVal] = filterSalary.split("-").map(Number);
      const sal = Number(job.salary);
      if (maxVal) {
        matchesSalary = sal >= minVal && sal <= maxVal;
      } else {
        matchesSalary = sal >= minVal;
      }
    }
    
    return matchesSearch && matchesLocation && matchesSalary && matchesJobType;
  });

  const uniqueLocations = Array.from(new Set(displayJobs.map((job) => job.location))).filter(Boolean);

  const locationOptions = [
    { value: "", label: "ALL LOCATIONS" },
    ...uniqueLocations.map((loc) => ({
      value: loc,
      label: loc.toUpperCase()
    }))
  ];

  const salaryOptions = [
    { value: "", label: "ALL SALARIES" },
    { value: "0-300000", label: "$0 - $300K" },
    { value: "300000-600000", label: "$300K - $600K" },
    { value: "600000-1200000", label: "$600K - $1.2M" },
    { value: "1200000-1800000", label: "$1.2M - $1.8M" },
    { value: "1800000-99999999", label: "$1.8M+" }
  ];

  const jobTypeOptions = [
    { value: "", label: "ALL JOB TYPES" },
    { value: "Full Time", label: "FULL TIME" },
    { value: "Part Time", label: "PART TIME" },
    { value: "Contract", label: "CONTRACT" }
  ];

  // Recruiter Dashboard statistics data
  const funnelStages = analytics?.funnelStages || {
    "Applied": 0,
    "Under Review": 0,
    "Shortlisted": 0,
    "Interview Scheduled": 0,
    "Rejected": 0,
    "Hired": 0
  };

  const funnelItems = [
    { label: "Applied", count: funnelStages.Applied, color: "#3a86f0", width: "100%" },
    { label: "Under Review", count: funnelStages["Under Review"], color: "#00b4d8", width: "90%" },
    { label: "Shortlisted", count: funnelStages.Shortlisted, color: "#00f5d4", width: "80%" },
    { label: "Interview Scheduled", count: funnelStages["Interview Scheduled"], color: "#ffb703", width: "70%" },
    { label: "Hired", count: funnelStages.Hired, color: "#2ec4b6", width: "60%" },
    { label: "Rejected", count: funnelStages.Rejected, color: "#e63946", width: "50%" },
  ];

  const appsPerJob = analytics?.applicationsPerJob || [];
  const maxJobApps = Math.max(...appsPerJob.map(j => j.count), 1);

  return (
    <div className="app">
      {/* Background stars */}
      <div className="stars-container">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
              animationDuration: star.duration
            }}
          />
        ))}
      </div>

      <header className="top-header">
        <div className="header-info">
          <h1>HIRESPACE</h1>
          <p>A clean workspace to post, discover, and manage career opportunities.</p>
        </div>
        <div className="header-right-section">
          <div className="header-datetime-container">
            <div className="header-clock">
              {formatTime(time).split("").map((char, index) => (
                <span key={index} className={char === ":" ? "clock-colon" : "clock-digit"}>{char}</span>
              ))}
            </div>
            <div className="header-date">
              {formatDate(time).split("").map((char, index) => (
                <span key={index} className={char === ":" ? "date-colon" : "date-digit"}>{char}</span>
              ))}
            </div>
          </div>
          <ProfileCard user={user} onLogout={handleLogout} />
        </div>
      </header>

      {/* Recruiter Navigation Bar */}
      {isRecruiter && (
        <div className="recruiter-nav-tabs">
          <button
            type="button"
            className={`recruiter-nav-tab ${recruiterTab === "overview" ? "active" : ""}`}
            onClick={() => setRecruiterTab("overview")}
          >
            ATS DASHBOARD
          </button>
          <button
            type="button"
            className={`recruiter-nav-tab ${recruiterTab === "jobs" ? "active" : ""}`}
            onClick={() => {
              setRecruiterTab("jobs");
              fetchJobs();
            }}
          >
            MANAGE JOBS & APPLICANTS
          </button>
          <button
            type="button"
            className={`recruiter-nav-tab ${recruiterTab === "post" ? "active" : ""}`}
            onClick={() => {
              setRecruiterTab("post");
              setEditingJob(null);
            }}
          >
            POST A JOB
          </button>
        </div>
      )}

      {/* Recruiter ATS Overview Tab */}
      {isRecruiter && recruiterTab === "overview" && (
        <div className="ats-dashboard-panel">
          {dashboardLoading && !analytics ? (
            <div className="dashboard-loading-state">
              <div className="cosmic-spinner"></div>
              <p>LOADING ATS INTELLIGENCE...</p>
            </div>
          ) : (
            <>
              {/* Stats Tiles Grid */}
              <div className="stats-tiles-grid">
                <div className="stats-tile tile-total-jobs">
                  <span className="tile-title">TOTAL POSTED JOBS</span>
                  <span className="tile-value">{analytics?.totalJobs || 0}</span>
                </div>
                <div className="stats-tile tile-active-jobs">
                  <span className="tile-title">ACTIVE OPEN JOBS</span>
                  <span className="tile-value">{analytics?.activeJobs || 0}</span>
                </div>
                <div className="stats-tile tile-closed-jobs">
                  <span className="tile-title">CLOSED JOB POSTINGS</span>
                  <span className="tile-value">{analytics?.closedJobs || 0}</span>
                </div>
                <div className="stats-tile tile-applications">
                  <span className="tile-title">TOTAL APPLICATIONS</span>
                  <span className="tile-value">{analytics?.totalApplications || 0}</span>
                </div>
                <div className="stats-tile tile-shortlisted">
                  <span className="tile-title">SHORTLISTED CANDIDATES</span>
                  <span className="tile-value">{analytics?.shortlistedCandidates || 0}</span>
                </div>
              </div>

              {/* Top Performing Job block */}
              {analytics?.topPerformingJob && (
                <div className="top-performing-card">
                  <div className="top-performing-label">TOP PERFORMING LISTING ★</div>
                  <h4>{analytics.topPerformingJob.title}</h4>
                  <p>{analytics.topPerformingJob.count} applications received</p>
                </div>
              )}

              {/* Charts & Activity Feed Side-by-Side */}
              <div className="dashboard-middle-section">
                <div className="charts-card">
                  <h3>RECRUITMENT ANALYTICS</h3>
                  
                  <div className="charts-split">
                    {/* CSS Funnel stage chart */}
                    <div className="chart-wrapper">
                      <h4>Pipeline Stage Funnel</h4>
                      <div className="funnel-chart">
                        {funnelItems.map((item) => (
                          <div className="funnel-stage-wrapper" key={item.label}>
                            <div
                              className="funnel-stage-bar"
                              style={{
                                width: item.width,
                                backgroundColor: item.color,
                                opacity: item.count > 0 ? 1 : 0.25,
                              }}
                            >
                              <span className="funnel-label">{item.label}</span>
                              <span className="funnel-count">{item.count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Applications per Job Chart */}
                    <div className="chart-wrapper">
                      <h4>Applications Received Per Job</h4>
                      <div className="bar-chart-container">
                        {appsPerJob.length === 0 ? (
                          <p className="no-data-text">No listings available.</p>
                        ) : (
                          appsPerJob.map((job) => (
                            <div className="bar-chart-row" key={job.title}>
                              <div className="bar-chart-info">
                                <span className="bar-chart-title">{job.title}</span>
                                <span className="bar-chart-val">{job.count} apps</span>
                              </div>
                              <div className="bar-chart-track">
                                <div
                                  className="bar-chart-fill"
                                  style={{
                                    width: `${(job.count / maxJobApps) * 100}%`
                                  }}
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recruiter event log feed */}
                <div className="activity-feed-card">
                  <h3>RECENT RECRUITER ACTIVITY</h3>
                  <div className="activity-feed-list">
                    {activities.length === 0 ? (
                      <p className="no-activities">No recent actions logged.</p>
                    ) : (
                      activities.map((log) => (
                        <div className="activity-item" key={log._id}>
                          <div className="activity-dot" />
                          <div className="activity-content">
                            <p className="activity-msg">{log.message}</p>
                            <span className="activity-time">{getRelativeTime(log.timestamp)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Applications per job posting list table */}
              <div className="job-applications-summary-card">
                <h3>JOB POSTINGS LIST ({appsPerJob.length})</h3>
                <div className="summary-table-wrapper">
                  <table className="summary-table">
                    <thead>
                      <tr>
                        <th>Job Title</th>
                        <th>Location</th>
                        <th>Salary</th>
                        <th>Status</th>
                        <th>Applications</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.filter(j => j.recruiterId === user._id && !j.isDeleted).map((job) => {
                        const appData = appsPerJob.find(a => a.title === job.title) || { count: 0 };
                        return (
                          <tr key={job._id}>
                            <td className="bold-job-title">{job.title}</td>
                            <td>{job.location}</td>
                            <td>${Number(job.salary).toLocaleString()}</td>
                            <td>
                              <span className={`status-tag ${job.status === "Closed" ? "tag-closed" : "tag-open"}`}>
                                {job.status || "Open"}
                              </span>
                            </td>
                            <td className="bold-app-count">{appData.count} applications</td>
                            <td>
                              <button
                                type="button"
                                className="review-applicants-btn"
                                onClick={() => {
                                  setSelectedJob(job);
                                  setRecruiterTab("jobs");
                                }}
                              >
                                Review Candidates
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Main Layout (Manage Jobs / Applicant Search) */}
      {(!isRecruiter || recruiterTab !== "overview") && (
        <main className="main-layout">
          {/* Recruiter Tab "Post" Form view */}
          {isRecruiter && recruiterTab === "post" ? (
            <div className="centered-form-wrapper">
              <JobForm
                onAddJob={handleAddJob}
                editingJob={editingJob}
                onUpdateJob={handleUpdateJob}
                onCancelEdit={handleCancelEdit}
              />
            </div>
          ) : (
            <>
              {/* LEFT COLUMN: Job Listings */}
              <section className="jobs-panel">
                <div className="jobs-top">
                  <div>
                    {search || filterLocation || filterSalary || filterJobType ? (
                      <>
                        <h2>{isRecruiter ? "MY POSTED LISTINGS" : "AVAILABLE JOBS"}</h2>
                        <p>{filteredJobs.length} JOB OPENINGS FOUND</p>
                      </>
                    ) : (
                      <h2>{isRecruiter ? "MY POSTED LISTINGS" : "SEARCH FOR JOBS"}</h2>
                    )}
                  </div>

                  <input
                    className="search-box"
                    type="text"
                    placeholder="Search by title, company, location....."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>

                <div className="jobs-filters">
                  <div className="filter-group">
                    <label>LOC:</label>
                    <CustomSelect
                      value={filterLocation}
                      onChange={(val) => {
                        setFilterLocation(val);
                        setPage(1);
                      }}
                      options={locationOptions}
                      placeholder="ALL LOCATIONS"
                    />
                  </div>

                  <div className="filter-group">
                    <label>SALARY:</label>
                    <CustomSelect
                      value={filterSalary}
                      onChange={(val) => {
                        setFilterSalary(val);
                        setPage(1);
                      }}
                      options={salaryOptions}
                      placeholder="ALL SALARIES"
                    />
                  </div>

                  <div className="filter-group">
                    <label>TYPE:</label>
                    <CustomSelect
                      value={filterJobType}
                      onChange={(val) => {
                        setFilterJobType(val);
                        setPage(1);
                      }}
                      options={jobTypeOptions}
                      placeholder="ALL JOB TYPES"
                    />
                  </div>

                  {(filterLocation || filterSalary || filterJobType) && (
                    <button
                      type="button"
                      className="clear-filters-btn"
                      onClick={() => {
                        setFilterLocation("");
                        setFilterSalary("");
                        setFilterJobType("");
                        setPage(1);
                      }}
                    >
                      CLEAR
                    </button>
                  )}
                </div>

                {/* Candidate sorting and category buttons */}
                {!isRecruiter && (
                  <div className="jobs-sub-filters">
                    <div className="sort-group">
                      <label>SORT:</label>
                      <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                          const [field, order] = e.target.value.split("-");
                          setSortBy(field);
                          setSortOrder(order);
                          setPage(1);
                        }}
                        className="sort-select"
                      >
                        <option value="createdAt-desc">NEWEST</option>
                        <option value="createdAt-asc">OLDEST</option>
                        <option value="salary-desc">SALARY (HIGH - LOW)</option>
                        <option value="salary-asc">SALARY (LOW - HIGH)</option>
                        <option value="title-asc">TITLE (A - Z)</option>
                      </select>
                    </div>

                    <div className="filter-mode-buttons">
                      <button
                        type="button"
                        className={`mode-btn ${(!showSavedOnly && !showAppliedOnly) ? "active" : ""}`}
                        onClick={() => {
                          setShowSavedOnly(false);
                          setShowAppliedOnly(false);
                          setPage(1);
                        }}
                      >
                        ALL
                      </button>
                      <button
                        type="button"
                        className={`mode-btn ${showSavedOnly ? "active" : ""}`}
                        onClick={() => {
                          setShowSavedOnly(!showSavedOnly);
                          setPage(1);
                        }}
                      >
                        SAVED
                      </button>
                      <button
                        type="button"
                        className={`mode-btn ${showAppliedOnly ? "active" : ""}`}
                        onClick={() => {
                          setShowAppliedOnly(!showAppliedOnly);
                          setPage(1);
                        }}
                      >
                        APPLIED
                      </button>
                    </div>
                  </div>
                )}

                <div className="job-rows">
                  {!(search || filterLocation || filterSalary || filterJobType) && !isRecruiter ? (
                    <div className="empty-state-container">
                      <p className="empty-text">
                        Start typing to find the best opportunities...
                      </p>
                    </div>
                  ) : filteredJobs.length === 0 ? (
                    <div className="empty-state-container">
                      <p className="empty-text">NO JOBS AVAILABLE</p>
                    </div>
                  ) : (
                    filteredJobs.map((job) => (
                      <div
                        className={`job-row ${selectedJob && selectedJob._id === job._id ? "active" : ""}`}
                        key={job._id}
                        onClick={() => setSelectedJob(job)}
                      >
                        <div className="job-icon">
                          <svg className="profile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                        <div className="job-row-main-info">
                          <h3>{job.title}</h3>
                          <h4>{job.company}</h4>
                        </div>
                        
                        {/* Job status tag for recruiters */}
                        {isRecruiter && (
                          <span className={`row-status-tag ${job.status === "Closed" ? "tag-closed" : "tag-open"}`}>
                            {job.status || "Open"}
                          </span>
                        )}

                        <span className="job-row-type-badge">{job.jobType || "Full Time"}</span>

                        {/* Saved star icon positioned correctly on the right corner of job card */}
                        {!isRecruiter && savedJobs.some((j) => j._id === job._id) && (
                          <span className="job-row-saved-badge" title="Saved Job">★</span>
                        )}

                        {/* Recruiter operations: Status toggle, edit, delete */}
                        {isRecruiter && (
                          <div className="recruiter-row-actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className={`status-toggle-btn ${job.status === "Closed" ? "open-action" : "close-action"}`}
                              onClick={() => handleToggleJobStatus(job._id, job.status || "Open")}
                            >
                              {job.status === "Closed" ? "REOPEN" : "CLOSE"}
                            </button>

                            <button
                              type="button"
                              className="edit-btn"
                              onClick={() => handleEditJob(job)}
                            >
                              EDIT
                            </button>

                            <button
                              type="button"
                              className="delete-btn"
                              onClick={() => handleDeleteJob(job._id)}
                            >
                              DELETE
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Candidate pagination */}
                {!isRecruiter && (!showSavedOnly && !showAppliedOnly) && totalPages > 1 && (
                  <div className="pagination-controls">
                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    >
                      ◀ PREV
                    </button>
                    <span className="pagination-info">
                      PAGE {page} OF {totalPages}
                    </span>
                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    >
                      NEXT ▶
                    </button>
                  </div>
                )}
              </section>

              {/* MIDDLE/RIGHT COLUMN: Job details panel & candidate review list */}
              {selectedJob ? (
                <JobDetails
                  key={selectedJob._id}
                  job={selectedJob}
                  user={user}
                  onClose={() => setSelectedJob(null)}
                  onApplyClick={() => setIsApplyOpen(true)}
                  hasApplied={appliedJobIds.includes(selectedJob._id)}
                  isSaved={savedJobs.some((j) => j._id === selectedJob._id)}
                  onToggleSave={() => handleToggleSaveJob(selectedJob._id)}
                  onShowApplicants={(job) => setActiveApplicantsJob(job)}
                />
              ) : (
                <div className="job-details-empty-state">
                  <p>Select a job from the list to view details and applications.</p>
                </div>
              )}

              {/* RIGHT COLUMN: Candidate Location Generator (Applicant view only) */}
              {!isRecruiter && (
                <LocationGenerator onGenerate={handleGenerateLocationJobs} />
              )}
            </>
          )}
        </main>
      )}

      {/* Recruiter Recycle Bin */}
      {isRecruiter && recruiterTab === "jobs" && (
        <RecycleBin onJobsChanged={fetchJobs} />
      )}

      {/* Applicant Apply Modal */}
      {isApplyOpen && selectedJob && (
        <ApplyModal
          job={selectedJob}
          user={user}
          onClose={() => setIsApplyOpen(false)}
          onApplySuccess={handleApplySuccess}
        />
      )}

      {/* Recruiter Applicants Overlay Modal */}
      {isRecruiter && activeApplicantsJob && (
        <div className="modal-overlay" onClick={() => setActiveApplicantsJob(null)}>
          <div className="applicants-overlay-card" onClick={(e) => e.stopPropagation()}>
            <div className="applicants-overlay-header">
              <h2>APPLICANTS FOR {activeApplicantsJob.title.toUpperCase()} at {activeApplicantsJob.company.toUpperCase()}</h2>
              <button
                type="button"
                className="close-overlay-btn"
                onClick={() => setActiveApplicantsJob(null)}
              >
                ✕ CLOSE
              </button>
            </div>
            <div className="applicants-overlay-body">
              <ApplicantsList jobId={activeApplicantsJob._id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
