import { createServer } from "http";
import app from "./app";
import initializeSocket from "./socket";

const PORT = process.env.PORT || 5000;

// Create HTTP server from Express app
const httpServer = createServer(app);

// Initialize Socket.io
const io = initializeSocket(httpServer);

// Make io available to the app
app.set("io", io);

// Start server
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔌 Socket.io ready for connections`);
});
