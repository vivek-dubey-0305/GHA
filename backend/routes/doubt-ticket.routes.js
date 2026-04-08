import express from "express";
import { authenticateUser } from "../middlewares/user.auth.middleware.js";
import { authenticateInstructor } from "../middlewares/instructor.auth.middleware.js";
import { doubtTicketUpload, doubtReplyImageUpload, handleMulterError } from "../middlewares/multer.middleware.js";
import {
    createDoubtTicket,
    getMyDoubtTickets,
    getMyDoubtQuota,
    getMyDoubtTicketById,
    addUserReplyToDoubtTicket,
    submitDoubtResolutionFeedback,
    getAssignedDoubtTickets,
    getAssignedDoubtTicketById,
    acceptDoubtTicket,
    resolveDoubtTicket,
    addInstructorReplyToDoubtTicket,
} from "../controllers/doubt-ticket.controller.js";

const router = express.Router();

router.post(
    "/user",
    authenticateUser,
    doubtTicketUpload.array("attachments", 5),
    handleMulterError,
    createDoubtTicket
);
router.get("/user/my", authenticateUser, getMyDoubtTickets);
router.get("/user/my/quota", authenticateUser, getMyDoubtQuota);
router.get("/user/:id", authenticateUser, getMyDoubtTicketById);
router.post(
    "/user/:id/replies",
    authenticateUser,
    doubtReplyImageUpload.array("images", 6),
    handleMulterError,
    addUserReplyToDoubtTicket
);
router.patch("/user/:id/feedback", authenticateUser, submitDoubtResolutionFeedback);

router.get("/instructor/assigned", authenticateInstructor, getAssignedDoubtTickets);
router.get("/instructor/:id", authenticateInstructor, getAssignedDoubtTicketById);
router.patch("/instructor/:id/accept", authenticateInstructor, acceptDoubtTicket);
router.patch("/instructor/:id/resolve", authenticateInstructor, resolveDoubtTicket);
router.post(
    "/instructor/:id/replies",
    authenticateInstructor,
    doubtReplyImageUpload.array("images", 6),
    handleMulterError,
    addInstructorReplyToDoubtTicket
);

export default router;
