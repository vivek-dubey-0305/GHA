import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend root directory
config({ path: path.resolve(__dirname, "../.env") });

// Application Configuration
export const appConfig = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : ['http://localhost:5173'],
};

// Database Configuration
export const dbConfig = {
    connectionString: process.env.CONNECTION_STRING,
    dbName: process.env.DB_NAME,
};

// JWT Configuration
export const jwtConfig = {
    accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET,
    accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
    refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
    refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
};

// Email/SMTP Configuration
export const smtpConfig = {
    host: process.env.SMTP_HOST,
    service: process.env.SMTP_SERVICE,
    port: process.env.SMTP_PORT,
    mail: process.env.SMTP_MAIL,
    password: process.env.SMTP_PASSWORD,
};

// Cloudinary Configuration
export const cloudinaryConfig = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
};

// Security Configuration
export const securityConfig = {
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
    },
    helmet: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
    },
};

// Validation function to check if all required env vars are present
export const validateConfig = () => {
    const requiredVars = [
        'JWT_ACCESS_TOKEN_SECRET',
        'JWT_REFRESH_TOKEN_SECRET',
        'CONNECTION_STRING',
        'DB_NAME',
        'CORS_ORIGIN',
        'SMTP_HOST',
        'SMTP_MAIL',
        'SMTP_PASSWORD',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
};