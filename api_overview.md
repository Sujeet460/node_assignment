# Task Management System API Overview

This document provides a comprehensive overview of the REST API endpoints, including authorization rules, request payloads, response formats, and usage examples.

---

## 🔑 Global Configuration & Conventions

*   **Base URL**: `http://localhost:4000/api`
*   **Default Content-Type**: `application/json`
*   **Authentication**: Bearer Token mechanism (`Authorization: Bearer <access_token>`).
*   **Response Structure**:
    All API responses follow a unified wrapper structure:
    ```json
    {
      "success": true,
      "message": "Action-specific success message",
      "data": { ... }
    }
    ```
    If there is a validation or server error:
    ```json
    {
      "success": false,
      "message": "Error description message",
      "errors": [ ... ]
    }
    ```

---

## 🔒 Role-Based Access Control (RBAC)

The application supports three roles defined in [roles.js](file:///c:/Users/Kishan%20kumar%20singh/Desktop/node.js%20assignment/src/constants/roles.js):
1.  `admin`: Complete global control. Can assign/update roles, register managers, create teams, and manage all tasks.
2.  `manager`: Assigned to a team. Can add/remove members to/from their team, and create/update/delete/assign tasks *within their team*.
3.  `user`: Standard employee. Can update only the `status` of tasks assigned to them, and view their assigned tasks.

---

## 🗂️ Endpoints Directory

### 1. Authentication & Profiling (`/api/auth`)

#### 🔹 Register a User
*   **Method / Route**: `POST /api/auth/register`
*   **Authentication**: Optional. If called by an authenticated `admin`, they can specify the `role` field.
*   **Rate Limited**: Yes (`authLimiter`)
*   **Payload Validation**:
    *   `username`: Alphanumeric, 3-30 characters (Required)
    *   `email`: Valid email format (Required)
    *   `password`: Minimum 8 characters; must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (Required)
    *   `role`: Either `admin`, `manager`, or `user` (Optional, restricted to `admin` caller)
*   **Example Request**:
    ```json
    {
      "username": "johndoe",
      "email": "johndoe@example.com",
      "password": "SecurePassword@123"
    }
    ```
*   **Example Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "data": {
        "user": {
          "id": "64b0f9257e8d35678fa42012",
          "username": "johndoe",
          "email": "johndoe@example.com",
          "role": "user",
          "team": null,
          "isVerified": false
        }
      }
    }
    ```

#### 🔹 User Login
*   **Method / Route**: `POST /api/auth/login`
*   **Authentication**: None
*   **Rate Limited**: Yes (`authLimiter`)
*   **Payload Validation**:
    *   `login`: Username or email (Required)
    *   `password`: (Required)
*   **Example Request**:
    ```json
    {
      "login": "johndoe@example.com",
      "password": "SecurePassword@123"
    }
    ```
*   **Example Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Login successful",
      "data": {
        "user": {
          "id": "64b0f9257e8d35678fa42012",
          "username": "johndoe",
          "email": "johndoe@example.com",
          "role": "user"
        },
        "accessToken": "eyJhbGciOi...",
        "refreshToken": "d8f4b7a1..."
      }
    }
    ```

#### 🔹 User Logout
*   **Method / Route**: `POST /api/auth/logout`
*   **Authentication**: Required (Any role)
*   **Payload**:
    *   `refreshToken`: The token associated with the session (Required)
*   **Example Request**:
    ```json
    {
      "refreshToken": "d8f4b7a1..."
    }
    ```
*   **Example Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Logged out successfully"
    }
    ```

#### 🔹 Refresh Tokens (Token Rotation)
*   **Method / Route**: `POST /api/auth/refresh`
*   **Authentication**: None (Requires valid refresh token in body)
*   **Rate Limited**: Yes (`authLimiter`)
*   **Example Request**:
    ```json
    {
      "refreshToken": "d8f4b7a1..."
    }
    ```
*   **Example Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Tokens refreshed successfully",
      "data": {
        "accessToken": "new_eyJhbGciOi...",
        "refreshToken": "new_d8f4b7a1..."
      }
    }
    ```

#### 🔹 Get Profile
*   **Method / Route**: `GET /api/auth/profile`
*   **Authentication**: Required (Any role)
*   **Example Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Profile retrieved successfully",
      "data": {
        "user": {
          "id": "64b0f9257e8d35678fa42012",
          "username": "johndoe",
          "email": "johndoe@example.com",
          "role": "user",
          "team": {
            "id": "64b0f9c27e8d35678fa4201f",
            "name": "Engineering Team"
          },
          "isVerified": true
        }
      }
    }
    ```

#### 🔹 Send Email OTP (Verification Request)
*   **Method / Route**: `POST /api/auth/send-otp`
*   **Authentication**: None
*   **Rate Limited**: Yes (`authLimiter`)
*   **Payload Validation**:
    *   `email`: Valid email address (Required)
*   **Example Request**:
    ```json
    {
      "email": "johndoe@example.com"
    }
    ```
*   **Example Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "OTP code sent successfully",
      "data": {
        "email": "johndoe@example.com"
      }
    }
    ```

#### 🔹 Verify OTP Code
*   **Method / Route**: `POST /api/auth/verify-otp`
*   **Authentication**: None
*   **Rate Limited**: Yes (`authLimiter`)
*   **Payload Validation**:
    *   `email`: Valid email address (Required)
    *   `code`: 6-digit numeric string (Required)
*   **Example Request**:
    ```json
    {
      "email": "johndoe@example.com",
      "code": "528941"
    }
    ```
*   **Example Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Email verified successfully. You can now login.",
      "data": {
        "user": {
          "id": "64b0f9257e8d35678fa42012",
          "username": "johndoe",
          "email": "johndoe@example.com",
          "isVerified": true
        }
      }
    }
    ```

---

### 2. User Management (`/api/users`)

#### 🔹 Get All Users (Paginated)
*   **Method / Route**: `GET /api/users`
*   **Authentication**: Required (`admin` only)
*   **Query Parameters**:
    *   `page`: Page index (Default: `1`)
    *   `limit`: Items per page (Default: `10`, Max: `100`)
*   **Example Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Users retrieved successfully",
      "data": {
        "users": [
          {
            "id": "64b0f9257e8d35678fa42012",
            "username": "johndoe",
            "email": "johndoe@example.com",
            "role": "user",
            "team": "64b0f9c27e8d35678fa4201f"
          }
        ],
        "pagination": {
          "total": 1,
          "page": 1,
          "limit": 10,
          "pages": 1
        }
      }
    }
    ```

#### 🔹 Get User by ID
*   **Method / Route**: `GET /api/users/:id`
*   **Authentication**: Required (`admin`, `manager`, or the owner user)
*   **Scope Rule**: Managers can only retrieve users belonging to their team.
*   **Example Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "User details retrieved successfully",
      "data": {
        "user": {
          "id": "64b0f9257e8d35678fa42012",
          "username": "johndoe",
          "email": "johndoe@example.com",
          "role": "user",
          "team": {
            "id": "64b0f9c27e8d35678fa4201f",
            "name": "Engineering Team"
          }
        }
      }
    }
    ```

#### 🔹 Update User Role and Team Assignments
*   **Method / Route**: `PATCH /api/users/:id/role`
*   **Authentication**: Required (`admin` only)
*   **Payload Validation**:
    *   `role`: Optional string (`admin`, `manager`, `user`)
    *   `teamId`: Optional string (Team MongoDB ObjectId) or `null` to detach
*   **Example Request**:
    ```json
    {
      "role": "manager",
      "teamId": "64b0f9c27e8d35678fa4201f"
    }
    ```
*   **Example Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "User role and team updated successfully",
      "data": {
        "user": {
          "id": "64b0f9257e8d35678fa42012",
          "username": "johndoe",
          "email": "johndoe@example.com",
          "role": "manager",
          "team": {
            "id": "64b0f9c27e8d35678fa4201f",
            "name": "Engineering Team"
          }
        }
      }
    }
    ```

---

### 3. Team Management (`/api/teams`)

#### 🔹 Create a Team
*   **Method / Route**: `POST /api/teams`
*   **Authentication**: Required (`admin` only)
*   **Payload Validation**:
    *   `name`: Unique team name (Required)
    *   `managerId`: ID of user designated as team manager (Required). The manager must have the `manager` or `admin` role.
*   **Example Request**:
    ```json
    {
      "name": "QA Team",
      "managerId": "64b0f9257e8d35678fa42012"
    }
    ```
*   **Example Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Team created successfully",
      "data": {
        "team": {
          "id": "64b0f9c27e8d35678fa4201f",
          "name": "QA Team",
          "manager": {
            "id": "64b0f9257e8d35678fa42012",
            "username": "johndoe",
            "email": "johndoe@example.com"
          },
          "members": [
            {
              "id": "64b0f9257e8d35678fa42012",
              "username": "johndoe"
            }
          ]
        }
      }
    }
    ```

#### 🔹 Get All Teams
*   **Method / Route**: `GET /api/teams`
*   **Authentication**: Required (`admin` or `manager`)
*   **Scope Rule**: Managers only see the team they manage. Admins see all.
*   **Example Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Teams retrieved successfully",
      "data": {
        "teams": [
          {
            "id": "64b0f9c27e8d35678fa4201f",
            "name": "QA Team",
            "manager": {
              "id": "64b0f9257e8d35678fa42012",
              "username": "johndoe",
              "email": "johndoe@example.com"
            },
            "members": [
              {
                "id": "64b0f9257e8d35678fa42012",
                "username": "johndoe"
              }
            ]
          }
        ]
      }
    }
    ```

#### 🔹 Get Team by ID
*   **Method / Route**: `GET /api/teams/:id`
*   **Authentication**: Required (`admin` or team `manager`)
*   **Example Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Team details retrieved successfully",
      "data": {
        "team": {
          "id": "64b0f9c27e8d35678fa4201f",
          "name": "QA Team",
          "manager": {
            "id": "64b0f9257e8d35678fa42012",
            "username": "johndoe",
            "email": "johndoe@example.com"
          },
          "members": [...]
        }
      }
    }
    ```

#### 🔹 Add/Remove Members to/from Team
*   **Method / Route**: `PATCH /api/teams/:id/members`
*   **Authentication**: Required (`admin` or team `manager`)
*   **Payload Validation**:
    *   `action`: String; must be either `"add"` or `"remove"` (Required)
    *   `userId`: Target user's MongoDB ObjectId (Required)
*   **Scope Rule**: Managers cannot remove themselves from their own team.
*   **Example Request**:
    ```json
    {
      "action": "add",
      "userId": "64b0fa037e8d35678fa42023"
    }
    ```
*   **Example Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "User successfully added to team",
      "data": {
        "team": {
          "id": "64b0f9c27e8d35678fa4201f",
          "name": "QA Team",
          "members": [
            { "id": "64b0f9257e8d35678fa42012", "username": "johndoe" },
            { "id": "64b0fa037e8d35678fa42023", "username": "alice" }
          ]
        }
      }
    }
    ```

---

### 4. Task Management (`/api/tasks`)

#### 🔹 Create a Task
*   **Method / Route**: `POST /api/tasks`
*   **Authentication**: Required (Any role)
*   **Payload Validation**:
    *   `title`: Max 100 characters (Required)
    *   `description`: Max 1000 characters (Optional)
    *   `dueDate`: Future ISO-8601 Date (Required)
    *   `priority`: `"low"`, `"medium"`, or `"high"` (Default: `"medium"`)
    *   `status`: `"pending"`, `"in_progress"`, or `"completed"` (Default: `"pending"`)
    *   `assignedTo`: Valid User ObjectId (Optional)
*   **Scope Rules**:
    *   Managers can only assign tasks to users who are members of their managed team.
    *   Standard users can only assign tasks to themselves.
*   **Example Request**:
    ```json
    {
      "title": "Set up unit test suites",
      "description": "Configure jest and code coverage reports",
      "dueDate": "2026-08-30T12:00:00.000Z",
      "priority": "high",
      "assignedTo": "64b0fa037e8d35678fa42023"
    }
    ```
*   **Example Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Task created successfully",
      "data": {
        "task": {
          "id": "64b0fbaf7e8d35678fa42050",
          "title": "Set up unit test suites",
          "description": "Configure jest and code coverage reports",
          "status": "pending",
          "priority": "high",
          "dueDate": "2026-08-30T12:00:00.000Z",
          "assignedTo": {
            "id": "64b0fa037e8d35678fa42023",
            "username": "alice",
            "email": "alice@example.com"
          },
          "createdBy": {
            "id": "64b0f9257e8d35678fa42012",
            "username": "johndoe",
            "email": "johndoe@example.com"
          },
          "team": {
            "id": "64b0f9c27e8d35678fa4201f",
            "name": "QA Team"
          }
        }
      }
    }
    ```

#### 🔹 Get All Tasks (Filtered & Paginated)
*   **Method / Route**: `GET /api/tasks`
*   **Authentication**: Required (Any role)
*   **Scope Rules**:
    *   Admins see all tasks globally.
    *   Managers see tasks they created, tasks assigned to them, or tasks bound to their team.
    *   Standard users see tasks they created or tasks assigned to them.
*   **Query Parameters**:
    *   `status`: Filter by `"pending"`, `"in_progress"`, or `"completed"`
    *   `priority`: Filter by `"low"`, `"medium"`, or `"high"`
    *   `dueDate`: Filter by specific date (matches the full day)
    *   `search`: Text search matches on `title` or `description`
    *   `sortBy`: Format `field:asc` or `field:desc` (e.g., `dueDate:asc`, `createdAt:desc`)
    *   `page`: Page index (Default: `1`)
    *   `limit`: Items per page (Default: `10`)
*   **Example Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Tasks retrieved successfully",
      "data": {
        "tasks": [ ... ],
        "pagination": {
          "total": 12,
          "page": 1,
          "limit": 10,
          "pages": 2
        }
      }
    }
    ```

#### 🔹 Get Assigned Tasks for Current User
*   **Method / Route**: `GET /api/tasks/assigned`
*   **Authentication**: Required (Any role)
*   **Example Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Assigned tasks retrieved successfully",
      "data": {
        "tasks": [
          {
            "id": "64b0fbaf7e8d35678fa42050",
            "title": "Set up unit test suites",
            "status": "pending",
            "priority": "high",
            "dueDate": "2026-08-30T12:00:00.000Z",
            "assignedTo": "64b0fa037e8d35678fa42023",
            "createdBy": {
              "id": "64b0f9257e8d35678fa42012",
              "username": "johndoe",
              "email": "johndoe@example.com"
            },
            "team": {
              "id": "64b0f9c27e8d35678fa4201f",
              "name": "QA Team"
            }
          }
        ]
      }
    }
    ```

#### 🔹 Update a Task
*   **Method / Route**: `PUT /api/tasks/:id`
*   **Authentication**: Required (Any role)
*   **Scope & Permissions Rules**:
    *   `admin` / Creator / Team Manager: Full update privileges (title, description, priority, dueDate, assignedTo, status).
    *   Assigned user (who is not the creator): Can **only** update the `status` field.
*   **Example Request (User update status)**:
    ```json
    {
      "status": "completed"
    }
    ```
*   **Example Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Task updated successfully",
      "data": {
        "task": {
          "id": "64b0fbaf7e8d35678fa42050",
          "title": "Set up unit test suites",
          "status": "completed",
          ...
        }
      }
    }
    ```

#### 🔹 Reassign a Task
*   **Method / Route**: `PATCH /api/tasks/:id/assign`
*   **Authentication**: Required (`admin` or team `manager`)
*   **Payload Validation**:
    *   `assignedTo`: Valid User ObjectId (Required)
*   **Scope Rule**: Managers can only assign tasks to users who are members of their managed team.
*   **Example Request**:
    ```json
    {
      "assignedTo": "64b0fa037e8d35678fa42023"
    }
    ```
*   **Example Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Task assigned successfully",
      "data": {
        "task": { ... }
      }
    }
    ```

#### 🔹 Delete a Task
*   **Method / Route**: `DELETE /api/tasks/:id`
*   **Authentication**: Required (`admin`, creator, or team `manager`)
*   **Example Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Task deleted successfully",
      "data": {
        "task": { ... }
      }
    }
    ```

---

### 5. Analytics Management (`/api/analytics`)

#### 🔹 Get Status Counts Distribution
*   **Method / Route**: `GET /api/analytics/status`
*   **Authentication**: Required (Any role)
*   **Scope Rule**: Automatically aggregates data conforming to the user's role scope (Admins see global, Managers see team, Users see self).
*   **Calculated Metrics**:
    *   `completed`: Tasks with status `"completed"`
    *   `pending`: Tasks with status `"pending"` or `"in_progress"` whose due date is in the future.
    *   `overdue`: Tasks with status not `"completed"` whose due date is in the past.
    *   `total`: Count of all visible tasks.
*   **Example Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Task status distribution counts calculated successfully",
      "data": {
        "completed": 5,
        "pending": 3,
        "overdue": 2,
        "total": 10
      }
    }
    ```

#### 🔹 Get Completion Statistics (By User & Team)
*   **Method / Route**: `GET /api/analytics/statistics`
*   **Authentication**: Required (Any role)
*   **Scope Rule**: Returns aggregated completion counts broken down by assignee and by team.
*   **Example Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Task completion statistics calculated successfully",
      "data": {
        "byUser": [
          {
            "userId": "64b0fa037e8d35678fa42023",
            "username": "alice",
            "email": "alice@example.com",
            "completed": 4,
            "pending": 2,
            "overdue": 1,
            "total": 7
          }
        ],
        "byTeam": [
          {
            "teamId": "64b0f9c27e8d35678fa4201f",
            "teamName": "QA Team",
            "completed": 5,
            "pending": 3,
            "overdue": 2,
            "total": 10
          }
        ]
      }
    }
    ```

---

## ⚡ WebSocket Real-Time Events

Real-time changes trigger socket broadcasts to clients in specific user and team rooms:

| Socket Event Name | Room Scope | Payload Event Struct | Description |
| :--- | :--- | :--- | :--- |
| `task_changed` | User room (`userId`), Team room (`teamId`), Global broadcast | `{ action: "create", task: TaskDTO }` | Triggered when a new task is created. |
| `task_changed` | User room (`userId`), Team room (`teamId`), Global broadcast | `{ action: "update", task: TaskDTO }` | Triggered when a task's fields or status are modified. |
| `task_changed` | User room (`userId`), Team room (`teamId`), Global broadcast | `{ action: "assign", task: TaskDTO }` | Triggered when a task is reassigned. |
| `task_changed` | User room (`userId`), Team room (`teamId`), Global broadcast | `{ action: "delete", taskId: String }` | Triggered when a task is deleted. |
