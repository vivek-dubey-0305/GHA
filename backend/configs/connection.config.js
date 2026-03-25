import mongoose from "mongoose";
import logger from "./logger.config.js";
import { dbConfig } from "./app.config.js";
import { Progress } from "../models/progress.model.js";

// Database Connection Function
const connectDB = async () => {
    try {
        // Fix: Insert database name BEFORE query parameters (?ssl=true...)
        let uri = dbConfig.connectionString;
        
        if (uri.includes('/?')) {
            // Replace /? with /dbName?
            uri = uri.replace('/?', `/${dbConfig.dbName}?`);
        } else if (uri.includes('?')) {
            // If query params exist without /, insert dbName before them
            uri = uri.replace('?', `/${dbConfig.dbName}?`);
        } else {
            // No query params, just append dbName
            uri = `${uri}/${dbConfig.dbName}`;
        }

        const connectionInstance = await mongoose.connect(uri);
        logger.success(`Connected to database: ${connectionInstance.connection.host}`);

        try {
            const progressCollection = mongoose.connection.collection("progress");
            const indexes = await progressCollection.indexes();
            const legacyUniqueCourseIndex = indexes.find(
                (idx) => idx?.name === "user_1_course_1" && idx?.unique
            );

            if (legacyUniqueCourseIndex) {
                await progressCollection.dropIndex("user_1_course_1");
                logger.info("Dropped legacy unique index: progress.user_1_course_1");
            }

            await Progress.syncIndexes();
            logger.info("Progress indexes synced");
        } catch (indexError) {
            logger.warn(`Progress index migration warning: ${indexError.message}`);
        }
    }

    catch (error) {
        logger.error(`Unable to connect to database: ${error.message}`);
        process.exit(1)
    }
}

export default connectDB;

// import mongoose from "mongoose";
// import dns from "dns";
// import logger from "./logger.config.js";
// import { dbConfig } from "./app.config.js";

// dns.setDefaultResultOrder("ipv4first");

// const connectDB = async () => {
//     try {

//         const uri = `${dbConfig.connectionString}/${dbConfig.dbName}`;

//         console.log("Attempting to connect to database...");
//         console.log(uri.replace(/:[^:@]+@/, ":****@"));

//         const connectionInstance = await mongoose.connect(uri, {
//             family: 4,
//             serverSelectionTimeoutMS: 10000,
//             socketTimeoutMS: 45000
//         });

//         logger.success(`Connected to database: ${connectionInstance.connection.host}`);

//     } catch (error) {

//         logger.error(`Unable to connect to database: ${error.message}`);
//         process.exit(1);

//     }
// };

// export default connectDB;