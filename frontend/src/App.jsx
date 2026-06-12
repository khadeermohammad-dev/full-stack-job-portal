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
import {
  createJob,
  deleteJob,
  getJobs,
  updateJob,
  getMe,
  getAppliedJobIds,
  getSavedJobs,
  saveJob,
  unsaveJob
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
      }
    }
  }, [user]);

  // Re-fetch jobs when candidate filters, page, sorting, or filter mode changes
  useEffect(() => {
    if (user && user.role === "applicant") {
      fetchJobs();
    }
  }, [search, filterLocation, filterSalary, filterJobType, page, sortBy, sortOrder, showSavedOnly, showAppliedOnly]);

  // Update browser tab name dynamically based on user role
  useEffect(() => {
    if (user && user.role) {
      if (user.role === "recruiter") {
        document.title = "HireSpace - Recruiter";
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

      if (user && user.role === "applicant") {
        // Only paginate when in "all" jobs mode (both showSavedOnly and showAppliedOnly are false)
        if (!showSavedOnly && !showAppliedOnly) {
          params.page = page;
          params.limit = limit;
        }
        params.sortBy = sortBy;
        params.sortOrder = sortOrder;
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
    } catch (err) {
      console.error("Error soft-deleting job:", err);
    }
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
  };

  const handleUpdateJob = async (id, jobData) => {
    try {
      await updateJob(id, jobData);
      setEditingJob(null);
      if (selectedJob && selectedJob._id === id) {
        setSelectedJob({ ...selectedJob, ...jobData });
      }
      fetchJobs();
    } catch (err) {
      console.error("Error updating job:", err);
    }
  };

  const handleCancelEdit = () => {
    setEditingJob(null);
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
      const savedIds = savedJobs.map((j) => j._id);
      displayJobs = jobs.filter((j) => savedIds.includes(j._id) && appliedJobIds.includes(j._id));
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

      {/* Spaghettified falling stars */}
      <div className="falling-stars-container">
        {fallingStars.map((fs) => (
          <div
            key={fs.id}
            className="falling-star"
            style={{
              "--start-x": `${fs.startX}vw`,
              "--start-y": `${fs.startY}vh`
            }}
          />
        ))}
      </div>

      <div className="blackhole-container">
        <img src="/blackholefull.png" alt="Black Hole" className="blackhole" />
      </div>

      <header className="top-header">
        <div className="header-info">
          <h1>
            HIRESPACE
          </h1>
          <p>
            A clean workspace to post, discover, and manage career opportunities.
          </p>
        </div>
        <div className="header-right-section">
          <div className="header-datetime-container">
            <div className="header-clock">
              {formatTime(time).split("").map((char, index) => (
                <span key={index} className={char === ":" ? "clock-colon" : "clock-digit"}>
                  {char}
                </span>
              ))}
            </div>
            <div className="header-date">
              {formatDate(time).split("").map((char, index) => (
                <span key={index} className={char === ":" ? "date-colon" : "date-digit"}>
                  {char}
                </span>
              ))}
            </div>
          </div>
          <ProfileCard user={user} onLogout={handleLogout} />
        </div>
      </header>

      <main className="main-layout">
        {/* LEFT COLUMN: Job Search & Listings (for both Recruiter & Applicant) */}
        <section className="jobs-panel">
          <div className="jobs-top">
            <div>
              {search || filterLocation || filterSalary || filterJobType ? (
                <>
                  <h2>{isRecruiter ? "MY POSTED JOBS" : "AVAILABLE JOBS"}</h2>
                  <p>{filteredJobs.length} JOB OPENINGS FOUND</p>
                </>
              ) : (
                <h2>{isRecruiter ? "MY POSTED JOBS" : "SEARCH FOR JOBS"}</h2>
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

            {/* Job Type select filter */}
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

          {/* Candidates-only Sorting & Saved Jobs Bar */}
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
                  <span className="job-row-type-badge">{job.jobType || "Full Time"}</span>

                  {!isRecruiter && savedJobs.some((j) => j._id === job._id) && (
                    <span className="job-row-saved-badge" title="Saved Job">★</span>
                  )}

                  {isRecruiter && (
                    <>
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditJob(job);
                        }}
                      >
                        EDIT
                      </button>

                      <button
                        type="button"
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteJob(job._id);
                        }}
                      >
                        DELETE
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Candidates-only Pagination */}
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

        {/* MIDDLE/RIGHT COLUMN: Job details panel (visible to both roles when selected) */}
        {selectedJob && (
          <JobDetails
            key={selectedJob._id}
            job={selectedJob}
            user={user}
            onClose={() => setSelectedJob(null)}
            onApplyClick={() => setIsApplyOpen(true)}
            hasApplied={appliedJobIds.includes(selectedJob._id)}
            isSaved={savedJobs.some((j) => j._id === selectedJob._id)}
            onToggleSave={() => handleToggleSaveJob(selectedJob._id)}
          />
        )}

        {/* RIGHT COLUMN: Action panel (Recruiter: Job Posting Form, Applicant: Local Jobs Generator) */}
        {isRecruiter ? (
          <JobForm
            onAddJob={handleAddJob}
            editingJob={editingJob}
            onUpdateJob={handleUpdateJob}
            onCancelEdit={handleCancelEdit}
          />
        ) : (
          <LocationGenerator onGenerate={handleGenerateLocationJobs} />
        )}
      </main>

      {/* Recruiter Bottom-Left Recycle Bin */}
      {isRecruiter && (
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
    </div>
  );
}

export default App;
