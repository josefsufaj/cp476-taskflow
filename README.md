# TaskFlow 📋

A personal task management web application developed for **CP476A - Internet Computing** (Winter 2026) at Wilfrid Laurier University.

---

## 📖 Project Overview

TaskFlow is a web-based task management system that allows users to create, organize, track, and complete personal tasks. The application features user authentication, full CRUD operations for tasks, and filtering/sorting capabilities.

### Key Features

- **User Authentication**: Secure registration and login system
- **Task Management**: Create, view, edit, and delete tasks
- **Task Attributes**: Title, description, due date, priority levels, and status tracking
- **Filtering & Sorting**: Filter tasks by status or priority; sort by due date
- **Responsive Design**: Clean, intuitive web interface

---

## 👥 Team Members

| Name | Role | Responsibilities |
|------|------|-----------------|
| Allen Dolgonos | Team Lead / Front-End | UI design, HTML/CSS/JS, wireframes, project coordination |
| Chris Ooi En Shen | Back-End / Database | Server-side logic, API endpoints, database design |
| Joey Sufaj | Full-Stack / Testing | Integration, testing, documentation, code review |

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| Front-End | HTML5, CSS3, JavaScript (Vanilla) |
| Back-End | Node.js |
| Database | MySQL |
| Version Control | Git / GitHub |

---

## 📁 Project Structure

```
taskflow/
├── frontend/                    # Front-end static files
│   ├── css/
│   │   └── style.css          # Main stylesheet
│   ├── js/
│   │   ├── auth.js            # Login/register form handling
│   │   └── app.js             # Dashboard and task management
│   ├── login.html             # Login page
│   ├── register.html          # Registration page
│   └── dashboard.html         # Main task dashboard
├── server/                    # Back-end server files
│   ├── config/
│   │   └── database.js        # MySQL connection configuration
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   └── taskController.js  # Task CRUD logic
│   ├── routes/
│   │   ├── authRoutes.js      # Auth API routes
│   │   └── taskRoutes.js      # Task API routes
│   └── server.js              # Express server entry point
├── docs/
│   ├── schema.sql             # Database CREATE TABLE statements
│   └── TaskFlow_Database_Design.pdf  # ER diagram + schema docs
├── package.json
├── .env.example               # Environment variable template
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- MySQL (8.0+)
- Web browser (Chrome, Firefox, Safari, or Edge)


## How to Run Locally

### Prerequisites

- **Node.js** (v18 or later)
- **npm** (included with Node.js)
- **MySQL** (v8.0 or later)

### Step 1: Clone the Repository

```bash
git clone https://github.com/josefsufaj/cp476-taskflow.git
cd cp476-taskflow
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up the Database

1. Open MySQL and run the schema file:

```bash
mysql -u root -p < docs/schema.sql
```

2. Copy the environment template and update with your MySQL credentials:

```bash
cp .env.example .env
```

Edit `.env` with your database password and a session secret.

### Step 4: Start the Server

```bash
npm start
```

The application will be available at **http://localhost:3000**.

### Running the Front-End Only (No Database)

The front-end can run independently using mock data stored in the browser's localStorage. Simply open `public/login.html` in a browser or start the server and navigate to http://localhost:3000.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in a user |
| POST | `/api/auth/logout` | Log out the current user |
| GET | `/api/auth/me` | Get current user info |
| GET | `/api/tasks` | Get all tasks (with optional filters) |
| GET | `/api/tasks/:id` | Get a single task |
| POST | `/api/tasks` | Create a new task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

## 📋 Project Links

- **GitHub Repository**: https://github.com/josefsufaj/cp476-taskflow
- **Project Board (Kanban)**: https://github.com/users/josefsufaj/projects/1
- **Wiki / Documentation**: https://github.com/josefsufaj/cp476-taskflow/tree/main/docs

---

## 📅 Milestone Progress

| Milestone | Due Date | Status |
|-----------|----------|--------|
| M01 - Planning & Design | Jan 30, 2026 | ✅ Complete |
| M02 - Front-End & Database | Feb 27, 2026 | ✅ Complete |
| M03 - Full Integration & Demo | Apr 5, 2026 | ✅ Complete |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Instructor**: Dr. Mustafa Daraghmeh
- **Course**: CP476A - Internet Computing, Winter 2026
- **Institution**: Wilfrid Laurier University

---

*Last updated: April 5, 2026*
