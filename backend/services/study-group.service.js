import path from "path";
import { Course } from "../models/course.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Notification } from "../models/notification.model.js";
import { StudyGroup, StudyGroupMember } from "../models/study-group.model.js";
import { StudyGroupMessage } from "../models/study-group-message.model.js";
import {
    STUDY_GROUP_MAX_ATTACHMENTS,
    STUDY_GROUP_MEMBER_ROLE,
    STUDY_GROUP_MEMBER_STATUS,
    STUDY_GROUP_MESSAGE_SENDER_ROLE,
    STUDY_GROUP_MENTION_NOTIFICATION_TYPE,
    STUDY_GROUP_REACTION_WHITELIST,
} from "../constants/study-group.constant.js";
import {
    isMuteActive,
    normalizeStudyGroupName,
    normalizeInstructions,
    parseMentionIds,
    toFutureDateFromMinutes,
    validateStudyGroupAttachment,
} from "../utils/study-group.utils.js";
import {
    deleteImage,
    uploadStudyGroupAttachment,
    uploadStudyGroupProfilePhoto,
} from "./r2.service.js";


const ACTIVE_ENROLLMENT_STATUSES = ["active", "completed"];

const recalcStudyGroupMemberCount = async (groupId) => {
    const memberCount = await StudyGroupMember.countDocuments({
        group: groupId,
        status: STUDY_GROUP_MEMBER_STATUS.ACTIVE,
    });

    await StudyGroup.findByIdAndUpdate(groupId, { memberCount });
};

const getActiveMemberCountMap = async (groupIds = []) => {
    if (!Array.isArray(groupIds) || groupIds.length === 0) {
        return new Map();
    }

    const counts = await StudyGroupMember.aggregate([
        {
            $match: {
                group: { $in: groupIds },
                status: STUDY_GROUP_MEMBER_STATUS.ACTIVE,
            },
        },
        {
            $group: {
                _id: "$group",
                count: { $sum: 1 },
            },
        },
    ]);

    return new Map(counts.map((item) => [String(item._id), Number(item.count || 0)]));
};

const buildAttachmentPayload = async ({ groupId, files = [] }) => {
    if (!Array.isArray(files) || files.length === 0) return [];
    if (files.length > STUDY_GROUP_MAX_ATTACHMENTS) {
        throw new Error(`Only ${STUDY_GROUP_MAX_ATTACHMENTS} files are allowed per message`);
    }

    const uploadResults = [];

    for (const file of files) {
        const check = validateStudyGroupAttachment(file);
        if (!check.valid) {
            throw new Error(check.reason);
        }

        const ext = check.ext || path.extname(file.originalname || "").toLowerCase();

        const uploaded = await uploadStudyGroupAttachment(
            file.buffer,
            groupId,
            `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`,
            file.mimetype
        );

        uploadResults.push({
            fileName: file.originalname,
            url: uploaded.secure_url || uploaded.url,
            mimeType: file.mimetype,
            extension: ext,
            size: file.size,
        });
    }

    return uploadResults;
};

const ensureMemberAccess = async ({ groupId, userId }) => {
    const member = await StudyGroupMember.findOne({
        group: groupId,
        user: userId,
    });

    if (!member) {
        throw new Error("You are not a member of this study group");
    }

    if (member.status === STUDY_GROUP_MEMBER_STATUS.REMOVED) {
        throw new Error("You have been removed from this study group and cannot message");
    }

    if (member.status !== STUDY_GROUP_MEMBER_STATUS.ACTIVE) {
        throw new Error("You are not an active member of this study group");
    }

    if (isMuteActive(member.mutedUntil)) {
        const remainingMs = new Date(member.mutedUntil).getTime() - Date.now();
        throw new Error(`You are muted for this group. Remaining ${Math.max(0, Math.floor(remainingMs / 1000))} seconds`);
    }

    return member;
};

export const ensureCourseStudyGroupOnPublish = async ({ courseId }) => {
    const course = await Course.findById(courseId).select("_id title instructor status isPublished studyGroup");
    if (!course) {
        throw new Error("Course not found for study group sync");
    }

    const isPublishState = course.status === "published" || course.isPublished;
    if (!isPublishState) {
        return null;
    }

    let group = null;

    if (course.studyGroup) {
        group = await StudyGroup.findById(course.studyGroup);
    }

    if (!group) {
        group = await StudyGroup.findOne({ course: course._id });
    }

    if (!group) {
        group = await StudyGroup.create({
            course: course._id,
            ownerInstructor: course.instructor,
            name: normalizeStudyGroupName(course.title),
            description: `${course.title} collaborative discussion group`,
            instructions: [
                "Respect peers and keep conversations constructive",
                "Stay on-topic with course learning goals",
                "No abusive or malicious content/files",
            ],
        });
    } else if (String(group.ownerInstructor) !== String(course.instructor)) {
        group.ownerInstructor = course.instructor;
        await group.save({ validateBeforeSave: false });
    }

    course.studyGroup = group._id;
    await course.save({ validateBeforeSave: false });

    const activeEnrollments = await Enrollment.find({
        course: course._id,
        status: { $in: ACTIVE_ENROLLMENT_STATUSES },
        "moderationLock.isLocked": { $ne: true },
    }).select("user");

    if (activeEnrollments.length > 0) {
        const ops = activeEnrollments.map((enrollment) => ({
            updateOne: {
                filter: { group: group._id, user: enrollment.user },
                update: {
                    $set: {
                        status: STUDY_GROUP_MEMBER_STATUS.ACTIVE,
                        role: STUDY_GROUP_MEMBER_ROLE.MEMBER,
                        removedAt: null,
                    },
                    $setOnInsert: { joinedAt: new Date() },
                },
                upsert: true,
            },
        }));
        await StudyGroupMember.bulkWrite(ops);
    }

    await recalcStudyGroupMemberCount(group._id);

    return group;
};

export const syncEnrollmentToStudyGroup = async ({ courseId, userId }) => {
    const [course, enrollment] = await Promise.all([
        Course.findById(courseId).select("_id studyGroup status isPublished"),
        Enrollment.findOne({ user: userId, course: courseId }).select("status moderationLock"),
    ]);

    if (!course || !course.studyGroup) return null;

    const canAccessByEnrollment = enrollment
        && ACTIVE_ENROLLMENT_STATUSES.includes(enrollment.status)
        && !enrollment?.moderationLock?.isLocked;

    if (canAccessByEnrollment) {
        const member = await StudyGroupMember.findOneAndUpdate(
            { group: course.studyGroup, user: userId },
            {
                $set: {
                    status: STUDY_GROUP_MEMBER_STATUS.ACTIVE,
                    removedAt: null,
                    role: STUDY_GROUP_MEMBER_ROLE.MEMBER,
                },
                $setOnInsert: {
                    joinedAt: new Date(),
                },
            },
            { upsert: true, new: true }
        );

        await recalcStudyGroupMemberCount(course.studyGroup);
        return member;
    }

    const member = await StudyGroupMember.findOneAndUpdate(
        { group: course.studyGroup, user: userId },
        {
            $set: {
                status: STUDY_GROUP_MEMBER_STATUS.REMOVED,
                removedAt: new Date(),
            },
        },
        { new: true }
    );

    await recalcStudyGroupMemberCount(course.studyGroup);
    return member;
};

export const listStudyGroupsForUser = async ({ userId }) => {
    const enrolled = await Enrollment.find({
        user: userId,
        status: { $in: ACTIVE_ENROLLMENT_STATUSES },
        "moderationLock.isLocked": { $ne: true },
    })
        .populate("course", "studyGroup")
        .select("course");

    const missingMembershipOps = enrolled
        .map((item) => item.course?.studyGroup)
        .filter(Boolean)
        .map((studyGroupId) => ({
            updateOne: {
                filter: { group: studyGroupId, user: userId },
                update: {
                    $setOnInsert: {
                        status: STUDY_GROUP_MEMBER_STATUS.ACTIVE,
                        role: STUDY_GROUP_MEMBER_ROLE.MEMBER,
                        joinedAt: new Date(),
                    },
                },
                upsert: true,
            },
        }));

    if (missingMembershipOps.length > 0) {
        await StudyGroupMember.bulkWrite(missingMembershipOps);
    }

    const members = await StudyGroupMember.find({
        user: userId,
        status: { $in: [STUDY_GROUP_MEMBER_STATUS.ACTIVE, STUDY_GROUP_MEMBER_STATUS.REMOVED] },
    }).select("group mutedUntil updatedAt status removalReason rejoinStatus finalWarning removedAt");

    const groupIds = members.map((m) => m.group);
    if (!groupIds.length) return [];

    const groups = await StudyGroup.find({ _id: { $in: groupIds }, isActive: true })
        .populate("course", "title thumbnail")
        .populate("ownerInstructor", "firstName lastName profilePicture")
        .sort({ lastMessageAt: -1, updatedAt: -1 });

    const memberByGroup = new Map(members.map((m) => [String(m.group), m]));
    const countMap = await getActiveMemberCountMap(groupIds);

    return groups.map((group) => {
        const member = memberByGroup.get(String(group._id));
        return {
            ...group.toObject(),
            memberCount: countMap.get(String(group._id)) || 0,
            membership: {
                status: member?.status || STUDY_GROUP_MEMBER_STATUS.ACTIVE,
                mutedUntil: member?.mutedUntil || null,
                muted: isMuteActive(member?.mutedUntil),
                removalReason: member?.removalReason || "",
                removedAt: member?.removedAt || null,
                rejoinStatus: member?.rejoinStatus || "none",
                finalWarning: Boolean(member?.finalWarning),
            },
        };
    });
};

export const listStudyGroupsForInstructor = async ({ instructorId }) => {
    const groups = await StudyGroup.find({ ownerInstructor: instructorId, isActive: true })
        .populate("course", "title thumbnail status")
        .sort({ updatedAt: -1, lastMessageAt: -1 });

    const countMap = await getActiveMemberCountMap(groups.map((group) => group._id));

    return groups.map((group) => ({
        ...group.toObject(),
        memberCount: countMap.get(String(group._id)) || 0,
    }));
};

export const listStudyGroupMembers = async ({ groupId }) => {
    return StudyGroupMember.find({
        group: groupId,
        status: STUDY_GROUP_MEMBER_STATUS.ACTIVE,
    })
        .populate("user", "firstName lastName email profilePicture")
        .sort({ updatedAt: -1 });
};

export const getStudyGroupById = async ({ groupId }) => {
    const group = await StudyGroup.findById(groupId)
        .populate("course", "title thumbnail status instructor")
        .populate("ownerInstructor", "firstName lastName profilePicture");

    if (!group || !group.isActive) {
        throw new Error("Study group not found");
    }

    return group;
};

export const listStudyGroupMessages = async ({ groupId, page = 1, limit = 30, maxCreatedAt = null }) => {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 30));
    const skip = (safePage - 1) * safeLimit;
    const query = { group: groupId, isDeleted: false };

    if (maxCreatedAt) {
        query.createdAt = { $lte: new Date(maxCreatedAt) };
    }

    const [messages, total] = await Promise.all([
        StudyGroupMessage.find(query)
            .populate("sender", "firstName lastName profilePicture")
            .populate("mentions", "firstName lastName")
            .populate("replyTo", "content sender senderRole createdAt")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit),
        StudyGroupMessage.countDocuments(query),
    ]);

    return {
        messages: messages.reverse(),
        pagination: {
            currentPage: safePage,
            totalPages: Math.ceil(total / safeLimit),
            totalItems: total,
            itemsPerPage: safeLimit,
            hasNextPage: skip + safeLimit < total,
            hasPrevPage: safePage > 1,
        },
    };
};

export const createStudyGroupMessage = async ({
    groupId,
    senderId,
    senderRole,
    content,
    replyTo,
    mentions,
    files,
}) => {
    if (!Object.values(STUDY_GROUP_MESSAGE_SENDER_ROLE).includes(senderRole)) {
        throw new Error("Invalid sender role");
    }

    const cleanContent = String(content || "").trim();
    const attachments = await buildAttachmentPayload({ groupId, files });

    if (!cleanContent && attachments.length === 0) {
        throw new Error("Message content or attachment is required");
    }

    const mentionIds = parseMentionIds(mentions);

    if (senderRole === STUDY_GROUP_MESSAGE_SENDER_ROLE.USER) {
        await ensureMemberAccess({ groupId, userId: senderId });
    }

    const payload = {
        group: groupId,
        sender: senderId,
        senderRole,
        content: cleanContent,
        mentions: mentionIds,
        attachments,
        readBy: senderRole === STUDY_GROUP_MESSAGE_SENDER_ROLE.USER ? [{ user: senderId, readAt: new Date() }] : [],
    };

    if (replyTo) payload.replyTo = replyTo;

    const message = await StudyGroupMessage.create(payload);
    const populated = await StudyGroupMessage.findById(message._id)
        .populate("sender", "firstName lastName profilePicture")
        .populate("mentions", "firstName lastName")
        .populate("replyTo", "content sender senderRole createdAt");

    await StudyGroup.findByIdAndUpdate(groupId, {
        $inc: { messageCount: 1 },
        $set: { lastMessageAt: new Date() },
    });

    if (mentionIds.length > 0) {
        const eligibleMentionIds = mentionIds.filter((id) => String(id) !== String(senderId));
        const activeMentionMembers = await StudyGroupMember.find({
            group: groupId,
            user: { $in: eligibleMentionIds },
            status: STUDY_GROUP_MEMBER_STATUS.ACTIVE,
        }).select("user");

        const activeMentionUserIds = activeMentionMembers.map((member) => member.user);

        await Promise.all(
            activeMentionUserIds
                .map((recipientId) =>
                    Notification.createNotification({
                        recipient: recipientId,
                        recipientRole: "User",
                        type: STUDY_GROUP_MENTION_NOTIFICATION_TYPE,
                        title: "You were mentioned in a study group",
                        message: cleanContent.slice(0, 200),
                        data: { groupId, messageId: message._id },
                    })
                )
        );
    }

    return populated;
};

export const editStudyGroupMessage = async ({ messageId, userId, content }) => {
    const message = await StudyGroupMessage.findById(messageId);
    if (!message || message.isDeleted) {
        throw new Error("Message not found");
    }

    if (String(message.sender) !== String(userId)) {
        throw new Error("You can only edit your own message");
    }

    const cleanContent = String(content || "").trim();
    if (!cleanContent) {
        throw new Error("Edited message cannot be empty");
    }

    message.content = cleanContent;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    return message;
};

export const deleteStudyGroupMessage = async ({ messageId, actorId, actorRole, groupId }) => {
    const message = await StudyGroupMessage.findById(messageId);
    if (!message || message.isDeleted) {
        throw new Error("Message not found");
    }

    const canDeleteOwn = String(message.sender) === String(actorId);
    const isGroupOwner = actorRole === STUDY_GROUP_MESSAGE_SENDER_ROLE.INSTRUCTOR
        && String(groupId || "") === String(message.group);

    if (!canDeleteOwn && !isGroupOwner) {
        throw new Error("You are not allowed to delete this message");
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = "Message deleted";
    message.attachments = [];
    await message.save();

    return message;
};

export const toggleStudyGroupReaction = async ({ messageId, userId, emoji }) => {
    if (!STUDY_GROUP_REACTION_WHITELIST.includes(emoji)) {
        throw new Error("Unsupported reaction emoji");
    }

    const message = await StudyGroupMessage.findById(messageId);
    if (!message || message.isDeleted) {
        throw new Error("Message not found");
    }

    const reactionIndex = message.reactions.findIndex((r) => r.emoji === emoji);
    if (reactionIndex === -1) {
        message.reactions.push({ emoji, users: [userId] });
    } else {
        const hasReacted = message.reactions[reactionIndex].users.some((id) => String(id) === String(userId));
        if (hasReacted) {
            message.reactions[reactionIndex].users = message.reactions[reactionIndex].users.filter(
                (id) => String(id) !== String(userId)
            );
            if (message.reactions[reactionIndex].users.length === 0) {
                message.reactions.splice(reactionIndex, 1);
            }
        } else {
            message.reactions[reactionIndex].users.push(userId);
        }
    }

    await message.save();
    return message;
};

export const markStudyGroupRead = async ({ groupId, userId, messageIds = [] }) => {
    await StudyGroupMember.findOneAndUpdate(
        { group: groupId, user: userId, status: STUDY_GROUP_MEMBER_STATUS.ACTIVE },
        { $set: { lastReadAt: new Date() } },
        { new: true }
    );

    if (Array.isArray(messageIds) && messageIds.length > 0) {
        await StudyGroupMessage.updateMany(
            { _id: { $in: messageIds }, group: groupId, "readBy.user": { $ne: userId } },
            { $push: { readBy: { user: userId, readAt: new Date() } } }
        );
    }
};

export const updateStudyGroupSettings = async ({ groupId, instructorId, payload = {} }) => {
    const group = await StudyGroup.findById(groupId);
    if (!group || !group.isActive) {
        throw new Error("Study group not found");
    }

    if (String(group.ownerInstructor) !== String(instructorId)) {
        throw new Error("Only group admin can update group settings");
    }

    const next = {};
    if (payload.name !== undefined) next.name = String(payload.name || "").trim();
    if (payload.description !== undefined) next.description = String(payload.description || "").trim();
    if (payload.instructions !== undefined) next.instructions = normalizeInstructions(payload.instructions);
    if (payload.profilePhoto !== undefined) next.profilePhoto = payload.profilePhoto;

    Object.assign(group, next);
    await group.save();
    return group;
};

export const updateStudyGroupProfilePhoto = async ({ groupId, instructorId, file }) => {
    const group = await StudyGroup.findById(groupId);
    if (!group || !group.isActive) {
        throw new Error("Study group not found");
    }

    if (String(group.ownerInstructor) !== String(instructorId)) {
        throw new Error("Only group admin can update group profile photo");
    }

    if (!file) {
        throw new Error("Profile photo is required");
    }

    if (group.profilePhoto?.public_id) {
        await deleteImage(group.profilePhoto.public_id).catch(() => null);
    }

    const uploaded = await uploadStudyGroupProfilePhoto(file.buffer, groupId, file.originalname || "profile.jpg");
    group.profilePhoto = {
        public_id: uploaded.public_id,
        secure_url: uploaded.secure_url,
    };

    await group.save();
    return group;
};

export const removeStudyGroupMember = async ({ groupId, instructorId, userId, removalReason = "" }) => {
    const group = await StudyGroup.findById(groupId);
    if (!group || !group.isActive) throw new Error("Study group not found");

    if (String(group.ownerInstructor) !== String(instructorId)) {
        throw new Error("Only group admin can remove members");
    }

    const updated = await StudyGroupMember.findOneAndUpdate(
        { group: groupId, user: userId },
        {
            $set: {
                status: STUDY_GROUP_MEMBER_STATUS.REMOVED,
                removedAt: new Date(),
                removalReason,
                rejoinStatus: "none",
                rejoinRequestReason: "",
                rejoinRequestedAt: null,
            },
        },
        { new: true }
    );

    await recalcStudyGroupMemberCount(groupId);
    return updated;
};

export const updateStudyGroupMemberRejoinRequest = async ({ groupId, userId, rejoinRequestReason = "" }) => {
    const group = await StudyGroup.findById(groupId);
    if (!group || !group.isActive) throw new Error("Study group not found");

    const member = await StudyGroupMember.findOne({ group: groupId, user: userId });
    if (!member) throw new Error("Member not found");

    if (member.status !== STUDY_GROUP_MEMBER_STATUS.REMOVED) {
        throw new Error("Only removed members can request rejoin");
    }

    if (member.finalWarning) {
        throw new Error("You are permanently banned from rejoining this group");
    }

    if (member.rejoinStatus === "pending") {
        throw new Error("You already have a pending rejoin request");
    }

    if (member.rejoinStatus === "rejected") {
        throw new Error("Your rejoin request has already been rejected");
    }

    const updated = await StudyGroupMember.findOneAndUpdate(
        { group: groupId, user: userId },
        {
            $set: {
                rejoinStatus: "pending",
                rejoinRequestReason,
                rejoinRequestedAt: new Date(),
            },
        },
        { new: true }
    ).populate("user", "firstName lastName email profilePicture");

    return updated;
};

export const muteStudyGroupMember = async ({ groupId, instructorId, userId, durationMinutes, reason }) => {
    const group = await StudyGroup.findById(groupId);
    if (!group || !group.isActive) throw new Error("Study group not found");

    if (String(group.ownerInstructor) !== String(instructorId)) {
        throw new Error("Only group admin can mute members");
    }

    const mutedUntil = toFutureDateFromMinutes(durationMinutes);
    if (!mutedUntil) {
        throw new Error("Valid mute duration is required");
    }

    const member = await StudyGroupMember.findOneAndUpdate(
        { group: groupId, user: userId, status: STUDY_GROUP_MEMBER_STATUS.ACTIVE },
        {
            $set: {
                mutedUntil,
                mutedBy: instructorId,
                mutedReason: String(reason || "Please wait for ice break").slice(0, 300),
            },
        },
        { new: true }
    );

    if (!member) {
        throw new Error("Member not found in this study group");
    }

    return member;
};

export const getStudyGroupMembershipState = async ({ groupId, userId }) => {
    return StudyGroupMember.findOne({
        group: groupId,
        user: userId,
    });
};

export const unmuteStudyGroupMember = async ({ groupId, instructorId, userId }) => {
    const group = await StudyGroup.findById(groupId);
    if (!group || !group.isActive) throw new Error("Study group not found");

    if (String(group.ownerInstructor) !== String(instructorId)) {
        throw new Error("Only group admin can unmute members");
    }

    const member = await StudyGroupMember.findOneAndUpdate(
        { group: groupId, user: userId, status: STUDY_GROUP_MEMBER_STATUS.ACTIVE },
        {
            $unset: {
                mutedUntil: 1,
                mutedBy: 1,
                mutedReason: 1,
            },
        },
        { new: true }
    ).populate("user", "firstName lastName email profilePicture");

    if (!member) {
        throw new Error("Member not found in this study group");
    }

    return member;
};

export const getNonJoinedMembersForGroup = async ({ groupId, instructorId }) => {
    const group = await StudyGroup.findById(groupId).populate("course");
    if (!group || !group.isActive) throw new Error("Study group not found");

    if (String(group.ownerInstructor) !== String(instructorId)) {
        throw new Error("Only group admin can view non-joined members");
    }

    const courseId = group.course?._id;
    if (!courseId) throw new Error("Course not found for this study group");

    // Get all active members already in the group
    const groupMemberIds = await StudyGroupMember.distinct("user", {
        group: groupId,
        status: STUDY_GROUP_MEMBER_STATUS.ACTIVE,
    });

    // Get all removed members (for re-adding)
    const removedMemberIds = await StudyGroupMember.distinct("user", {
        group: groupId,
        status: STUDY_GROUP_MEMBER_STATUS.REMOVED,
    });

    // Get all enrolled users for this course
    const enrolledUsers = await Enrollment.find({
        course: courseId,
        status: { $in: ACTIVE_ENROLLMENT_STATUSES },
    }).distinct("user");

    // Non-joined = enrolled but not in group AND (never joined OR were removed)
    const potentialMembers = enrolledUsers.filter(
        (userId) =>
            !groupMemberIds.includes(userId) &&
            (removedMemberIds.includes(userId) || !groupMemberIds.includes(userId))
    );

    const members = await Enrollment.find({
        course: courseId,
        user: { $in: potentialMembers },
        status: { $in: ACTIVE_ENROLLMENT_STATUSES },
    })
        .populate("user", "firstName lastName email profilePicture")
        .sort({ createdAt: -1 });

    return members.map((enrollment) => ({
        _id: enrollment._id,
        user: enrollment.user,
        enrollmentStatus: enrollment.status,
    }));
};

export const addUserToStudyGroup = async ({ groupId, instructorId, userId }) => {
    const group = await StudyGroup.findById(groupId).populate("course");
    if (!group || !group.isActive) throw new Error("Study group not found");

    if (String(group.ownerInstructor) !== String(instructorId)) {
        throw new Error("Only group admin can add members");
    }

    const courseId = group.course?._id;
    if (!courseId) throw new Error("Course not found for this study group");

    // Verify user is enrolled in the course
    const enrollment = await Enrollment.findOne({
        course: courseId,
        user: userId,
        status: { $in: ACTIVE_ENROLLMENT_STATUSES },
    });

    if (!enrollment) {
        throw new Error("User is not enrolled in this course");
    }

    // Check if already a member
    const existingMember = await StudyGroupMember.findOne({
        group: groupId,
        user: userId,
    });

    if (existingMember && existingMember.status === STUDY_GROUP_MEMBER_STATUS.ACTIVE) {
        throw new Error("User is already a member of this study group");
    }

    // If previously removed, reactivate
    if (existingMember && existingMember.status === STUDY_GROUP_MEMBER_STATUS.REMOVED) {
        existingMember.status = STUDY_GROUP_MEMBER_STATUS.ACTIVE;
        existingMember.removedAt = null;
        await existingMember.save();
        await recalcStudyGroupMemberCount(groupId);
        return existingMember.populate("user", "firstName lastName email profilePicture");
    }

    // Create new member
    const member = await StudyGroupMember.create({
        group: groupId,
        user: userId,
        status: STUDY_GROUP_MEMBER_STATUS.ACTIVE,
        role: STUDY_GROUP_MEMBER_ROLE.MEMBER,
        joinedAt: new Date(),
    });

    await recalcStudyGroupMemberCount(groupId);
    return member.populate("user", "firstName lastName email profilePicture");
};

