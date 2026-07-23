import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/db/db.js";
import http from "http";
import { initSocket } from "./src/services/socketService.js";
import { initCache } from "./src/services/cacheService.js";

const startServer = async () => {
  try {
    // 1. Connect to database
    await connectDB();

    // 2. Initialize optional Redis cache service
    await initCache();

    // 3. Create HTTP server wrapper around Express app
    const server = http.createServer(app);

    // 4. Initialize Socket.io WS listener
    initSocket(server);

    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Interactive API Docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("Critical server startup failure:", error);
    process.exit(1);
  }
};

startServer();
