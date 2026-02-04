import { app } from "./app.js";
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
        const server = app.listen(port, () => {
            logger.success(`Server is running on port ${port} in ${appConfig.nodeEnv} mode`);
        });

        // Handle server errors
        server.on('error', (err) => {
            logger.error(`Server error: ${err.message}`);
            process.exit(1);
        });
    })
    .catch((err) => {
        logger.error(`Database connection failed: ${err.message}`);
        process.exit(1);
    });