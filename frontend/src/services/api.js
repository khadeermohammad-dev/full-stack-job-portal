import axios from "axios";

const API_URL = "http://localhost:5000/api/jobs";

export const getJobs = () => axios.get(API_URL);

export const createJob = (jobData) => axios.post(API_URL, jobData);

export const updateJob = (id, jobData) =>
  axios.put(`${API_URL}/${id}`, jobData);

export const deleteJob = (id) => axios.delete(`${API_URL}/${id}`);
