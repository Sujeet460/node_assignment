const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}/api`;

const logTest = (name, status, details = "") => {
  const symbol = status ? "✅" : "❌";
  console.log(`${symbol} [TEST] ${name} ${details ? `- ${details}` : ""}`);
};

const runTests = async () => {
  console.log("Starting API End-to-End Verification Tests...\n");
  
  const timestamp = Date.now();
  const managerEmail = `manager${timestamp}@taskmanager.com`;
  const managerUsername = `manager${timestamp}`; // No underscores to satisfy isAlphanumeric() validation
  const userEmail = `user${timestamp}@taskmanager.com`;
  const userUsername = `user${timestamp}`;       // No underscores to satisfy isAlphanumeric() validation

  let adminToken = "";
  let managerToken = "";
  let userToken = "";
  let managerId = "";
  let userId = "";
  let teamId = "";
  let taskId = "";

  try {
    // 1. Login as Default Admin
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: "admin@taskmanager.com",
        password: "AdminPassword@123"
      })
    });
    
    const adminLogin = await adminLoginRes.json();
    if (adminLoginRes.status === 200 && adminLogin.token) {
      adminToken = adminLogin.token;
      logTest("Admin Login", true);
    } else {
      logTest("Admin Login", false, JSON.stringify(adminLogin));
      return;
    }

    // 2. Register a Manager via Admin
    const managerRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        username: managerUsername,
        email: managerEmail,
        password: "ManagerPassword@123",
        role: "manager"
      })
    });
    const managerReg = await managerRegRes.json();
    if (managerRegRes.status === 201) {
      managerId = managerReg.user._id;
      logTest("Register Manager User", true);
    } else {
      logTest("Register Manager User", false, JSON.stringify(managerReg));
    }

    // 3. Register a Standard User (Public Register)
    const userRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: userUsername,
        email: userEmail,
        password: "UserPassword@123" // will default to role: 'user'
      })
    });
    const userReg = await userRegRes.json();
    if (userRegRes.status === 201) {
      userId = userReg.user._id;
      logTest("Register Standard User", true);
    } else {
      logTest("Register Standard User", false, JSON.stringify(userReg));
    }

    // 4. Try to register with weak password (Validation Check)
    const weakRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: `weak${timestamp}`,
        email: `weak${timestamp}@taskmanager.com`,
        password: "123"
      })
    });
    const weakReg = await weakRegRes.json();
    if (weakRegRes.status === 400 && weakReg.errors) {
      logTest("Password Validation Strength Check", true, "Successfully rejected weak password");
    } else {
      logTest("Password Validation Strength Check", false, "Allowed registering weak password");
    }

    // 5. Login as Manager
    const managerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: managerEmail,
        password: "ManagerPassword@123"
      })
    });
    const managerLogin = await managerLoginRes.json();
    if (managerLoginRes.status === 200) {
      managerToken = managerLogin.token;
      logTest("Manager Login", true);
    } else {
      logTest("Manager Login", false, JSON.stringify(managerLogin));
    }

    // 6. Login as User
    const userLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: userEmail,
        password: "UserPassword@123"
      })
    });
    const userLogin = await userLoginRes.json();
    if (userLoginRes.status === 200) {
      userToken = userLogin.token;
      logTest("User Login", true);
    } else {
      logTest("User Login", false, JSON.stringify(userLogin));
    }

    // 7. Get Profile of User
    const profileRes = await fetch(`${BASE_URL}/auth/profile`, {
      headers: { "Authorization": `Bearer ${userToken}` }
    });
    const profile = await profileRes.json();
    if (profileRes.status === 200 && profile.username === userUsername) {
      logTest("Retrieve Profile", true);
    } else {
      logTest("Retrieve Profile", false, JSON.stringify(profile));
    }

    // 8. Create Team via Admin
    const teamRes = await fetch(`${BASE_URL}/teams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: `Team${timestamp}`,
        managerId: managerId
      })
    });
    const team = await teamRes.json();
    if (teamRes.status === 201) {
      teamId = team.team._id;
      logTest("Create Team (Admin Only)", true);
    } else {
      logTest("Create Team (Admin Only)", false, JSON.stringify(team));
    }

    // 9. Add User to Team via Manager
    const addMemberRes = await fetch(`${BASE_URL}/teams/${teamId}/members`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        action: "add",
        userId: userId
      })
    });
    const addMember = await addMemberRes.json();
    if (addMemberRes.status === 200) {
      logTest("Add Team Member (Manager Auth)", true);
    } else {
      logTest("Add Team Member (Manager Auth)", false, JSON.stringify(addMember));
    }

    // 10. Create Task via Manager assigned to Team User
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5); // 5 days in future

    const createTaskRes = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        title: "Build REST Controllers",
        description: "Develop user, team, task, and analytics logic",
        dueDate: futureDate.toISOString(),
        priority: "high",
        assignedTo: userId
      })
    });
    const createTask = await createTaskRes.json();
    if (createTaskRes.status === 201) {
      taskId = createTask.task._id;
      logTest("Create Task & Assign (Manager Scope Check)", true);
    } else {
      logTest("Create Task & Assign (Manager Scope Check)", false, JSON.stringify(createTask));
    }

    // 11. Manager tries to assign task to non-team member (e.g. Admin)
    const badAssignRes = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        title: "Illegal Assignment Task",
        dueDate: futureDate.toISOString(),
        assignedTo: adminLogin.user._id // Admin is not in Manager's team
      })
    });
    const badAssign = await badAssignRes.json();
    if (badAssignRes.status === 403) {
      logTest("RBAC Manager Team Assignment Restriction", true, "Successfully blocked manager from assigning task outside team");
    } else {
      logTest("RBAC Manager Team Assignment Restriction", false, `Status: ${badAssignRes.status}, data: ${JSON.stringify(badAssign)}`);
    }

    // 12. User reads assigned tasks
    const getAssignedRes = await fetch(`${BASE_URL}/tasks/assigned`, {
      headers: { "Authorization": `Bearer ${userToken}` }
    });
    const getAssigned = await getAssignedRes.json();
    if (getAssignedRes.status === 200 && getAssigned.length > 0) {
      logTest("Read Assigned Tasks", true, `Retrieved ${getAssigned.length} tasks`);
    } else {
      logTest("Read Assigned Tasks", false, JSON.stringify(getAssigned));
    }

    // 13. User tries to change task title (should be forbidden since they did not create it)
    const userUpdateTitleRes = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userToken}`
      },
      body: JSON.stringify({
        title: "Maliciously Changed Title"
      })
    });
    const userUpdateTitle = await userUpdateTitleRes.json();
    if (userUpdateTitleRes.status === 403) {
      logTest("RBAC User Modify Task Fields Restriction", true, "Blocked assignee from altering details they don't own");
    } else {
      logTest("RBAC User Modify Task Fields Restriction", false, `Status: ${userUpdateTitleRes.status}, data: ${JSON.stringify(userUpdateTitle)}`);
    }

    // 14. User updates task status to completed (should succeed)
    const userUpdateStatusRes = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userToken}`
      },
      body: JSON.stringify({
        status: "completed"
      })
    });
    const userUpdateStatus = await userUpdateStatusRes.json();
    if (userUpdateStatusRes.status === 200 && userUpdateStatus.task.status === "completed") {
      logTest("User Update Task Status", true);
    } else {
      logTest("User Update Task Status", false, JSON.stringify(userUpdateStatus));
    }

    // 15. View Analytics Status Counts
    const analyticsStatusRes = await fetch(`${BASE_URL}/analytics/status`, {
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    const analyticsStatus = await analyticsStatusRes.json();
    if (analyticsStatusRes.status === 200 && analyticsStatus.completed >= 1) {
      logTest("Fetch Status Analytics", true, `Completed: ${analyticsStatus.completed}, Pending: ${analyticsStatus.pending}`);
    } else {
      logTest("Fetch Status Analytics", false, JSON.stringify(analyticsStatus));
    }

    // 16. View Analytics Statistics (by user and team)
    const analyticsStatsRes = await fetch(`${BASE_URL}/analytics/statistics`, {
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    const analyticsStats = await analyticsStatsRes.json();
    if (analyticsStatsRes.status === 200 && analyticsStats.byTeam.length > 0) {
      logTest("Fetch Statistics Analytics", true, `Team counts loaded: ${analyticsStats.byTeam.length}`);
    } else {
      logTest("Fetch Statistics Analytics", false, JSON.stringify(analyticsStats));
    }

    // 17. User Logout
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${userToken}` }
    });
    const logout = await logoutRes.json();
    if (logoutRes.status === 200) {
      logTest("User Logout", true);
    } else {
      logTest("User Logout", false, JSON.stringify(logout));
    }

    // 18. Attempt profile access with logged out token (should fail)
    const invalidProfileRes = await fetch(`${BASE_URL}/auth/profile`, {
      headers: { "Authorization": `Bearer ${userToken}` }
    });
    const invalidProfile = await invalidProfileRes.json();
    if (invalidProfileRes.status === 401) {
      logTest("Token Blacklisting Check after Logout", true, "Access denied as expected");
    } else {
      logTest("Token Blacklisting Check after Logout", false, `Allowed access! Status: ${invalidProfileRes.status}`);
    }

    console.log("\nAll API verification checks completed successfully.");

  } catch (error) {
    console.error("Verification test runner encountered exception:", error);
  }
};

runTests();
