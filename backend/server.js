//serverjs
import { app } from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./configs/connection.config.js";
import logger from "./configs/logger.config.js";
import { appConfig } from "./configs/app.config.js";
import { validateEnvironment } from "./configs/env.config.js";
import { startLiveClassReminderScheduler, stopLiveClassReminderScheduler } from "./services/liveclass-reminder.service.js";
import { startDoubtReminderScheduler, stopDoubtReminderScheduler } from "./services/doubt-reminder.service.js";
import { LIVE_REACTION_WHITELIST } from "./constants/liveclass.constant.js";
import { LiveClass } from "./models/liveclass.model.js";
import {
    createStudyGroupMessage,
    getStudyGroupMembershipState,
    toggleStudyGroupReaction,
} from "./services/study-group.service.js";
import { isMuteActive } from "./utils/study-group.utils.js";

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
    stopLiveClassReminderScheduler();
    stopDoubtReminderScheduler();
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    stopLiveClassReminderScheduler();
    stopDoubtReminderScheduler();
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

        // Track room participants with profile metadata for fast snapshots.
        const liveRoomParticipants = new Map();

        const ensureParticipantMap = (liveClassId) => {
            const key = String(liveClassId || "");
            if (!liveRoomParticipants.has(key)) {
                liveRoomParticipants.set(key, new Map());
            }
            return liveRoomParticipants.get(key);
        };

        const getParticipantList = (liveClassId) => {
            const roomMap = liveRoomParticipants.get(String(liveClassId || ""));
            if (!roomMap) return [];
            return Array.from(roomMap.values()).sort(
                (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
            );
        };

        const emitParticipantCount = (liveClassId) => {
            const participants = getParticipantList(liveClassId);
            const totalOnline = participants.length;
            io.to(`live:${liveClassId}`).emit("participant_count_updated", {
                liveClassId,
                totalOnline,
            });
            return totalOnline;
        };

        const removeSocketFromLiveRoom = (socket, liveClassId) => {
            const classId = String(liveClassId || socket.liveClassId || "");
            if (!classId) return;

            const roomMap = liveRoomParticipants.get(classId);
            if (roomMap) {
                roomMap.delete(socket.id);
                if (roomMap.size === 0) {
                    liveRoomParticipants.delete(classId);
                }
            }

            socket.leave(`live:${classId}`);
            socket.to(`live:${classId}`).emit("participant_left", {
                userId: socket.liveUserId,
                name: socket.liveName,
                role: socket.liveRole,
                socketId: socket.id,
            });

            emitParticipantCount(classId);
            socket.liveClassId = null;
        };

        // Reminder scheduler for scheduled live classes
        startLiveClassReminderScheduler(io);
        startDoubtReminderScheduler(io);

        // Socket.IO connection handling
        io.on("connection", (socket) => {
            logger.info(`Socket connected: ${socket.id}`);

            socket.liveClassId = null;

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

            // Join a doubt ticket chat room for real-time replies
            socket.on("join_doubt_ticket", ({ ticketId }) => {
                if (!ticketId) return;
                socket.join(`doubt-ticket:${ticketId}`);
                logger.info(`Socket ${socket.id} joined doubt-ticket:${ticketId}`);
            });

            socket.on("join_study_group", async ({ groupId, userId, role }) => {
                if (!groupId || !userId || !role) return;

                if (role === "User") {
                    const member = await getStudyGroupMembershipState({ groupId, userId });
                    if (!member) {
                        socket.emit("study_group:error", { message: "You are not a member of this group" });
                        return;
                    }

                    if (member.status !== "active") {
                        socket.emit("study_group:removed", {
                            groupId,
                            removalReason: member.removalReason || "",
                            permanentBan: Boolean(member.finalWarning),
                        });
                        return;
                    }
                }

                socket.join(`study-group:${groupId}`);
                socket.studyGroupId = groupId;
                socket.studyGroupUserId = userId;
                socket.studyGroupRole = role;
                logger.info(`Socket ${socket.id} joined study-group:${groupId} as ${role}`);
            });

            socket.on("leave_study_group", ({ groupId }) => {
                if (!groupId) return;
                socket.leave(`study-group:${groupId}`);
                logger.info(`Socket ${socket.id} left study-group:${groupId}`);
            });

            socket.on("study_group:typing", async ({ groupId, userId, name }) => {
                if (!groupId || !userId) return;

                const member = await getStudyGroupMembershipState({ groupId, userId });
                if (!member || member.status !== "active") {
                    socket.emit("study_group:error", { message: "You are not allowed to type in this group" });
                    return;
                }

                socket.to(`study-group:${groupId}`).emit("study_group:typing", {
                    groupId,
                    userId,
                    name,
                    at: new Date().toISOString(),
                });
            });

            socket.on("study_group:send_message", async (payload = {}) => {
                try {
                    const { groupId, content, replyTo, mentions, senderId, senderRole } = payload;
                    if (!groupId || !senderId || !senderRole) return;

                    if (senderRole === "User") {
                        const member = await getStudyGroupMembershipState({ groupId, userId: senderId });
                        if (!member) {
                            socket.emit("study_group:error", { message: "You are not a member of this group" });
                            return;
                        }
                        if (member.status !== "active") {
                            socket.emit("study_group:removed", {
                                groupId,
                                removalReason: member.removalReason || "",
                                permanentBan: Boolean(member.finalWarning),
                            });
                            return;
                        }
                        if (isMuteActive(member.mutedUntil)) {
                            socket.emit("study_group:muted", {
                                groupId,
                                mutedUntil: member.mutedUntil,
                                message: "You are blocked from sending messages. Please wait for ice break.",
                            });
                            return;
                        }
                    }

                    const message = await createStudyGroupMessage({
                        groupId,
                        senderId,
                        senderRole,
                        content,
                        replyTo,
                        mentions,
                        files: [],
                    });

                    io.to(`study-group:${groupId}`).emit("study_group:new_message", { groupId, message });
                } catch (error) {
                    socket.emit("study_group:error", { message: error.message || "Failed to send message" });
                }
            });

            socket.on("study_group:react_message", async ({ groupId, messageId, userId, emoji }) => {
                try {
                    if (!groupId || !messageId || !userId || !emoji) return;

                    const member = await getStudyGroupMembershipState({ groupId, userId });
                    if (!member || member.status !== "active") {
                        socket.emit("study_group:error", { message: "You are not allowed to react in this group" });
                        return;
                    }

                    const message = await toggleStudyGroupReaction({ messageId, userId, emoji });
                    io.to(`study-group:${groupId}`).emit("study_group:message_reacted", { groupId, message });
                } catch (error) {
                    socket.emit("study_group:error", { message: error.message || "Failed to react" });
                }
            });

            // Leave a doubt ticket chat room
            socket.on("leave_doubt_ticket", ({ ticketId }) => {
                if (!ticketId) return;
                socket.leave(`doubt-ticket:${ticketId}`);
                logger.info(`Socket ${socket.id} left doubt-ticket:${ticketId}`);
            });

            socket.on("disconnect", () => {
                logger.info(`Socket disconnected: ${socket.id}`);
            });

            // ─── Live Class Events ───────────────────────────────
            // Join a live class room
            socket.on("join_live_class", async ({ liveClassId, userId, role, name, firstName, lastName, profilePicture }) => {
                if (!liveClassId) return;

                if (socket.liveClassId && String(socket.liveClassId) !== String(liveClassId)) {
                    removeSocketFromLiveRoom(socket, socket.liveClassId);
                }

                socket.join(`live:${liveClassId}`);
                socket.liveClassId = liveClassId;
                socket.liveUserId = userId;
                socket.liveRole = role;
                socket.liveName = name;

                const participant = {
                    socketId: socket.id,
                    userId,
                    role,
                    name,
                    firstName: firstName || "",
                    lastName: lastName || "",
                    profilePicture: profilePicture || null,
                    joinedAt: new Date().toISOString(),
                };

                const participantMap = ensureParticipantMap(liveClassId);
                participantMap.set(socket.id, participant);

                const liveClassIdStr = liveClassId?.toString();
                const broadcastMeta = activeBroadcasts.get(liveClassIdStr);
                const participantList = getParticipantList(liveClassId);
                const totalOnline = participantList.length;

                socket.emit("session_snapshot", {
                    liveClassId,
                    broadcastStarted: !!broadcastMeta,
                    broadcastStartedAt: broadcastMeta?.startedAt || null,
                    totalOnline,
                });

                socket.emit("participant_list_snapshot", {
                    liveClassId,
                    participants: participantList,
                    totalOnline,
                });

                try {
                    const historyDoc = await LiveClass.findById(liveClassId).select("chatMessages").lean();
                    const messages = Array.isArray(historyDoc?.chatMessages)
                        ? historyDoc.chatMessages.slice(-50)
                        : [];
                    socket.emit("chat_history_snapshot", {
                        liveClassId,
                        messages,
                    });
                } catch (error) {
                    logger.warn(`Failed chat history snapshot for live:${liveClassId} - ${error.message}`);
                }

                // Notify the room about new participant
                socket.to(`live:${liveClassId}`).emit("participant_joined", {
                    ...participant,
                    totalOnline,
                });
                logger.info(`Socket ${socket.id} joined live:${liveClassId} as ${role}`);

                // If host already started broadcasting, inform late joiners immediately
                if (activeBroadcasts.has(liveClassId?.toString())) {
                    socket.emit("broadcast_started", { liveClassId });
                }

                emitParticipantCount(liveClassId);
            });

            // Leave a live class room
            socket.on("leave_live_class", ({ liveClassId }) => {
                const targetLiveClassId = liveClassId || socket.liveClassId;
                if (!targetLiveClassId) return;
                logger.info(`Socket ${socket.id} left live:${targetLiveClassId}`);
                removeSocketFromLiveRoom(socket, targetLiveClassId);
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
                if (!LIVE_REACTION_WHITELIST.includes(emoji)) {
                    return;
                }
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
                    removeSocketFromLiveRoom(socket, socket.liveClassId);
                    // Do not clear active broadcast on instructor refresh/disconnect.
                    // Broadcast state is cleared by explicit host end or stop_broadcast events.
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