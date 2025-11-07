import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { setupNotificationEvents } from "./events/notificationEvents";

export function initializeSocket(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  console.log("🔌 Socket.io initialized");

  io.on("connection", (socket: Socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    socket.emit("welcome", {
      message: "Welcome to Blog Platform!",
      socketId: socket.id,
    });

    socket.on("ping", () => {
      console.log(`📡 Ping received from ${socket.id}`);
      socket.emit("pong", { message: "Server is alive!" });
    });

    // Setup notification event handlers
    setupNotificationEvents(io, socket);

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });

  return io;
}

export default initializeSocket;
