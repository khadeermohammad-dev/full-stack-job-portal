import { useState } from "react";

const generateRandomJobs = (locationName) => {
  const roles = [
    "Software Engineer",
    "UI/UX Designer",
    "Product Manager",
    "Frontend Developer",
    "Backend Engineer",
    "DevOps Specialist",
    "Data Analyst"
  ];
  
  const companies = [
    "Google", "Microsoft", "Meta", "Amazon", "Netflix", 
    "Swiggy", "TCS", "Infosys", "Zomato", "Jio", "Flipkart"
  ];
  
  const descriptions = [
    "Exciting role to build and optimize next-generation products in our local office. You will work alongside a brilliant team of developers and engineers.",
    "Looking for a talented specialist to lead critical workflows, design interactive user experiences, and collaborate with product teams.",
    "Join us to scale our applications, automate infrastructure deployment, and maintain reliability across all services.",
    "Collaborate on designing beautiful, user-centered features that solve real-world problems and drive active growth."
  ];

  const salaries = [
    450000, 600000, 750000, 900000, 1200000, 1500000, 1800000, 2200000
  ];

  const jobs = [];
  const shuffledRoles = [...roles].sort(() => 0.5 - Math.random());
  const shuffledCompanies = [...companies].sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < 3; i++) {
    const role = shuffledRoles[i];
    const company = shuffledCompanies[i];
    const salary = salaries[Math.floor(Math.random() * salaries.length)];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    jobs.push({
      title: role,
      company: company,
      location: locationName,
      salary: salary,
      description: description
    });
  }
  
  return jobs;
};

function LocationGenerator({ onGenerate }) {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState("");
  const [showStatus, setShowStatus] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setShowStatus(false);
    let detectedLocation = "New York, USA";
    
    try {
      const response = await fetch("https://ipapi.co/json/");
      if (response.ok) {
        const data = await response.json();
        if (data.city && data.country_name) {
          detectedLocation = `${data.city}, ${data.country_name}`;
        } else if (data.city) {
          detectedLocation = data.city;
        }
      }
    } catch (error) {
      console.error("Error detecting location, using fallback:", error);
    }
    
    setLocation(detectedLocation);
    const mockJobs = generateRandomJobs(detectedLocation);
    
    await onGenerate(mockJobs, detectedLocation);
    
    setLoading(false);
    setShowStatus(true);
    
    setTimeout(() => {
      setShowStatus(false);
    }, 4500);
  };

  return (
    <div className="location-generator-card">
      <div className="gen-header">
        <h4>LOCAL JOBS GENERATOR</h4>
      </div>
      
      <p className="gen-text">
        {location ? `Detected: ${location}` : "Detect location & generate nearby jobs"}
      </p>

      <button 
        className={`gen-btn ${loading ? "loading" : ""}`} 
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner"></span> GENERATING...
          </>
        ) : (
          <>
            <svg
              className="btn-icon"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="#000000"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            DETECT & GENERATE
          </>
        )}
      </button>

      {showStatus && (
        <div className="gen-status">
          Generated 3 jobs in {location}!
        </div>
      )}
    </div>
  );
}

export default LocationGenerator;
