// import express from "express";
// import { config } from "dotenv";
// import cookieParser from "cookie-parser";
// import cors from "cors"
// import helmet from "helmet";
// import rateLimit from "express-rate-limit";
// import csurf from "csurf";
// import { errorMiddleware } from "./middlewares/error.middleware.js";
// import { sanitizeInput } from "./middlewares/sanitization.middleware.js";
// import logger from "./configs/logger.config.js";
// import { appConfig, securityConfig, validateConfig } from "./configs/app.config.js";
// import adminAuthRouter from "./routes/admin.auth.routes.js";

// const app = express();

// // Load and validate configuration
// config({ path: "./.env" });
// validateConfig();
// logger.info("Configuration loaded and validated successfully");

// // *===================================
// // *Security Middlewares
// // Helmet for security headers
// app.use(helmet(securityConfig.helmet));

// // Rate limiting
// const limiter = rateLimit({
//     ...securityConfig.rateLimit,
//     message: "Too many requests from this IP, please try again later.",
//     standardHeaders: true,
//     legacyHeaders: false,
// });
// app.use(limiter);

// // CSRF protection (skip for API routes)
// const csrfProtection = csurf({ cookie: true });
// app.use((req, res, next) => {
//     // Skip CSRF for API routes
//     if (req.path.startsWith('/api/')) {
//         return next();
//     }
//     // Apply CSRF for other routes
//     csrfProtection(req, res, next);
// });

// // *Neccessary-Middlewares
// app.use(express.json({ limit: "256kb" }));
// app.use(express.urlencoded({ extended: true }))
// app.use(cookieParser());

// // Input sanitization
// app.use(sanitizeInput);

// // ================ CORS Configuration ===================
// app.use(cors({
//     origin: (origin, callback) => {
//         if (!origin || appConfig.corsOrigin.includes(origin)) {
//             callback(null, true);
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     },
//     credentials: true
// }));

// // ================= Health Check Route ===================
// app.get("/", (req, res) => {
//     logger.info("Health check endpoint accessed");
//     res.status(200).json({
//         success: true,
//         message: "✅ GHA Backend is Running Successfully!",
//         version: "1.0.0",
//         author: "Vivek Dubey (backend)",
//         timestamp: new Date().toISOString(),
//     });
// });

// // ================= CSRF Token Route ===================
// app.get("/csrf-token", (req, res) => {
//     logger.info("CSRF token requested");
//     res.json({ csrfToken: req.csrfToken() });
// });

// // ================= Routes ===================
// app.use("/api/v1/admin", adminAuthRouter);

// // ================= Other Routes ===================
// // Add other route modules here as needed


// app.use(errorMiddleware)
// // *End-Of-Neccessary-Middlewares
// // *===================================

// export { app };


// ===========Perfect ordering od middlewares===================
import express from "express";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import csurf from "csurf";

import { errorMiddleware } from "./middlewares/error.middleware.js";
import { sanitizeInput } from "./middlewares/sanitization.middleware.js";
import logger from "./configs/logger.config.js";
import { appConfig, securityConfig, validateConfig } from "./configs/app.config.js";
import adminAuthRouter from "./routes/admin.auth.routes.js";
import userAuthRouter from "./routes/user.auth.routes.js";
import instructorAuthRouter from "./routes/instructor.auth.routes.js";
import adminRouter from "./routes/admin.routes.js";

// Import models to register them with Mongoose
import { User } from "./models/user.model.js";
import { Course } from "./models/course.model.js";
import { Instructor } from "./models/instructor.model.js";
import { Admin } from "./models/admin.model.js";

const app = express();

// ================= ENV =================
config({ path: "./.env" });
validateConfig();
logger.info("Configuration loaded and validated successfully");

// ================= CORS (FIRST) =================
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || appConfig.corsOrigin.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

// ================= PARSERS (BEFORE SECURITY) =================
app.use(cookieParser());
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true }));

// ================= HELMET =================
app.use(helmet(securityConfig.helmet));

// ================= RATE LIMIT (AFTER CORS) =================
const limiter = rateLimit({
    ...securityConfig.rateLimit,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) =>
        req.path.startsWith("/api/v1/admin/refresh-token") ||
        req.path.startsWith("/api/v1/user/refresh-token") ||
        req.path.startsWith("/api/v1/instructor/refresh-token") ||
        req.path === "/"
});
app.use(limiter);

// ================= CSRF =================
const csrfProtection = csurf({ cookie: true });

app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    csrfProtection(req, res, next);
});

// ================= SANITIZATION =================
app.use(sanitizeInput);

// ================= ROUTES =================
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "✅ GHA Backend is Running Successfully!",
        timestamp: new Date().toISOString()
    });
});

// CSRF token route MUST have csrfProtection applied
app.get("/csrf-token", csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// API routes
app.use("/api/v1/admin/auth", adminAuthRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/user/auth", userAuthRouter);
app.use("/api/v1/instructor/auth", instructorAuthRouter); 

// ================= ERROR HANDLER (LAST) =================
app.use(errorMiddleware);

export { app };