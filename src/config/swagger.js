const PORT = process.env.PORT || 4000;

export default {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Management System API",
      version: "1.0.0",
      description: "A comprehensive RESTful API for managing tasks, teams, and user profiles with JWT authentication, role-based access control, analytics, and real-time socket events.",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/utils/swagger.js"], // Scan our centralized Swagger JSDoc references
};
