🌌 HireSpace — Premium Cosmic Job Portal Pro

A full-featured, secure MERN stack job board application implementing a premium dark glassmorphic design system. Features include role-based workflows, JWT authentication, candidate resume uploads, Recycle Bin preference caching, saved jobs, paginated search listings, dynamic sorting, and automatic IP-based geolocation mock-job generation.

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Implemented Features](#implemented-features)
   - [A. Authentication & Authorization](#a-authentication--authorization)
   - [B. Recruiter Dashboard & Recycle Bin](#b-recruiter-dashboard--recycle-bin)
   - [C. Candidate Workspace & Applications](#c-candidate-workspace--applications)
   - [D. Saved Jobs, Pagination & Sorting](#d-saved-jobs-pagination--sorting)
   - [E. Cosmic Aesthetics & Interface Details](#e-cosmic-aesthetics--interface-details)
3. [Directory Structure](#directory-structure)
4. [Database Design & Collections](#database-design--collections)
5. [API Endpoints](#api-endpoints)
6. [Technology Stack](#technology-stack)
7. [Installation & Setup Guide](#installation--setup-guide)

---

## 1. 🌌 Project Overview
**HireSpace** is an advanced MERN stack job portal designed with premium visual aesthetics (glassmorphism, interactive star particle fields, clock-stabilized layouts). The application partitions workflows cleanly into two roles:
*   **Recruiters**: Manage job postings, review applicant details (including downloading candidate-uploaded resume files), soft-delete expired jobs to a custom Recycle Bin, and permanently delete listings.
*   **Candidates (Applicants)**: Search and filter jobs dynamically, page through results using pagination, sort listings, save jobs to their favorites list, and submit applications complete with cover letters, experience details, and resume files.

---

## 2. 🚀 Implemented Features

### 🔹 A. Authentication & Authorization
*   **Register & Login**: Dual-form login portal featuring email validation regex checks and minimum-length password validations.
*   **Password Hashing & JWT**: Implements `bcryptjs` hashing for stored credentials and generates JSON Web Tokens (JWT) on success. Frontend Axios interceptors inject the JWT token automatically into headers to authenticate requests.
*   **Onboarding Phase**: Newly registered users select their role (**Recruiter** or **Applicant**) and fill in profile parameters (Full Name, Phone, and Company Name for recruiters).
*   **Password Renewal**: A built-in "Forgot Password?" flow that renews/resets user credentials securely in the database.

### 🔹 B. Recruiter Dashboard & Recycle Bin
*   **CRUD Postings**: Create, edit, and delete job listings. Changes update the listings on the candidate dashboard in real-time.
*   **Soft Delete & Recycle Bin**: Deleting a job sets `isDeleted: true` and moves it to a floating Recycle Bin. Recruiters can review deleted jobs and select **Restore** or **Delete Permanently**.
*   **Preference Cache**: Warning overlays before permanent deletion feature a "Don't show this again" checkbox, which stores recruiter preferences inside `localStorage` to bypass future alerts.
*   **Applicant Tracking**: Selecting a job opens a candidates data table displaying applicant names, contact information, years of experience, cover letters, and single-click resume download links.

### 🔹 C. Candidate Workspace & Applications
*   **Local Jobs Generator**: Hits `ipapi.co` on startup to locate the candidate's IP coordinates, automatically posting three mock jobs in that city and pre-filtering listings by that location.
*   **Apply Modal**: Supports entering years of experience, a cover letter, and choosing a document file (resume).
*   **Flexible Contact Fields**: If the candidate uploads a resume file, contact inputs (Name, Email, Phone) instantly convert to `(Optional)` status and utilize the user's profile info as fallbacks.
*   **Completed Lock State**: Once a candidate applies to a job, the detail panel footer locks into a disabled **COMPLETED 👍** state to prevent duplicate applications.

### 🔹 D. Saved Jobs, Pagination & Sorting
*   **Saved Jobs (Bookmarks)**: Candidates can click the bookmark star (`★` / `☆`) in the top-right corner of the Job Details panel to toggle jobs on/off their saved favorites list.
*   **Multi-Select Filter Modes**: Segmented filter group buttons (**ALL**, **SAVED**, **APPLIED**) support independent toggles:
    *   *ALL*: Displays all active postings (uses backend pagination).
    *   *SAVED*: Filters listings to show only saved jobs.
    *   *APPLIED*: Filters listings to show only jobs the user has applied to.
    *   *SAVED + APPLIED (Multi)*: Acts as an **AND** filter, displaying only jobs that are **both saved and applied to**.
*   **Dynamic Sorting**: Sort listings dynamically on the backend by Newest, Oldest, Salary (High to Low), Salary (Low to High), and Title (A-Z).
*   **Pagination Controls**: Navigation controls page through active listings in chunks of 5 jobs.

### 🔹 E. Cosmic Aesthetics & Interface Details
*   **Dynamic Page Titles**: Reactively updates the browser tab title to `"HireSpace - Recruiter"` or `"HireSpace - Applicant"` based on the logged-in user role, defaulting to `"HireSpace"`.
*   **Custom Favicon**: Custom static icon `/public/favicon.png` loaded from the brand logo resource.
*   **Wobble-Free Clock**: Splitting date/time strings into separate character blocks with fixed CSS widths eliminates structural wobbles on adjacent cards as seconds update.
*   **Locked Viewport heights**: Page scroll is disabled using `height: 100vh; overflow: hidden`, forcing columns to scroll internally with glowing orange scrollbars.

---

## 3. 📂 Directory Structure

```
/full-stack-job-portal
├── /backend
│   ├── /config
│   │   └── db.js                  # MongoDB Mongoose connection
│   ├── /controllers
│   │   ├── authController.js      # Auth, Profile Onboard, Reset Password logic
│   │   └── jobController.js       # Job CRUD, Applications, Soft deletes, Saved jobs, Pagination/Sorting
│   ├── /middleware
│   │   └── auth.js                # JWT protect and route-guard middleware
│   ├── /models
│   │   ├── Application.js         # Mongoose schema for candidate job applications
│   │   ├── Job.js                 # Mongoose schema for posted jobs
│   │   ├── SavedJob.js            # Mongoose schema mapping candidate saves to jobs
│   │   └── User.js                # Mongoose schema for user login profiles
│   ├── /routes
│   │   ├── authRoutes.js          # Authentication router bindings
│   │   └── jobRoutes.js           # Jobs & Applications router bindings
│   ├── .env                       # Environment variables config (PORT, MONGO_URI, JWT_SECRET)
│   └── server.js                  # Express backend server startup entrypoint
│
└── /frontend
    ├── /public
    │   ├── favicon.png            # Site favicon png logo
    │   └── blackholefull.png      # Accretion disk accretion background asset
    ├── /src
    │   ├── /assets
    │   │   └── hirespacelogo.png  # Brand logo image asset
    │   ├── /components
    │   │   ├── ApplicantsList.jsx # Recruiter candidate list table rendering
    │   │   ├── ApplyModal.jsx     # Candidate experience details & base64 resume modal
    │   │   ├── Auth.jsx           # Glassmorphic Login/Register/Reset forms
    │   │   ├── CustomSelect.jsx   # Custom animated dropdown select widget
    │   │   ├── JobDetails.jsx     # Job description view & Save/Apply action triggers
    │   │   ├── JobForm.jsx        # Job create & update inputs with custom job-type select
    │   │   ├── LocationGenerator.jsx # IP geolocation detection & local jobs generator
    │   │   ├── Onboarding.jsx     # Setup fields for new applicant & recruiter profiles
    │   │   ├── ProfileCard.jsx    # Top header dropdown showcasing profile credentials
    │   │   └── RecycleBin.jsx     # Deleted jobs viewer with preference settings cache
    │   ├── /services
    │   │   └── api.js             # Axios client configurations and endpoint queries
    │   ├── App.css                # Glassmorphism, particles, clock grids, and layout stylesheets
    │   ├── App.jsx                # Layout orchestrator, active states, and lifecycle syncs
    │   └── main.jsx               # React DOM render root
```

---

## 4. 🗄️ Database Design & Collections

### 👥 User Collection
*   `email` (String, unique, required)
*   `password` (String, required)
*   `role` (String, enum: `["recruiter", "applicant"]`)
*   `fullName` (String)
*   `phone` (String)
*   `companyName` (String, recruiter only)

### 💼 Job Collection
*   `title` (String, required)
*   `company` (String, required)
*   `location` (String, required)
*   `salary` (Number, required)
*   `description` (String, required)
*   `jobType` (String, enum: `["Full Time", "Part Time", "Contract"]`, default: `"Full Time"`)
*   `isDeleted` (Boolean, default: `false`)
*   `deletedAt` (Date, default: `null`)
*   `recruiterId` (Mongoose ObjectId, ref: `"User"`)

### 📝 Application Collection
*   `jobId` (Mongoose ObjectId, ref: `"Job"`, required)
*   `applicantId` (Mongoose ObjectId, ref: `"User"`, required)
*   `fullName` (String)
*   `email` (String)
*   `phone` (String)
*   `experience` (Number, years)
*   `coverLetter` (String)
*   `resumeName` (String, original file name)
*   `resumeData` (String, base64 file representation)
*   `appliedDate` (Date, default: `Date.now`)

### ⭐️ Saved Jobs Collection
*   `candidateId` (Mongoose ObjectId, ref: `"User"`, required)
*   `jobId` (Mongoose ObjectId, ref: `"Job"`, required)
*   `savedDate` (Date, default: `Date.now`)
*(Compound index `{ candidateId: 1, jobId: 1 }` enforced to guarantee uniqueness)*

---

## 5. 🔌 API Endpoints

### 🔐 Authentication APIs
*   `POST /api/auth/register` — Register a new account.
*   `POST /api/auth/login` — Login user & return signed JWT.
*   `GET /api/auth/me` — Retrieve current authenticated user profile.
*   `POST /api/auth/profile` — Update details during onboarding.
*   `POST /api/auth/reset-password` — Change credentials for users.

### 💼 Job APIs
*   `GET /api/jobs` — Fetch active jobs. Optional query parameters: `search`, `location`, `minSalary`, `jobType`, `page`, `limit`, `sortBy`, `sortOrder`.
*   `GET /api/jobs/deleted` — Retrieve recruiter's soft-deleted postings *(Recruiter only)*.
*   `GET /api/jobs/applied` — Retrieve job IDs candidate applied to *(Applicant only)*.
*   `GET /api/jobs/saved` — Retrieve candidate's saved jobs list *(Applicant only)*.
*   `GET /api/jobs/:id` — Retrieve a single job's details.
*   `POST /api/jobs` — Create a new job posting *(Recruiter only)*.
*   `PUT /api/jobs/:id` — Update job parameters *(Recruiter only)*.
*   `DELETE /api/jobs/:id` — Soft-delete job (move to Recycle Bin) *(Recruiter only)*.
*   `PUT /api/jobs/:id/restore` — Restore soft-deleted job *(Recruiter only)*.
*   `DELETE /api/jobs/:id/permanent` — Permanently delete job *(Recruiter only)*.

### 📝 Application & Saved Job APIs
*   `POST /api/jobs/:id/apply` — Apply for a job *(Applicant only)*.
*   `GET /api/jobs/:id/applications` — List applications for a job *(Recruiter only)*.
*   `POST /api/jobs/:id/save` — Add job to favorites *(Applicant only)*.
*   `DELETE /api/jobs/:id/save` — Remove job from favorites *(Applicant only)*.

---

## 6. 🛠️ Technology Stack
*   **Frontend**: React 19 (Vite bundle builder), Axios, HTML5
*   **Styling**: Vanilla CSS3 (highly tailored gradients, custom scrollbars, keyframe particle animations, media responsive queries), Google Fonts (Inter, Roboto Condensed, Outfit, Jersey 10)
*   **Backend Server**: Node.js, Express 5
*   **Database**: MongoDB, Mongoose 9
*   **Security & Encryption**: JSON Web Tokens (JWT), `bcryptjs` password hashing, protected route middleware.

---

## 7. 💻 Installation & Setup Guide

### 📂 Step 1: Backend Installation
1.  Navigate into the server folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` configuration file inside `backend/` directory:
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/jobportalpro
    JWT_SECRET=your_jwt_secret_key_here
    ```
4.  Start the Express server:
    ```bash
    npm run dev # or nodemon server.js
    ```

### 📂 Step 2: Frontend Installation
1.  Open a new terminal window and navigate to the frontend folder:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite local development session:
    ```bash
    npm run dev
    ```
4.  Open the client URL in your web browser:
    ```
    http://localhost:5173
    ```
