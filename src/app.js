import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import hpp from "hpp";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./utils/swagger.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
// Custom MongoDB query sanitization middleware (prevents MongoDB operator injection)
const mongoSanitizeMiddleware = (req, res, next) => {
  const clean = (obj) => {
    if (obj && typeof obj === "object") {
      for (const key in obj) {
        if (key.startsWith("$") || key.includes(".")) {
          delete obj[key];
        } else {
          clean(obj[key]);
        }
      }
    }
  };
  clean(req.body);
  clean(req.query);
  clean(req.params);
  next();
};

const app = express();

// Security and optimization middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(mongoSanitizeMiddleware); // Prevent MongoDB injection attacks safely
app.use(hpp());                  // Prevent HTTP Parameter Pollution
app.use(compression());          // Compress responses

// API Documentation Route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount Application Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/analytics", analyticsRoutes);

// API entry point
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Task Management System API!",
    data: {
      documentation: "/api-docs",
    },
  });
});

// Fallback Route Handler (404)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Mount the centralized global error handler middleware (must be last)
app.use(errorHandler);

export default app;