import mongoose from "mongoose";
import logger from "./logger.config.js";
import { dbConfig } from "./app.config.js";

// Database Connection Function
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${dbConfig.connectionString}/${dbConfig.dbName}`)
        logger.success(`Connected to database: ${connectionInstance.connection.host}`);
    }

    catch (error) {
        logger.error(`Unable to connect to database: ${error.message}`);
        process.exit(1)
    }
}

export default connectDB;