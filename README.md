<h1 align="center">🌌 HireSpace — Premium Cosmic Job Portal</h1>
<p align="center"><strong>A Full-Stack MERN Application with Glassmorphic UI & Advanced Automation</strong></p>

<hr/>

<h2>📋 Table of Contents</h2>
<ol>
  <li><a href="#project-overview">Project Overview</a></li>
  <li><a href="#core-features">Core Features & Architecture</a></li>
  <li><a href="#directory-structure">Directory Structure</a></li>
  <li><a href="#technology-stack">Technology Stack</a></li>
  <li><a href="#installation--setup">Installation & Setup Guide</a></li>
  <li><a href="#development-notes">Development Notes & Fallbacks</a></li>
</ol>

<hr/>

<h2 id="project-overview">1. 🌌 Project Overview</h2>
<p>
  <strong>HireSpace</strong> is a premium cosmic-themed job board application that implements a fully responsive dark glassmorphic design system. The application features real-time clock and date components, automatic IP-based geolocation detection, automatic mock job generation, fully customized dropdown select widgets, and internationalized currency formatting (K/M dollars).
</p>

<hr/>

<h2 id="core-features">2. 🚀 Core Features</h2>

<h3>🔹 A. Visual Design & Cosmic Aesthetics</h3>
<ul>
  <li><strong>Premium Glassmorphism:</strong> Dark mode accents using highly-blurred translucent panels (<code>backdrop-filter: blur(15px)</code>) with a linear gradient border.</li>
  <li><strong>Twinkling Background Stars:</strong> Forty randomized static stars constrained to the upper space region to simulate deep space.</li>
  <li><strong>Gravitational Black Hole Orbit:</strong> Dynamic falling stars are spawned periodically in the upper half of the viewport, accelerating along simulated gravitational curves and flaring up before dispersing into the black hole accretion disk.</li>
  <li><strong>Scroll Containment:</strong> Page-level scroll is locked (<code>100vh</code> constraint) to guarantee the layout remains balanced across all screen sizes. Columns and detailed views scroll internally with custom-styled orange scrollbars.</li>
</ul>

<h3>🔹 B. Auto-Location & Job Generation</h3>
<ul>
  <li><strong>IP Geolocation:</strong> Hits the <code>ipapi.co</code> JSON service on the client to discover the user's city and country automatically.</li>
  <li><strong>Instant Local Jobs:</strong> Automatically generates three relevant mock jobs (e.g. Software Engineer at Meta, UI/UX Designer at Infosys) localized to the user's city, writes them directly to the database, and reloads the job search view pre-filtered by that city.</li>
</ul>

<h3>🔹 C. Custom Select Dropdowns & Filtering</h3>
<ul>
  <li><strong>Modern Filter Tab:</strong> Encased inside a padded horizontal glass card to group selections and prevent line wrapping on desktop viewports.</li>
  <li><strong>CustomSelect Component:</strong> A fully customized React select element replacing default browser option popups:
    <ul>
      <li><em>Arrow Rotations:</em> Dropdown chevron rotates 180 degrees smoothly on hover/open.</li>
      <li><em>Sliding Option Highlights:</em> Hovering over options triggers a micro-animation that indents the option text to the right and highlights it in orange.</li>
      <li><em>Outside Click Detection:</em> Uses React references to listen to global mouse events, closing open select overlays automatically if you click outside.</li>
    </ul>
  </li>
  <li><strong>Clear Filters Action:</strong> Dynamically displays a centered clear filters button to instantly reset active search and filter parameters.</li>
</ul>

<h3>🔹 D. Stabilized Datetime Display</h3>
<ul>
  <li><strong>Real-time Clock:</strong> Displays system time (<code>HH:MM:SS</code>) and date (<code>DD:MM:YYYY</code>) stacked vertically in white.</li>
  <li><strong>Tabular Character Grid:</strong> Digit strings are split into arrays and rendered inside separate inline-block spans with fixed character widths (digits at <code>22px</code>, colons at <code>12px</code>). This monospacing eliminates text width shifts, stabilizing the location generator card position.</li>
</ul>

<h3>🔹 E. Job Management (CRUD) & Details Panel</h3>
<ul>
  <li><strong>Axios Integration:</strong> Full connection with Express API controllers to Create, Read, Update, and Delete jobs.</li>
  <li><strong>Currency Formatting:</strong> Formats salary integers dynamically to international notations (e.g., <code>$300K</code>, <code>$1.2M</code>) in details view and filter labels.</li>
  <li><strong>Lock State Buttons:</strong> The "Apply Now" button dynamically transforms into an active disabled <strong>COMPLETED [SVG Checkmark]</strong> lock state once selected, updating state handlers cleanly.</li>
</ul>

<hr/>

<h2 id="directory-structure">3. 📂 Directory Structure</h2>

<table border="1" cellpadding="8" cellspacing="0" width="100%">
  <thead>
    <tr bgcolor="#222">
      <th align="left">Path / Location</th>
      <th align="left">Type</th>
      <th align="left">Description / Responsibility</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>backend/config/db.js</code></td>
      <td>Config File</td>
      <td>Sets up Mongoose client connections to MongoDB.</td>
    </tr>
    <tr>
      <td><code>backend/controllers/jobController.js</code></td>
      <td>Controller</td>
      <td>Handles CRUD database logic for jobs (GET, POST, PUT, DELETE).</td>
    </tr>
    <tr>
      <td><code>backend/models/Job.js</code></td>
      <td>Mongoose Schema</td>
      <td>Defines fields for title, company, location, salary, and description.</td>
    </tr>
    <tr>
      <td><code>backend/routes/jobRoutes.js</code></td>
      <td>Express Router</td>
      <td>Binds job controllers to HTTP REST routes.</td>
    </tr>
    <tr>
      <td><code>backend/server.js</code></td>
      <td>Startup File</td>
      <td>Configures middleware (CORS, Express JSON) and runs the port listener.</td>
    </tr>
    <tr>
      <td><code>frontend/src/components/CustomSelect.jsx</code></td>
      <td>React Component</td>
      <td>Renders custom monospaced option dropdown overlays.</td>
    </tr>
    <tr>
      <td><code>frontend/src/components/JobDetails.jsx</code></td>
      <td>React Component</td>
      <td>Displays the active job description, location, salary, and Apply state.</td>
    </tr>
    <tr>
      <td><code>frontend/src/components/JobForm.jsx</code></td>
      <td>React Component</td>
      <td>Renders input fields to add and edit jobs in the database.</td>
    </tr>
    <tr>
      <td><code>frontend/src/components/LocationGenerator.jsx</code></td>
      <td>React Component</td>
      <td>Triggers IP checks and localized job posts.</td>
    </tr>
    <tr>
      <td><code>frontend/src/services/api.js</code></td>
      <td>API Client</td>
      <td>Axios instances configured to hit server routes.</td>
    </tr>
    <tr>
      <td><code>frontend/src/App.css</code></td>
      <td>Stylesheets</td>
      <td>Global custom resets, animations, font allocations, and media query breakpoints.</td>
    </tr>
    <tr>
      <td><code>frontend/src/App.jsx</code></td>
      <td>React Controller</td>
      <td>Manages active states, filter lists, stars arrays, and layouts.</td>
    </tr>
  </tbody>
</table>

<hr/>

<h2 id="technology-stack">4. 🛠️ Technology Stack</h2>

<table border="1" cellpadding="8" cellspacing="0" width="100%">
  <thead>
    <tr bgcolor="#222">
      <th align="left">Layer / Component</th>
      <th align="left">Technologies Used</th>
      <th align="left">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Frontend</strong></td>
      <td>React 19 (Vite), Axios, HTML5</td>
      <td>Component-based client interface with fast Hot Module Reload (HMR).</td>
    </tr>
    <tr>
      <td><strong>Styling</strong></td>
      <td>Vanilla CSS3, Google Fonts</td>
      <td>Gradients, animations, keyframes, transitions, and "Jersey 10" pixel style.</td>
    </tr>
    <tr>
      <td><strong>Backend API</strong></td>
      <td>Node.js, Express 5</td>
      <td>RESTful API routing and database controllers.</td>
    </tr>
    <tr>
      <td><strong>Database</strong></td>
      <td>MongoDB, Mongoose 9</td>
      <td>NoSQL collection storage with automated timestamps.</td>
    </tr>
  </tbody>
</table>

<hr/>

<h2 id="installation--setup">5. 💻 Installation & Setup Guide</h2>

<h3>📂 Step 1: Clone and Install Backend</h3>
<ol>
  <li>Navigate to the backend directory:
    <pre><code>cd backend</code></pre>
  </li>
  <li>Install dependencies:
    <pre><code>npm install</code></pre>
  </li>
  <li>Create a <code>.env</code> file in the <code>backend/</code> folder:
    <pre><code>PORT=5000
MONGO_URI=mongodb://localhost:27017/jobportal</code></pre>
  </li>
  <li>Launch the server in development mode:
    <pre><code>npm run dev</code></pre>
  </li>
</ol>

<h3>📂 Step 2: Install and Start Frontend</h3>
<ol>
  <li>Open a new terminal window and navigate to the frontend directory:
    <pre><code>cd frontend</code></pre>
  </li>
  <li>Install dependencies:
    <pre><code>npm install</code></pre>
  </li>
  <li>Launch the Vite development server:
    <pre><code>npm run dev</code></pre>
  </li>
  <li>Open your browser and navigate to the local client server:
    <pre><code>http://localhost:5173</code></pre>
  </li>
</ol>

<hr/>

<h2 id="development-notes">6. 💡 Development Notes & Callouts</h2>

<blockquote>
  <p><strong>💡 TIP: Production Builds</strong><br/>
  To compile static production builds of the client React app, navigate to the <code>frontend/</code> directory and run <code>npm run build</code>. The output bundle will be saved inside the <code>dist/</code> folder.</p>
</blockquote>

<blockquote>
  <p><strong>⚠️ IMPORTANT: Geolocation Fallback</strong><br/>
  If the IP lookup service times out or is blocked by local firewalls/VPNs, the Location Generator will catch the error and load standard mock jobs in <code>New York, USA</code> as a fallback to prevent app crashes.</p>
</blockquote>
