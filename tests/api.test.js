import mongoose from "mongoose";
import request from "supertest";
import dotenv from "dotenv";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Team from "../src/models/Team.js";
import Task from "../src/models/Task.js";
import Otp from "../src/models/Otp.js";

dotenv.config();

describe("Task Management API Integration Tests", () => {
  const timestamp = Date.now();
  const testAdminEmail = "admin@taskmanager.com";
  const testAdminPass = "AdminPassword@123";

  const managerEmail = `manager${timestamp}@testjest.com`;
  const managerUsername = `manager${timestamp}`;
  const userEmail = `user${timestamp}@testjest.com`;
  const userUsername = `user${timestamp}`;

  let adminToken = "";
  let managerToken = "";
  let userToken = "";
  let managerRefreshToken = "";
  let userRefreshToken = "";

  let managerId = "";
  let userId = "";
  let teamId = "";
  let taskId = "";

  beforeAll(async () => {
    // Connect database if not connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  }, 30000);

  afterAll(async () => {
    // Clean up test documents
    await User.deleteMany({ email: { $regex: /@testjest\.com$/ } });
    await Team.deleteMany({ name: { $regex: /^TeamJest/ } });
    await Task.deleteMany({ title: { $regex: /^TaskJest/ } });
    await Otp.deleteMany({ email: { $regex: /@testjest\.com$/ } });
    await mongoose.connection.close();
  }, 20000);

  describe("1. User Authentication (Registration, Login, Refresh, Logout)", () => {
    it("should login seeded admin successfully", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ login: testAdminEmail, password: testAdminPass });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("accessToken");
      adminToken = res.body.data.accessToken;
    });

    it("should reject weak password registration (Validation Check)", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          username: `weak${timestamp}`,
          email: `weak${timestamp}@testjest.com`,
          password: "123",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it("should register a manager user via Admin successfully", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          username: managerUsername,
          email: managerEmail,
          password: "ManagerPassword@123",
          role: "manager",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe("manager");
      managerId = res.body.data.user.id;
    });

    it("should register standard user publicly successfully", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          username: userUsername,
          email: userEmail,
          password: "UserPassword@123",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe("user");
      userId = res.body.data.user.id;
    });

    it("should fail to login if email is not verified", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ login: userEmail, password: "UserPassword@123" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("verify your email first");
    });

    it("should verify standard user email successfully via OTP", async () => {
      const otpDoc = await Otp.findOne({ email: userEmail });
      expect(otpDoc).toBeDefined();
      expect(otpDoc.code).toBeDefined();

      const res = await request(app)
        .post("/api/auth/verify-otp")
        .send({ email: userEmail, code: otpDoc.code });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.isVerified).toBe(true);
    });

    it("should login manager and return access and refresh tokens", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ login: managerEmail, password: "ManagerPassword@123" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("accessToken");
      expect(res.body.data).toHaveProperty("refreshToken");
      managerToken = res.body.data.accessToken;
      managerRefreshToken = res.body.data.refreshToken;
    });

    it("should login user successfully", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ login: userEmail, password: "UserPassword@123" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      userToken = res.body.data.accessToken;
      userRefreshToken = res.body.data.refreshToken;
    });

    it("should retrieve user profile (lazy-loaded caching test)", async () => {
      const res = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe(userUsername);
    });

    it("should rotate tokens using refresh token successfully", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: userRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("accessToken");
      expect(res.body.data).toHaveProperty("refreshToken");
      
      // Update tokens
      userToken = res.body.data.accessToken;
      userRefreshToken = res.body.data.refreshToken;
    });
  });

  describe("2. Team Management (RBAC)", () => {
    it("should allow Admin to create a team", async () => {
      const res = await request(app)
        .post("/api/teams")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: `TeamJest${timestamp}`,
          managerId: managerId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      teamId = res.body.data.team.id;
    });

    it("should deny standard User from creating a team (RBAC Enforcement)", async () => {
      const res = await request(app)
        .post("/api/teams")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          name: `TeamJestBad${timestamp}`,
          managerId: managerId,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should allow Manager of team to add members", async () => {
      const res = await request(app)
        .patch(`/api/teams/${teamId}/members`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          action: "add",
          userId: userId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("3. Task Management (CRUD & Assignments)", () => {
    it("should allow Manager to create task and assign to team member", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const res = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          title: `TaskJest${timestamp}`,
          description: "Perform testing verification checks",
          dueDate: futureDate.toISOString(),
          priority: "high",
          assignedTo: userId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      taskId = res.body.data.task.id;
    });

    it("should block Manager from assigning task outside team", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const anotherUserRes = await request(app)
        .post("/api/auth/register")
        .send({
          username: `outside${timestamp}`,
          email: `outside${timestamp}@testjest.com`,
          password: "OutsidePassword@123",
        });
      const outsideUserId = anotherUserRes.body.data.user.id;

      const res = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          title: `TaskJestBad${timestamp}`,
          dueDate: futureDate.toISOString(),
          assignedTo: outsideUserId,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should retrieve assigned tasks for standard user", async () => {
      const res = await request(app)
        .get("/api/tasks/assigned")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tasks.length).toBeGreaterThan(0);
    });

    it("should block reassigning a task to the same user", async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskId}/assign`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          assignedTo: userId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Task is already assigned to this user");
    });

    it("should deny standard User from updating task details (RBAC check)", async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          title: "Malicious title override attempt",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    }, 15000);

    it("should allow standard User to update status of assigned task", async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          status: "completed",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.status).toBe("completed");
    });
  });

  describe("4. Analytics Status & Stats", () => {
    it("should retrieve status analytics successfully", async () => {
      const res = await request(app)
        .get("/api/analytics/status")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.completed).toBeGreaterThanOrEqual(1);
    });

    it("should retrieve completion statistics successfully", async () => {
      const res = await request(app)
        .get("/api/analytics/statistics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.byTeam.length).toBeGreaterThan(0);
    });
  });

  describe("5. Token Invalidation (Logout)", () => {
    it("should logout user and blacklist token", async () => {
      const res = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ refreshToken: userRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should reject access using blacklisted token", async () => {
      const res = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
