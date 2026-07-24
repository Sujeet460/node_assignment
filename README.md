# Task Management System API

A robust, enterprise-ready, real-time Node.js RESTful API designed for managing tasks, teams, and user profiles. Built with a solid layered architecture (Controller-Repository-Service), it features role-based access control (RBAC), WebSocket notifications via Socket.io, request validation, Redis caching (with in-memory fallback), secure authentication, and interactive API documentation using Swagger UI.

---

## 🚀 Key Features

*   **Layered Architecture**: Organized codebase using Controllers, Services, Repositories, DTOs (Data Transfer Objects), and Middlewares.
*   **Role-Based Access Control (RBAC)**: Supports `admin`, `manager`, and `user` roles with custom route protection.
*   **Real-Time Communications**: Live notifications pushed to specific users and teams using Socket.io room bindings.
*   **Intelligent Caching Layer**: High-performance caching with Redis, seamlessly falling back to an in-memory Map structure if Redis is offline.
*   **Security Protections**:
    *   **Helmet**: Security-oriented HTTP response headers.
    *   **Rate Limiting**: Prevent brute-force and DDoS attacks on auth and API routes.
    *   **MongoDB Operator Injection Prevention**: Automatic query sanitization.
    *   **HPP**: HTTP Parameter Pollution defense.
    *   **Compression**: Gzip compression for faster network responses.
*   **OTP & Verification**: Email OTP generation and verification using Nodemailer.
*   **Self-Documenting Swagger UI**: Interactive Open API 3.0 specification available directly at `/api-docs`.
*   **Dual Test Suites**: Features both Jest unit/integration tests and an end-to-end API verification runner.

---

## 🛠️ Tech Stack & Dependencies

*   **Runtime**: Node.js (ES Modules syntax)
*   **Framework**: Express.js (v5.2.1)
*   **Database**: MongoDB (via Mongoose v9.8.0)
*   **Real-time**: Socket.io (v4.8.3)
*   **Cache**: Redis (v6.1.0)
*   **Authentication**: JSON Web Tokens (jsonwebtoken) & bcryptjs
*   **Mail Client**: Nodemailer
*   **Testing**: Jest & Supertest

---

## 📂 Project Structure

```
├── tests/                  # Jest integration tests and socket testing dashboard
│   ├── api.test.js         # Integration tests
│   └── test_socket.html    # WebSocket connection test client
├── src/
│   ├── app.js              # Express app setup and middleware configuration
│   ├── config/             # Environment configuration (DB, Redis, JWT, Mail, Swagger)
│   ├── constants/          # Application-wide constants (Roles, etc.)
│   ├── controllers/        # Request handlers matching route paths
│   ├── db/                 # Database connection utilities
│   ├── dto/                # Data Transfer Objects for validation and formatting
│   ├── middleware/         # Auth, Role guards, Rate limiter, Error handler
│   ├── models/             # Mongoose schemas (User, Task, Team, Otp, TokenBlacklist)
│   ├── repositories/       # Database access abstractions
│   ├── routes/             # Route configurations
│   ├── services/           # Business logic and external service layers
│   └── utils/              # Utilities (Swagger doc definitions, bootstrap seeds)
├── server.js               # Main entry point: boots HTTP, Socket.io, DB, and Caching
├── test_api.js             # End-to-end verification script
└── package.json            # Scripts and dependency lists
```

---

## ⚙️ Prerequisites

Before you start, make sure you have installed:
*   [Node.js](https://nodejs.org/) (v18.x or higher recommended)
*   [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)
*   [Redis](https://redis.io/) (Optional, local instance running on port 6379)

---

## 💻 Local Setup & Installation

Follow these steps to set up the project locally on your machine:

### 1. Clone & Install Dependencies
First, navigate to your workspace directory and install the package dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (or customize the existing one). Here are the key variables needed:
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/TASK_MANAGEMENT_SYSTEM

# JWT Configuration
JWT_SECRET=super_secret_key_for_task_management_system_api_12345
JWT_EXPIRES_IN=1d

# Redis Configuration (Optional)
# If Redis is unavailable, the server will log a warning and fall back to in-memory caching.
REDIS_URL=redis://localhost:6379

# Email SMTP configuration (Optional, used for OTP notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
```

### 3. Bootstrap Seed Data (Admin User)
To run tests or authenticate as an admin, you must seed a default admin user. Execute the bootstrap script:
```bash
node src/utils/bootstrap.js
```
Upon success, this will create (or verify) the following administrator credential:
*   **Email**: `admin@taskmanager.com`
*   **Password**: `AdminPassword@123`

---

## 🏃 Running the Application

### Development Mode
Runs the application with hot-reloading using `nodemon`:
```bash
npm run dev
```

### Production Mode
Starts the application using standard Node.js execution:
```bash
npm start
```
The server will bind to the configured port (default: `4000`).

---

## 📘 Interactive API Documentation

Once the server is running, you can access the interactive Swagger API documentation to inspect and invoke endpoints directly:
*   **URL**: [http://localhost:4000/api-docs](http://localhost:4000/api-docs)

---

## ⚡ Real-Time Socket Connections

A custom socket client dashboard is served directly from the API backend to test real-time WebSockets without dealing with CORS issues.
1. Start your local server (`npm run dev`).
2. Visit [http://localhost:4000/test-socket](http://localhost:4000/test-socket) in your web browser.
3. Authenticate using your JWT access token (obtained from login/register response).
4. Watch live notification events:
    *   `taskCreated`: Emitted to team members when a task is created.
    *   `taskAssigned`: Emitted to the assigned user.
    *   `taskUpdated`: Emitted to team members when a task is edited.
    *   `taskDeleted`: Emitted to team members when a task is removed.

---

## 🧪 Testing

The repository includes both unit/integration tests (using Jest) and an end-to-end verification script.

### Running Jest Integration Tests
Runs the automated tests using Jest. (Ensure you have bootstrapped the database first, as Jest logs in using the seeded admin).
```bash
npm test
```

### Running E2E Verification Tests
To run the end-to-end API scenario validator, make sure your server is running (`npm run dev`) and then run:
```bash
node test_api.js
```
This script will register new managers and users, create teams, assign tasks, and verify that the status codes and payloads align with system specifications.
## Additional Documentation

The following documents are included in this repository:

- **API_OVERVIEW.md** – Complete API endpoint overview with request/response examples.
- **ASSUMPTIONS.md** – Implementation assumptions, design decisions, and additional features beyond the assignment requirements.