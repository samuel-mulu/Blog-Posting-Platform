import { Server, Socket } from "socket.io";

/**
 * Handle notification-related socket events
 */
export function setupNotificationEvents(io: Server, socket: Socket) {
  /**
   * User joins a blog room to receive notifications for that blog
   * Room name: "blog_[blogId]"
   */
  socket.on("join_blog", (blogId: number) => {
    const room = `blog_${blogId}`;
    socket.join(room);
    console.log(`👤 User ${socket.id} joined room: ${room}`);

    socket.emit("joined_room", {
      message: `You joined blog ${blogId}`,
      room,
    });
  });

  /**
   * User leaves a blog room
   */
  socket.on("leave_blog", (blogId: number) => {
    const room = `blog_${blogId}`;
    socket.leave(room);
    console.log(`👋 User ${socket.id} left room: ${room}`);

    socket.emit("left_room", {
      message: `You left blog ${blogId}`,
      room,
    });
  });

  /**
   * User joins personal notification room
   * Room name: "user_[userId]"
   */
  socket.on("join_user_notifications", (userId: number) => {
    const room = `user_${userId}`;
    socket.join(room);
    console.log(`🔔 User ${socket.id} subscribed to notifications (${room})`);

    socket.emit("notifications_ready", {
      message: "You will receive personal notifications",
      userId,
    });
  });
}

/**
 * Broadcast new comment notification to blog room
 */
export function notifyNewComment(io: Server, blogId: number, comment: any) {
  const room = `blog_${blogId}`;

  io.to(room).emit("new_comment", {
    blogId,
    comment,
    message: "New comment added!",
    timestamp: new Date().toISOString(),
  });

  console.log(`📢 Broadcast new_comment to room: ${room}`);
}

/**
 * Broadcast new like notification to blog room
 */
export function notifyNewLike(io: Server, blogId: number, data: any) {
  const room = `blog_${blogId}`;

  io.to(room).emit("blog_liked", {
    blogId,
    liked: data.liked,
    message: data.liked
      ? "Someone liked this blog!"
      : "Someone unliked this blog!",
    timestamp: new Date().toISOString(),
  });

  console.log(`📢 Broadcast blog_liked to room: ${room}`);
}

/**
 * Broadcast new rating notification to blog room
 */
export function notifyNewRating(io: Server, blogId: number, rating: any) {
  const room = `blog_${blogId}`;

  io.to(room).emit("blog_rated", {
    blogId,
    rating: rating.ratingValue,
    message: `Someone rated this blog ${rating.ratingValue} stars!`,
    timestamp: new Date().toISOString(),
  });

  console.log(`📢 Broadcast blog_rated to room: ${room}`);
}

/**
 * Send personal notification to specific user
 */
export function notifyUser(io: Server, userId: number, notification: any) {
  const room = `user_${userId}`;

  io.to(room).emit("notification", {
    ...notification,
    timestamp: new Date().toISOString(),
  });

  console.log(`🔔 Sent notification to user ${userId}`);
}
