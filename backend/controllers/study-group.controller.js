import { asyncHandler } from "../middlewares/async.middleware.js";
import { errorResponse, successResponse } from "../utils/response.utils.js";
import { Notification } from "../models/notification.model.js";
import { StudyGroup, StudyGroupMember } from "../models/study-group.model.js";
import {
    createStudyGroupMessage,
    deleteStudyGroupMessage,
    editStudyGroupMessage,
    ensureCourseStudyGroupOnPublish,
    getStudyGroupById,
    getStudyGroupMembershipState,
    listStudyGroupMessages,
    listStudyGroupMembers,
    listStudyGroupsForInstructor,
    listStudyGroupsForUser,
    markStudyGroupRead,
    muteStudyGroupMember,
    unmuteStudyGroupMember,
    getNonJoinedMembersForGroup,
    addUserToStudyGroup,
    removeStudyGroupMember,
    toggleStudyGroupReaction,
    updateStudyGroupSettings,
    updateStudyGroupProfilePhoto,
    updateStudyGroupMemberRejoinRequest,
} from "../services/study-group.service.js";

const getActor = (req) => {
    if (req.instructor) {
        return { id: req.instructor.id, role: "Instructor" };
    }

    if (req.user) {
        return { id: req.user.id, role: "User" };
    }

    return null;
};

const getOwnerInstructorId = (group) => {
    if (!group?.ownerInstructor) return "";
    if (typeof group.ownerInstructor === "object") {
        return String(group.ownerInstructor?._id || group.ownerInstructor?.id || "");
    }
    return String(group.ownerInstructor);
};

const isGroupAdmin = (group, instructorId) => {
    return getOwnerInstructorId(group) === String(instructorId || "");
};

export const listMyStudyGroups = asyncHandler(async (req, res) => {
    const groups = await listStudyGroupsForUser({ userId: req.user.id });
    successResponse(res, 200, "Study groups retrieved", groups);
});

export const listInstructorStudyGroups = asyncHandler(async (req, res) => {
    const groups = await listStudyGroupsForInstructor({ instructorId: req.instructor.id });
    successResponse(res, 200, "Instructor study groups retrieved", groups);
});

export const getMyStudyGroup = asyncHandler(async (req, res) => {
    const group = await getStudyGroupById({ groupId: req.params.groupId });
    const membership = await getStudyGroupMembershipState({ groupId: req.params.groupId, userId: req.user.id });

    if (!membership) {
        return errorResponse(res, 403, "You are not a member of this study group");
    }

    successResponse(res, 200, "Study group retrieved", {
        ...group.toObject(),
        membership,
    });
});

export const getMyStudyGroupMembers = asyncHandler(async (req, res) => {
    const membership = await getStudyGroupMembershipState({ groupId: req.params.groupId, userId: req.user.id });
    if (!membership) {
        return errorResponse(res, 403, "You are not a member of this study group");
    }

    const members = await listStudyGroupMembers({ groupId: req.params.groupId });
    successResponse(res, 200, "Members retrieved", members);
});

export const getInstructorStudyGroup = asyncHandler(async (req, res) => {
    const group = await getStudyGroupById({ groupId: req.params.groupId });
    if (!isGroupAdmin(group, req.instructor.id)) {
        return errorResponse(res, 403, "Only group admin can view this group");
    }

    successResponse(res, 200, "Study group retrieved", group);
});

export const getInstructorStudyGroupMembers = asyncHandler(async (req, res) => {
    const group = await getStudyGroupById({ groupId: req.params.groupId });
    if (!isGroupAdmin(group, req.instructor.id)) {
        return errorResponse(res, 403, "Only group admin can access members");
    }

    const members = await listStudyGroupMembers({ groupId: req.params.groupId });
    successResponse(res, 200, "Members retrieved", members);
});

export const getMyStudyGroupMessages = asyncHandler(async (req, res) => {
    const membership = await getStudyGroupMembershipState({ groupId: req.params.groupId, userId: req.user.id });
    if (!membership) {
        return errorResponse(res, 403, "You are not a member of this study group");
    }

    const result = await listStudyGroupMessages({
        groupId: req.params.groupId,
        page: req.query.page,
        limit: req.query.limit,
        maxCreatedAt: membership.status === "removed" ? membership.removedAt : null,
    });

    successResponse(res, 200, "Messages retrieved", result);
});

export const getInstructorStudyGroupMessages = asyncHandler(async (req, res) => {
    const group = await getStudyGroupById({ groupId: req.params.groupId });
    if (!isGroupAdmin(group, req.instructor.id)) {
        return errorResponse(res, 403, "Only group admin can access messages");
    }

    const result = await listStudyGroupMessages({
        groupId: req.params.groupId,
        page: req.query.page,
        limit: req.query.limit,
    });

    successResponse(res, 200, "Messages retrieved", result);
});

export const sendMyStudyGroupMessage = asyncHandler(async (req, res) => {
    const message = await createStudyGroupMessage({
        groupId: req.params.groupId,
        senderId: req.user.id,
        senderRole: "User",
        content: req.body.content,
        replyTo: req.body.replyTo,
        mentions: req.body.mentions,
        files: req.files,
    });

    const io = req.app.get("io");
    if (io) {
        io.to(`study-group:${req.params.groupId}`).emit("study_group:new_message", {
            groupId: req.params.groupId,
            message,
        });
    }

    successResponse(res, 201, "Message sent", message);
});

export const sendInstructorStudyGroupMessage = asyncHandler(async (req, res) => {
    const group = await getStudyGroupById({ groupId: req.params.groupId });
    if (!isGroupAdmin(group, req.instructor.id)) {
        return errorResponse(res, 403, "Only group admin can send as instructor");
    }

    const message = await createStudyGroupMessage({
        groupId: req.params.groupId,
        senderId: req.instructor.id,
        senderRole: "Instructor",
        content: req.body.content,
        replyTo: req.body.replyTo,
        mentions: req.body.mentions,
        files: req.files,
    });

    const io = req.app.get("io");
    if (io) {
        io.to(`study-group:${req.params.groupId}`).emit("study_group:new_message", {
            groupId: req.params.groupId,
            message,
        });
    }

    successResponse(res, 201, "Message sent", message);
});

export const editMyStudyGroupMessage = asyncHandler(async (req, res) => {
    const message = await editStudyGroupMessage({
        messageId: req.params.messageId,
        userId: req.user.id,
        content: req.body.content,
    });

    const io = req.app.get("io");
    if (io) {
        io.to(`study-group:${req.params.groupId}`).emit("study_group:message_updated", {
            groupId: req.params.groupId,
            message,
        });
    }

    successResponse(res, 200, "Message updated", message);
});

export const deleteMyStudyGroupMessage = asyncHandler(async (req, res) => {
    const actor = getActor(req);

    if (req.instructor) {
        const group = await getStudyGroupById({ groupId: req.params.groupId });
        if (!isGroupAdmin(group, req.instructor.id)) {
            return errorResponse(res, 403, "Only group admin can delete this message as instructor");
        }
    }

    const message = await deleteStudyGroupMessage({
        messageId: req.params.messageId,
        actorId: actor.id,
        actorRole: actor.role,
        groupId: req.params.groupId,
    });

    const io = req.app.get("io");
    if (io) {
        io.to(`study-group:${req.params.groupId}`).emit("study_group:message_deleted", {
            groupId: req.params.groupId,
            message,
        });
    }

    successResponse(res, 200, "Message deleted", message);
});

export const reactToMyStudyGroupMessage = asyncHandler(async (req, res) => {
    const membership = await getStudyGroupMembershipState({ groupId: req.params.groupId, userId: req.user.id });
    if (!membership) {
        return errorResponse(res, 403, "You are not a member of this study group");
    }

    const message = await toggleStudyGroupReaction({
        messageId: req.params.messageId,
        userId: req.user.id,
        emoji: req.body.emoji,
    });

    const io = req.app.get("io");
    if (io) {
        io.to(`study-group:${req.params.groupId}`).emit("study_group:message_reacted", {
            groupId: req.params.groupId,
            message,
        });
    }

    successResponse(res, 200, "Reaction updated", message);
});

export const markMyStudyGroupRead = asyncHandler(async (req, res) => {
    await markStudyGroupRead({
        groupId: req.params.groupId,
        userId: req.user.id,
        messageIds: req.body.messageIds,
    });

    successResponse(res, 200, "Read state updated");
});

export const updateInstructorStudyGroupSettings = asyncHandler(async (req, res) => {
    const group = await updateStudyGroupSettings({
        groupId: req.params.groupId,
        instructorId: req.instructor.id,
        payload: {
            name: req.body.name,
            description: req.body.description,
            instructions: req.body.instructions,
            profilePhoto: req.body.profilePhoto,
        },
    });

    const io = req.app.get("io");
    if (io) {
        io.to(`study-group:${req.params.groupId}`).emit("study_group:settings_updated", {
            groupId: req.params.groupId,
            group,
        });
    }

    successResponse(res, 200, "Study group settings updated", group);
});

export const updateInstructorStudyGroupPhoto = asyncHandler(async (req, res) => {
    const group = await updateStudyGroupProfilePhoto({
        groupId: req.params.groupId,
        instructorId: req.instructor.id,
        file: req.file,
    });

    const io = req.app.get("io");
    if (io) {
        io.to(`study-group:${req.params.groupId}`).emit("study_group:settings_updated", {
            groupId: req.params.groupId,
            group,
        });
    }

    successResponse(res, 200, "Study group profile photo updated", group);
});

export const removeInstructorStudyGroupMember = asyncHandler(async (req, res) => {
    const { removalReason } = req.body;
    const safeReason = String(removalReason || "").trim();

    if (!safeReason) {
        return errorResponse(res, 400, "Removal reason is required");
    }
    
    const member = await removeStudyGroupMember({
        groupId: req.params.groupId,
        instructorId: req.instructor.id,
        userId: req.params.userId,
        removalReason: safeReason,
    });

    const io = req.app.get("io");
    if (io) {
        const roomSockets = await io.in(`study-group:${req.params.groupId}`).fetchSockets();
        roomSockets
            .filter((s) => String(s.studyGroupUserId || "") === String(req.params.userId))
            .forEach((s) => s.leave(`study-group:${req.params.groupId}`));

        io.to(`study-group:${req.params.groupId}`).emit("study_group:member_removed", {
            groupId: req.params.groupId,
            userId: req.params.userId,
            removalReason: member.removalReason,
            permanentBan: Boolean(member.finalWarning),
        });
        io.to(`user:${req.params.userId}`).emit("study_group:removed", {
            groupId: req.params.groupId,
            removalReason: member.removalReason,
            permanentBan: Boolean(member.finalWarning),
        });
    }

    await Notification.createNotification({
        recipient: req.params.userId,
        recipientRole: "User",
        type: "study_group_removed",
        title: "Removed from study group",
        message: member.removalReason
            ? `You were removed from the study group. Reason: ${member.removalReason}`
            : "You were removed from the study group by the instructor",
        data: {
            groupId: req.params.groupId,
            removalReason: member.removalReason || "",
            permanentBan: Boolean(member.finalWarning),
        },
    });

    successResponse(res, 200, "Member removed", member);
});

export const muteInstructorStudyGroupMember = asyncHandler(async (req, res) => {
    const member = await muteStudyGroupMember({
        groupId: req.params.groupId,
        instructorId: req.instructor.id,
        userId: req.params.userId,
        durationMinutes: req.body.durationMinutes,
        reason: req.body.reason,
    });

    const io = req.app.get("io");
    if (io) {
        io.to(`study-group:${req.params.groupId}`).emit("study_group:member_muted", {
            groupId: req.params.groupId,
            userId: req.params.userId,
            mutedUntil: member.mutedUntil,
            reason: member.mutedReason,
        });
    }

    successResponse(res, 200, "Member muted", member);
});

export const unmuteInstructorStudyGroupMember = asyncHandler(async (req, res) => {
    const member = await unmuteStudyGroupMember({
        groupId: req.params.groupId,
        instructorId: req.instructor.id,
        userId: req.params.userId,
    });

    const io = req.app.get("io");
    if (io) {
        io.to(`study-group:${req.params.groupId}`).emit("study_group:member_unmuted", {
            groupId: req.params.groupId,
            userId: req.params.userId,
            mutedUntil: null,
        });
    }

    successResponse(res, 200, "Member unmuted", member);
});

export const getNonJoinedMembers = asyncHandler(async (req, res) => {
    const members = await getNonJoinedMembersForGroup({
        groupId: req.params.groupId,
        instructorId: req.instructor.id,
    });

    successResponse(res, 200, "Non-joined members retrieved", members);
});

export const addMemberToStudyGroup = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
        return errorResponse(res, 400, "User ID is required");
    }

    const member = await addUserToStudyGroup({
        groupId: req.params.groupId,
        instructorId: req.instructor.id,
        userId,
    });

    const io = req.app.get("io");
    if (io) {
        io.to(`study-group:${req.params.groupId}`).emit("study_group:member_added", {
            groupId: req.params.groupId,
            member,
        });
    }

    successResponse(res, 201, "Member added to study group", member);
});

export const ensurePublishedCourseStudyGroup = asyncHandler(async (req, res) => {
    const group = await ensureCourseStudyGroupOnPublish({ courseId: req.params.courseId });
    successResponse(res, 200, "Study group ensured", group || {});
});

export const requestRejoinStudyGroup = asyncHandler(async (req, res) => {
    const { rejoinRequestReason } = req.body;
    
    const member = await updateStudyGroupMemberRejoinRequest({
        groupId: req.params.groupId,
        userId: req.user.id,
        rejoinRequestReason: rejoinRequestReason || "",
    });

    const io = req.app.get("io");
    if (io) {
        const group = await StudyGroup.findById(req.params.groupId);
        if (group) {
            io.to(`study-group:${req.params.groupId}`).emit("study_group:rejoin_requested", {
                groupId: req.params.groupId,
                userId: req.user.id,
                userName: [req.user.firstName, req.user.lastName].filter(Boolean).join(" "),
                userEmail: req.user.email || "",
                reason: rejoinRequestReason,
            });
            io.to(`user:${group.ownerInstructor}`).emit("study_group:rejoin_requested", {
                groupId: req.params.groupId,
                userId: req.user.id,
                userName: [req.user.firstName, req.user.lastName].filter(Boolean).join(" "),
                userEmail: req.user.email || "",
                reason: rejoinRequestReason,
            });

            await Notification.createNotification({
                recipient: group.ownerInstructor,
                recipientRole: "Instructor",
                type: "study_group_rejoin_requested",
                title: "Rejoin request received",
                message: `${[req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || "A learner"} requested to rejoin your study group`,
                data: {
                    groupId: req.params.groupId,
                    userId: req.user.id,
                    reason: rejoinRequestReason || "",
                },
            });
        }
    }

    successResponse(res, 200, "Rejoin request submitted", member);
});

export const getInstructorRejoinRequests = asyncHandler(async (req, res) => {
    const requests = await StudyGroupMember.find(
        {
            group: req.params.groupId,
            rejoinStatus: "pending",
        }
    )
        .populate("user", "firstName lastName email profilePicture")
        .select("user rejoinRequestReason rejoinRequestedAt finalWarning");

    successResponse(res, 200, "Rejoin requests retrieved", requests);
});

export const acceptRejoinRequest = asyncHandler(async (req, res) => {
    const group = await StudyGroup.findById(req.params.groupId);
    if (!group) {
        return errorResponse(res, 404, "Study group not found");
    }

    if (String(group.ownerInstructor) !== String(req.instructor.id)) {
        return errorResponse(res, 403, "Only group admin can accept rejoin requests");
    }

    const member = await StudyGroupMember.findOne({
        group: req.params.groupId,
        user: req.params.userId,
    });

    if (!member) {
        return errorResponse(res, 404, "Member not found");
    }

    if (member.rejoinStatus !== "pending") {
        return errorResponse(res, 400, "No pending rejoin request for this member");
    }

    member.rejoinStatus = "none";
    member.status = "active";
    member.finalWarning = true;
    member.rejoinRequestReason = "";
    member.rejoinRequestedAt = null;
    member.removedAt = null;
    await member.save();

    const io = req.app.get("io");
    if (io) {
        io.to(`user:${req.params.userId}`).emit("study_group:rejoin_accepted", {
            groupId: req.params.groupId,
            finalWarning: true,
        });
        io.to(`study-group:${req.params.groupId}`).emit("study_group:member_rejoined", {
            groupId: req.params.groupId,
            userId: req.params.userId,
        });
    }

    await Notification.createNotification({
        recipient: req.params.userId,
        recipientRole: "User",
        type: "study_group_rejoin_accepted",
        title: "Rejoin request accepted",
        message: "You have been rejoined to the study group with a final warning.",
        data: {
            groupId: req.params.groupId,
            finalWarning: true,
        },
    });

    successResponse(res, 200, "Rejoin request accepted", member);
});

export const rejectRejoinRequest = asyncHandler(async (req, res) => {
    const group = await StudyGroup.findById(req.params.groupId);
    if (!group) {
        return errorResponse(res, 404, "Study group not found");
    }

    if (String(group.ownerInstructor) !== String(req.instructor.id)) {
        return errorResponse(res, 403, "Only group admin can reject rejoin requests");
    }

    const member = await StudyGroupMember.findOne({
        group: req.params.groupId,
        user: req.params.userId,
    });

    if (!member) {
        return errorResponse(res, 404, "Member not found");
    }

    if (member.rejoinStatus !== "pending") {
        return errorResponse(res, 400, "No pending rejoin request for this member");
    }

    member.rejoinStatus = "rejected";
    member.rejoinRequestReason = "";
    member.rejoinRequestedAt = null;
    await member.save();

    const io = req.app.get("io");
    if (io) {
        io.to(`user:${req.params.userId}`).emit("study_group:rejoin_rejected", {
            groupId: req.params.groupId,
        });
    }

    await Notification.createNotification({
        recipient: req.params.userId,
        recipientRole: "User",
        type: "study_group_rejoin_rejected",
        title: "Rejoin request rejected",
        message: "Your request to rejoin the study group was rejected.",
        data: {
            groupId: req.params.groupId,
        },
    });

    successResponse(res, 200, "Rejoin request rejected", member);
});
