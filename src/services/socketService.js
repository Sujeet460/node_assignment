import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Authentication middleware for Socket.io connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error("Authentication error: Token required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    console.log(`User connected to WebSocket: ${socket.user.username} (${userId})`);

    // Join room for user-specific notifications
    socket.join(`user_${userId}`);

    // Join room for team-specific notifications
    if (socket.user.team) {
      const teamId = socket.user.team.toString();
      socket.join(`team_${teamId}`);
      console.log(`User ${socket.user.username} joined team room: team_${teamId}`);
    }

    socket.on("disconnect", () => {
      console.log(`User disconnected from WebSocket: ${socket.user.username} (${userId})`);
    });
  });

  return io;
};

const notifyUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId.toString()}`).emit(event, data);
  }
};

const notifyTeam = (teamId, event, data) => {
  if (io && teamId) {
    io.to(`team_${teamId.toString()}`).emit(event, data);
  }
};

const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

export { initSocket, notifyUser, notifyTeam, broadcast };
