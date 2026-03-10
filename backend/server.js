import { app } from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./configs/connection.config.js";
import logger from "./configs/logger.config.js";
import { appConfig } from "./configs/app.config.js";
import { validateEnvironment } from "./configs/env.config.js";

// Validate environment variables at startup
validateEnvironment();

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    logger.error(err.stack);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    logger.error(err.stack);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Connecting to Database and starting the server
connectDB()
    .then(() => {
        const port = appConfig.port;
        const httpServer = createServer(app);

        // Setup Socket.IO
        const io = new Server(httpServer, {
            cors: {
                origin: appConfig.corsOrigin || ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
                credentials: true
            }
        });

        // Make io accessible in controllers via req.app.get("io")
        app.set("io", io);

        // Track active broadcasts per live class (in-memory)
        // So late joiners immediately know if broadcasting has already started
        const activeBroadcasts = new Map();
        io.activeBroadcasts = activeBroadcasts; // Store on io so controllers can access it

        // Socket.IO connection handling
        io.on("connection", (socket) => {
            logger.info(`Socket connected: ${socket.id}`);

            // Join a course discussion room
            socket.on("join_course", (courseId) => {
                socket.join(`course:${courseId}`);
                logger.info(`Socket ${socket.id} joined course:${courseId}`);
            });

            // Leave a course discussion room
            socket.on("leave_course", (courseId) => {
                socket.leave(`course:${courseId}`);
                logger.info(`Socket ${socket.id} left course:${courseId}`);
            });

            // Join notification room (user/instructor specific)
            socket.on("join_notifications", (data) => {
                const { userId, role } = data;
                socket.join(`notifications:${role}:${userId}`);
                logger.info(`Socket ${socket.id} joined notifications:${role}:${userId}`);
            });

            socket.on("disconnect", () => {
                logger.info(`Socket disconnected: ${socket.id}`);
            });

            // ─── Live Class Events ───────────────────────────────
            // Join a live class room
            socket.on("join_live_class", ({ liveClassId, userId, role, name }) => {
                socket.join(`live:${liveClassId}`);
                socket.liveClassId = liveClassId;
                socket.liveUserId = userId;
                socket.liveRole = role;
                socket.liveName = name;

                // Notify the room about new participant
                socket.to(`live:${liveClassId}`).emit("participant_joined", {
                    userId, name, role,
                    socketId: socket.id,
                });
                logger.info(`Socket ${socket.id} joined live:${liveClassId} as ${role}`);

                // If host already started broadcasting, inform late joiners immediately
                if (activeBroadcasts.has(liveClassId?.toString())) {
                    socket.emit("broadcast_started", { liveClassId });
                }
            });

            // Leave a live class room
            socket.on("leave_live_class", ({ liveClassId }) => {
                socket.leave(`live:${liveClassId}`);
                socket.to(`live:${liveClassId}`).emit("participant_left", {
                    userId: socket.liveUserId,
                    name: socket.liveName,
                    role: socket.liveRole,
                });
                logger.info(`Socket ${socket.id} left live:${liveClassId}`);
            });

            // Real-time chat message (low-latency broadcast)
            socket.on("live_chat", ({ liveClassId, message, type, senderName, senderRole }) => {
                const chatMsg = {
                    sender: socket.liveUserId,
                    senderRole: senderRole || socket.liveRole,
                    senderName: senderName || socket.liveName,
                    message,
                    type: type || "chat",
                    timestamp: new Date(),
                    socketId: socket.id,
                };
                io.to(`live:${liveClassId}`).emit("chat_message", chatMsg);
            });

            // Raise hand (real-time broadcast)
            socket.on("raise_hand", ({ liveClassId }) => {
                io.to(`live:${liveClassId}`).emit("hand_raised", {
                    userId: socket.liveUserId,
                    name: socket.liveName,
                    role: socket.liveRole,
                });
            });

            // Lower hand (instructor action)
            socket.on("lower_hand", ({ liveClassId, userId }) => {
                io.to(`live:${liveClassId}`).emit("hand_lowered", { userId });
            });

            // Emoji reaction (real-time broadcast, no persistence)
            socket.on("emoji_reaction", ({ liveClassId, emoji }) => {
                io.to(`live:${liveClassId}`).emit("emoji_reaction", {
                    userId: socket.liveUserId,
                    name: socket.liveName,
                    emoji,
                    timestamp: new Date(),
                });
            });

            // Stream status update (instructor sends when OBS connects/disconnects)
            socket.on("stream_status", ({ liveClassId, status }) => {
                socket.to(`live:${liveClassId}`).emit("stream_status", {
                    liveClassId,
                    status, // "connected", "disconnected", "reconnecting"
                    timestamp: new Date(),
                });
            });

            // Poll/quiz broadcast (instructor only)
            socket.on("live_poll", ({ liveClassId, poll }) => {
                if (socket.liveRole === "Instructor" || socket.liveRole === "Admin") {
                    io.to(`live:${liveClassId}`).emit("live_poll", poll);
                }
            });

            // Host mute/unmute participant
            socket.on("mute_participant", ({ liveClassId, userId }) => {
                if (socket.liveRole === "Instructor" || socket.liveRole === "Admin") {
                    io.to(`live:${liveClassId}`).emit("participant_muted", { userId });
                }
            });

            socket.on("unmute_participant", ({ liveClassId, userId }) => {
                if (socket.liveRole === "Instructor" || socket.liveRole === "Admin") {
                    io.to(`live:${liveClassId}`).emit("participant_unmuted", { userId });
                }
            });

            // Broadcast gate — host controls when participants start watching
            socket.on("start_broadcast", ({ liveClassId }) => {
                if (socket.liveRole === "Instructor") {
                    activeBroadcasts.set(liveClassId?.toString(), { startedAt: new Date(), startedBy: socket.liveUserId });
                    io.to(`live:${liveClassId}`).emit("broadcast_started", { liveClassId });
                    logger.info(`Broadcast started for live:${liveClassId} by ${socket.id}`);
                }
            });

            socket.on("stop_broadcast", ({ liveClassId }) => {
                if (socket.liveRole === "Instructor") {
                    activeBroadcasts.delete(liveClassId?.toString());
                    io.to(`live:${liveClassId}`).emit("broadcast_stopped", { liveClassId });
                    logger.info(`Broadcast stopped for live:${liveClassId} by ${socket.id}`);
                }
            });

            // On disconnect, notify all live rooms this socket was in
            socket.on("disconnecting", () => {
                if (socket.liveClassId) {
                    socket.to(`live:${socket.liveClassId}`).emit("participant_left", {
                        userId: socket.liveUserId,
                        name: socket.liveName,
                        role: socket.liveRole,
                    });
                    // Clean up broadcast state if host disconnects
                    if (socket.liveRole === "Instructor") {
                        activeBroadcasts.delete(socket.liveClassId?.toString());
                    }
                }
            });
        });

        httpServer.listen(port, () => {
            logger.success(`Server is running on port ${port} in ${appConfig.nodeEnv} mode`);
            logger.info("Socket.IO initialized");
        });

        // Handle server errors
        httpServer.on('error', (err) => {
            logger.error(`Server error: ${err.message}`);
            process.exit(1);
        });
    })
    .catch((err) => {
        logger.error(`Database connection failed: ${err.message}`);
        process.exit(1);
    });