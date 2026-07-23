import swaggerJSDoc from "swagger-jsdoc";
import swaggerConfig from "../config/swagger.js";

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password@123
 *               role:
 *                 type: string
 *                 enum: [admin, manager, user]
 *                 example: user
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "User registered successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request (validation errors, user already exists)
 *       500:
 *         description: Internal server error
 * 
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [login, password]
 *             properties:
 *               login:
 *                 type: string
 *                 description: Username or email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password@123
 *     responses:
 *       200:
 *         description: Login successful, returns access & refresh tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Login successful" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string, example: "eyJhbGciOiJIUzI1NiIsIn..." }
 *                     refreshToken: { type: string, example: "eyJhbGciOiJIUzI1NiIsIn..." }
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 * 
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh Access Token using a Refresh Token (Token Rotation)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsIn..."
 *     responses:
 *       200:
 *         description: Tokens rotated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Tokens refreshed successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *                     refreshToken: { type: string }
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Invalid/Expired refresh token)
 * 
 * /api/auth/logout:
 *   post:
 *     summary: Log out authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsIn..."
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Logged out successfully" }
 *       401:
 *         description: Unauthorized
 * 
 * /api/auth/profile:
 *   get:
 *     summary: Retrieve profile of authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Profile retrieved successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 * 
 * /api/auth/send-otp:
 *   post:
 *     summary: Resend a verification OTP to an email address
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: OTP code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "OTP code sent successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     email: { type: string, example: "john@example.com" }
 *                     expiresAt: { type: string, example: "2026-07-23T20:00:00.000Z" }
 *       400:
 *         description: Bad request (validation errors)
 *       404:
 *         description: User not found
 * 
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify email address using a 6-digit OTP code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               code:
 *                 type: string
 *                 length: 6
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Email verified successfully. You can now login." }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid or expired OTP code
 *       404:
 *         description: User not found
 * 
 * /api/users:
 *   get:
 *     summary: Retrieve list of all users [Admin Only]
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Users retrieved successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 * 
 * /api/users/{id}:
 *   get:
 *     summary: Retrieve specific user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Manager restricted to team, user to self)
 *       404:
 *         description: User not found
 * 
 * /api/users/{id}/role:
 *   patch:
 *     summary: Update user's role and team assignment [Admin Only]
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, manager, user]
 *               teamId:
 *                 type: string
 *                 nullable: true
 *                 example: "64b0f3e2fc13ae2c48000001"
 *     responses:
 *       200:
 *         description: Role/team updated successfully
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: User not found
 * 
 * /api/teams:
 *   post:
 *     summary: Create a new team [Admin Only]
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, managerId]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Engineering
 *               managerId:
 *                 type: string
 *                 example: "64b0f3e2fc13ae2c48000002"
 *     responses:
 *       201:
 *         description: Team created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   get:
 *     summary: Retrieve list of all teams [Admin/Manager]
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved teams list (managers see only their own team)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * 
 * /api/teams/{id}:
 *   get:
 *     summary: Retrieve specific team details [Admin/Manager]
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Team not found
 * 
 * /api/teams/{id}/members:
 *   patch:
 *     summary: Add or remove user from team [Admin/Manager]
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action, userId]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [add, remove]
 *                 example: add
 *               userId:
 *                 type: string
 *                 example: "64b0f3e2fc13ae2c48000003"
 *     responses:
 *       200:
 *         description: Membership updated successfully
 *       400:
 *         description: Bad request (validation or team constraints)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Team or User not found
 * 
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, dueDate]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Design API architecture
 *               description:
 *                 type: string
 *                 example: Write Swagger docs and design database models
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-12-31T23:59:59.000Z"
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 example: medium
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed]
 *                 example: pending
 *               assignedTo:
 *                 type: string
 *                 nullable: true
 *                 example: "64b0f3e2fc13ae2c48000003"
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (role constraints)
 *   get:
 *     summary: Retrieve list of tasks (supports pagination, filtering, searching, sorting)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *       - in: query
 *         name: dueDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Retrieve tasks due on this specific date (YYYY-MM-DD)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search tasks by keywords in title or description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: "dueDate:desc"
 *         description: Sort task field and order (e.g. createdAt:asc, dueDate:desc)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *       401:
 *         description: Unauthorized
 * 
 * /api/tasks/assigned:
 *   get:
 *     summary: View tasks assigned to the authenticated user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assigned tasks retrieved successfully
 *       401:
 *         description: Unauthorized
 * 
 * /api/tasks/{id}:
 *   put:
 *     summary: Update task details
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed]
 *               assignedTo:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (access constraints)
 *       404:
 *         description: Task not found
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (only creators, managers, or admins can delete)
 *       404:
 *         description: Task not found
 * 
 * /api/tasks/{id}/assign:
 *   patch:
 *     summary: Update task assignment [Admin/Manager]
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assignedTo]
 *             properties:
 *               assignedTo:
 *                 type: string
 *                 example: "64b0f3e2fc13ae2c48000003"
 *     responses:
 *       200:
 *         description: Task assigned successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task or User not found
 * 
 * /api/analytics/status:
 *   get:
 *     summary: Retrieve status distribution counts of tasks
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status counts calculated successfully
 *       401:
 *         description: Unauthorized
 * 
 * /api/analytics/statistics:
 *   get:
 *     summary: Retrieve task statistics grouped by user and team
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Completion statistics calculated successfully
 *       401:
 *         description: Unauthorized
 */

const swaggerSpec = swaggerJSDoc(swaggerConfig);

export default swaggerSpec;
