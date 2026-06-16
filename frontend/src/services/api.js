import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Automatically inject JWT token into all outgoing requests if it exists in localStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("hirespace_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const login = (credentials) => API.post("/auth/login", credentials);
export const register = (credentials) => API.post("/auth/register", credentials);
export const getMe = () => API.get("/auth/me");
export const updateProfile = (profileData) => API.post("/auth/profile", profileData);
export const resetPassword = (credentials) => API.post("/auth/reset-password", credentials);

// Job endpoints
export const getJobs = (filters = {}) => {
  const params = {};
  if (filters.search) params.search = filters.search;
  if (filters.location) params.location = filters.location;
  if (filters.minSalary) params.minSalary = filters.minSalary;
  if (filters.jobType) params.jobType = filters.jobType;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.sortBy) params.sortBy = filters.sortBy;
  if (filters.sortOrder) params.sortOrder = filters.sortOrder;
  if (filters.showClosed !== undefined) params.showClosed = filters.showClosed;
  return API.get("/jobs", { params });
};
export const getJobById = (id) => API.get(`/jobs/${id}`);
export const createJob = (jobData) => API.post("/jobs", jobData);
export const updateJob = (id, jobData) => API.put(`/jobs/${id}`, jobData);
export const deleteJob = (id) => API.delete(`/jobs/${id}`);
export const updateJobStatus = (id, status) => API.put(`/jobs/${id}/status`, { status });

// Recycle Bin & Applications
export const getDeletedJobs = () => API.get("/jobs/deleted");
export const restoreJob = (id) => API.put(`/jobs/${id}/restore`, {});
export const permanentDeleteJob = (id) => API.delete(`/jobs/${id}/permanent`);
export const applyToJob = (id, applicationData) => API.post(`/jobs/${id}/apply`, applicationData);
export const getJobApplications = (id) => API.get(`/jobs/${id}/applications`);
export const getAppliedJobIds = () => API.get("/jobs/applied");
export const getSavedJobs = () => API.get("/jobs/saved");
export const saveJob = (id) => API.post(`/jobs/${id}/save`);
export const unsaveJob = (id) => API.delete(`/jobs/${id}/save`);

// Recruiter ATS Dashboard Operations
export const getRecruiterAnalytics = () => API.get("/jobs/analytics");
export const getRecentActivities = () => API.get("/jobs/activities");
export const bulkUpdateApplications = (applicationIds, status) => API.put("/jobs/applications/bulk", { applicationIds, status });
export const updateApplicationStatus = (appId, status) => API.put(`/jobs/applications/${appId}/status`, { status });

// Recruiter Notes
export const addNote = (appId, content) => API.post(`/jobs/applications/${appId}/notes`, { content });
export const editNote = (appId, noteId, content) => API.put(`/jobs/applications/${appId}/notes/${noteId}`, { content });
export const deleteNote = (appId, noteId) => API.delete(`/jobs/applications/${appId}/notes/${noteId}`);

// Interview Scheduler
export const scheduleInterview = (appId, interviewData) => API.post(`/jobs/applications/${appId}/interview`, interviewData);
export const cancelInterview = (appId) => API.delete(`/jobs/applications/${appId}/interview`);

export default API;
