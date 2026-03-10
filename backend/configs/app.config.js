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

// Cloudflare R2 Configuration
export const r2Config = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKey: process.env.R2_ACCESS_KEY,
    secretKey: process.env.R2_SECRET_KEY,
    bucket: process.env.R2_BUCKET || 'gha-images',
    publicUrl: process.env.R2_PUBLIC_URL,
};

// Cloudflare Stream Configuration (Live Classes)
export const cloudflareStreamConfig = {
    accountId: process.env.R2_ACCOUNT_ID, // Same CF account
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    subdomain: process.env.CLOUDFLARE_STREAM_SUBDOMAIN,
    keyId: process.env.CLOUDFLARE_STREAM_KEY_ID,
    jwk: process.env.CLOUDFLARE_STREAM_JWK,
    defaultTokenExpiry: 14400, // 4 hours in seconds
    maxTokenExpiry: 86400,     // 24 hours max
};

// Security Configuration
export const securityConfig = {
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // limit each IP to 100 requests per windowMs
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
        'R2_ACCOUNT_ID',
        'R2_ACCESS_KEY',
        'R2_SECRET_KEY',
        'R2_PUBLIC_URL'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
};