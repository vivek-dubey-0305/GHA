import express from "express";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";
import { studyGroupUpload, upload } from "../middlewares/multer.middleware.js";
import {
    deleteMyStudyGroupMessage,
    editMyStudyGroupMessage,
    getInstructorStudyGroup,
    getInstructorStudyGroupMembers,
    getInstructorStudyGroupMessages,
    getMyStudyGroup,
    getMyStudyGroupMembers,
    getMyStudyGroupMessages,
    listInstructorStudyGroups,
    listMyStudyGroups,
    markMyStudyGroupRead,
    muteInstructorStudyGroupMember,
    unmuteInstructorStudyGroupMember,
    addMemberToStudyGroup,
    getNonJoinedMembers,
    reactToMyStudyGroupMessage,
    removeInstructorStudyGroupMember,
    sendInstructorStudyGroupMessage,
    sendMyStudyGroupMessage,
    updateInstructorStudyGroupPhoto,
    updateInstructorStudyGroupSettings,
    ensurePublishedCourseStudyGroup,
    requestRejoinStudyGroup,
    getInstructorRejoinRequests,
    acceptRejoinRequest,
    rejectRejoinRequest,
} from "../controllers/study-group.controller.js";

const router = express.Router();

// Instructor routes
router.get("/instructor/my", authenticateInstructor, listInstructorStudyGroups);
router.get("/instructor/:groupId", authenticateInstructor, getInstructorStudyGroup);
router.get("/instructor/:groupId/members", authenticateInstructor, getInstructorStudyGroupMembers);
router.get("/instructor/:groupId/messages", authenticateInstructor, getInstructorStudyGroupMessages);
router.post("/instructor/:groupId/messages", authenticateInstructor, studyGroupUpload.any(), sendInstructorStudyGroupMessage);
router.delete("/instructor/:groupId/messages/:messageId", authenticateInstructor, deleteMyStudyGroupMessage);
router.patch("/instructor/:groupId/settings", authenticateInstructor, updateInstructorStudyGroupSettings);
router.patch("/instructor/:groupId/profile-photo", authenticateInstructor, upload.single("profilePhoto"), updateInstructorStudyGroupPhoto);
router.patch("/instructor/:groupId/members/:userId/mute", authenticateInstructor, muteInstructorStudyGroupMember);
router.patch("/instructor/:groupId/members/:userId/unmute", authenticateInstructor, unmuteInstructorStudyGroupMember);
router.patch("/instructor/:groupId/members/:userId/remove", authenticateInstructor, removeInstructorStudyGroupMember);
router.get("/instructor/:groupId/rejoin-requests", authenticateInstructor, getInstructorRejoinRequests);
router.patch("/instructor/:groupId/rejoin-requests/:userId/accept", authenticateInstructor, acceptRejoinRequest);
router.patch("/instructor/:groupId/rejoin-requests/:userId/reject", authenticateInstructor, rejectRejoinRequest);
router.post("/instructor/:groupId/members/add", authenticateInstructor, addMemberToStudyGroup);
router.get("/instructor/:groupId/non-joined-members", authenticateInstructor, getNonJoinedMembers);

// Support endpoint to backfill/ensure for published courses
router.post("/instructor/course/:courseId/ensure", authenticateInstructor, ensurePublishedCourseStudyGroup);

// User (student) routes
router.get("/my", authenticateUser, listMyStudyGroups);
router.get("/:groupId", authenticateUser, getMyStudyGroup);
router.get("/:groupId/members", authenticateUser, getMyStudyGroupMembers);
router.get("/:groupId/messages", authenticateUser, getMyStudyGroupMessages);
router.post("/:groupId/messages", authenticateUser, studyGroupUpload.any(), sendMyStudyGroupMessage);
router.patch("/:groupId/messages/:messageId", authenticateUser, editMyStudyGroupMessage);
router.delete("/:groupId/messages/:messageId", authenticateUser, deleteMyStudyGroupMessage);
router.post("/:groupId/messages/:messageId/reactions", authenticateUser, reactToMyStudyGroupMessage);
router.patch("/:groupId/read", authenticateUser, markMyStudyGroupRead);
router.post("/:groupId/request-rejoin", authenticateUser, requestRejoinStudyGroup);

export default router;
