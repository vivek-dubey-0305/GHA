/**
 * Environment Variable Validation
 * Ensures all required environment variables are present at startup
 */

import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, "../.env") });

// Required environment variables for the application
const requiredEnvVars = [
    "JWT_ACCESS_TOKEN_SECRET",
    "JWT_REFRESH_TOKEN_SECRET",
    "JWT_ACCESS_TOKEN_EXPIRES_IN",
    "JWT_REFRESH_TOKEN_EXPIRES_IN",
    "OTP_EXPIRES_IN",
    "PASSWORD_RESET_EXPIRES_IN",
    "ACCOUNT_LOCK_DURATION",
    "NODE_ENV",
    "CONNECTION_STRING",
    "DB_NAME",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY",
    "R2_SECRET_KEY",
    "R2_PUBLIC_URL",
];

// Optional environment variables with defaults
const optionalEnvVars = {
    "PORT": "5000",
    "EMAIL_USER": null,
    "EMAIL_PASS": null,
    "PAYMENT_SECRET_KEY": null
};

/**
 * Validates that all required environment variables are present
 * Throws an error if any required variable is missing
 */
export const validateEnvironment = () => {
    const missingVars = [];

    // Check required variables
    requiredEnvVars.forEach(key => {
        if (!process.env[key]) {
            missingVars.push(key);
        }
    });

    if (missingVars.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingVars.join(', ')}\n` +
            'Please check your .env file and ensure all required variables are set.'
        );
    }

    // Set defaults for optional variables
    Object.entries(optionalEnvVars).forEach(([key, defaultValue]) => {
        if (!process.env[key] && defaultValue !== null) {
            process.env[key] = defaultValue;
        }
    });

    console.log('✅ Environment variables validated successfully');
};

/**
 * Gets environment variable with type conversion
 * @param {string} key - Environment variable key
 * @param {*} defaultValue - Default value if not set
 * @returns {*} Environment variable value
 */
export const getEnvVar = (key, defaultValue = null) => {
    const value = process.env[key];
    if (value === undefined && defaultValue === null) {
        throw new Error(`Environment variable ${key} is required but not set`);
    }
    return value || defaultValue;
};