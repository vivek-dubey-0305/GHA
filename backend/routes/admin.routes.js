import express from "express";
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    uploadUserProfilePicture,
    deleteUserProfilePicture
} from "../controllers/admin.controller.js";
import { verifyAdminToken } from "../middlewares/admin.auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Apply admin authentication to all routes
router.use(verifyAdminToken);

// User CRUD routes
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Profile picture management routes
router.post("/users/:id/upload-profile-picture", upload.single("profilePicture"), uploadUserProfilePicture);
router.delete("/users/:id/profile-picture", deleteUserProfilePicture);

export default router;
