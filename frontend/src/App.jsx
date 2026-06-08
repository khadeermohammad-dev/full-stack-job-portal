/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import JobForm from "./components/JobForm";
import JobDetails from "./components/JobDetails";
import LocationGenerator from "./components/LocationGenerator";
import CustomSelect from "./components/CustomSelect";
import { createJob, deleteJob, getJobs, updateJob } from "./services/api";
import "./App.css";

function App() {
  const [jobs, setJobs] = useState([]);
  const [editingJob, setEditingJob] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [stars, setStars] = useState([]);
  const [fallingStars, setFallingStars] = useState([]);
  const [filterLocation, setFilterLocation] = useState("");
  const [filterSalary, setFilterSalary] = useState("");
  const [time, setTime] = useState(new Date());

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
    const response = await getJobs();
    setJobs(response.data);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Generate background stars
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

  // Periodically generate falling stars heading towards the black hole
  useEffect(() => {
    const triggerFallingStar = () => {
      const id = Date.now();
      const startX = Math.random() * 100;
      const startY = Math.random() * 40; // Upper 40% of the screen
      
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

  const handleAddJob = async (jobData) => {
    await createJob(jobData);
    fetchJobs();
  };

  const handleDeleteJob = async (id) => {
    await deleteJob(id);
    if (selectedJob && selectedJob._id === id) {
      setSelectedJob(null);
    }
    fetchJobs();
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
  };

  const handleUpdateJob = async (id, jobData) => {
    await updateJob(id, jobData);
    setEditingJob(null);
    if (selectedJob && selectedJob._id === id) {
      setSelectedJob({ ...selectedJob, ...jobData });
    }
    fetchJobs();
  };

  const handleCancelEdit = () => {
    setEditingJob(null);
  };

  const handleGenerateLocationJobs = async (mockJobs, detectedLocation) => {
    for (const jobData of mockJobs) {
      await createJob(jobData);
    }
    await fetchJobs();
    setSearch(detectedLocation);
  };

  const uniqueLocations = Array.from(new Set(jobs.map((job) => job.location))).filter(Boolean);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = `${job.title} ${job.company} ${job.location}`
      .toLowerCase()
      .includes(search.toLowerCase());
      
    const matchesLocation = filterLocation ? job.location === filterLocation : true;
    
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
    
    return matchesSearch && matchesLocation && matchesSalary;
  });

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

      {/* Spaghettified falling stars drawn into the black hole */}
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
          <h1>HIRESPACE</h1>
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
          <LocationGenerator onGenerate={handleGenerateLocationJobs} />
        </div>
      </header>

      <main className="main-layout">
        <section className="jobs-panel">
          <div className="jobs-top">
            <div>
              {search || filterLocation || filterSalary ? (
                <>
                  <h2>AVAILABLE JOBS</h2>
                  <p>{filteredJobs.length} JOB OPENINGS FOUND</p>
                </>
              ) : (
                <h2>SEARCH FOR JOBS</h2>
              )}
            </div>

            <input
              className="search-box"
              type="text"
              placeholder="Search by title, company, location....."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="jobs-filters">
            <div className="filter-group">
              <label>LOCATION:</label>
              <CustomSelect
                value={filterLocation}
                onChange={setFilterLocation}
                options={locationOptions}
                placeholder="ALL LOCATIONS"
              />
            </div>

            <div className="filter-group">
              <label>SALARY RANGE:</label>
              <CustomSelect
                value={filterSalary}
                onChange={setFilterSalary}
                options={salaryOptions}
                placeholder="ALL SALARIES"
              />
            </div>

            {(filterLocation || filterSalary) && (
              <button
                className="clear-filters-btn"
                onClick={() => {
                  setFilterLocation("");
                  setFilterSalary("");
                }}
              >
                CLEAR
              </button>
            )}
          </div>

          <div className="job-rows">
            {!(search || filterLocation || filterSalary) ? (
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
                  <h3>{job.title}</h3>
                  <h4>{job.company}</h4>

                  <button
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditJob(job);
                    }}
                  >
                    EDIT
                  </button>

                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteJob(job._id);
                    }}
                  >
                    DELETE
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {selectedJob && (
          <JobDetails
            key={selectedJob._id}
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
          />
        )}

        <JobForm
          onAddJob={handleAddJob}
          editingJob={editingJob}
          onUpdateJob={handleUpdateJob}
          onCancelEdit={handleCancelEdit}
        />
      </main>
    </div>
  );
}

export default App;
