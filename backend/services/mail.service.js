import nodemailer from "nodemailer";
import { smtpConfig } from "../configs/app.config.js";

/**
 * Mail Service
 * Handles email sending using nodemailer
 */

// Create transporter
const createTransporter = () => {
    const port = parseInt(smtpConfig.port) || 587;
    const secure = port === 465; // true for 465, false for other ports

    return nodemailer.createTransport({
        service: smtpConfig.service || "gmail",
        host: smtpConfig.host,
        port: port,
        secure: secure,
        auth: {
            user: smtpConfig.mail,
            pass: smtpConfig.password,
        },
    });
};

/**
 * Send Email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @returns {Promise<Object>} - Send result
 */
export const sendEmail = async (options) => {
    try {
        const transporter = createTransporter();

        // Verify connection
        await transporter.verify();
        console.log("✅ SMTP connection verified");

        const mailOptions = {
            from: `"LMS Admin" <${smtpConfig.mail}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            ...(options.text && { text: options.text }),
        };

        const result = await transporter.sendMail(mailOptions);

        console.log(`📧 Email sent successfully to ${options.to} (ID: ${result.messageId})`);
        return {
            success: true,
            messageId: result.messageId,
            result,
        };
    } catch (error) {
        console.error("❌ Email sending failed:", error.message);
        console.error("SMTP Config:", {
            host: smtpConfig.host,
            port: smtpConfig.port,
            service: smtpConfig.service,
            user: smtpConfig.mail ? smtpConfig.mail.substring(0, 3) + "***" : "not set"
        });
        throw new Error(`Email sending failed: ${error.message}`);
    }
};

/**
 * Send OTP Email
 * @param {string} to - Recipient email
 * @param {string} otp - OTP code
 * @param {string} userName - User name
 * @param {string} type - OTP type (login, reset, etc.)
 * @returns {Promise<Object>} - Send result
 */
export const sendOTPEmail = async (to, otp, userName, type = "login") => {
    const subjectMap = {
        login: "Admin Login OTP Verification",
        reset: "Password Reset OTP",
        verify: "Email Verification OTP",
    };

    const subject = subjectMap[type] || "OTP Verification";

    // Import OTP template
    const { default: otpTemplate } = await import("../templates/otp.template.js");

    const html = otpTemplate({
        userName,
        otp,
        otpType: type,
        expiryTime: "10 minutes",
        expiryMinutes: 10,
        securityNote: true,
    });

    return await sendEmail({
        to,
        subject,
        html,
    });
};

/**
 * Send Password Reset Email
 * @param {string} to - Recipient email
 * @param {string} resetUrl - Password reset URL
 * @param {string} userName - User name
 * @param {string} expiryTime - Expiry time string (e.g., "5m")
 * @returns {Promise<Object>} - Send result
 */
export const sendPasswordResetEmail = async (to, resetUrl, userName, expiryTime = "5 minutes") => {
    const subject = "Password Reset Request - Admin Panel";

    // Import reset template
    const { default: resetTemplate } = await import("../templates/reset.template.js");

    // Parse expiry time (e.g., "5m" -> 5 hours)
    let expiryHours = 5;
    if (expiryTime.includes('m')) {
        expiryHours = parseInt(expiryTime) / 60; // Convert minutes to hours
    } else if (expiryTime.includes('h')) {
        expiryHours = parseInt(expiryTime);
    }

    const html = resetTemplate({
        userName,
        resetUrl,
        expiryTime: expiryTime.includes('m') ? expiryTime : expiryTime,
        expiryHours: Math.ceil(expiryHours),
        securityNote: true,
        supportEmail: process.env.ADMIN_MAIL || "support@lms.com"
    });

    return await sendEmail({
        to,
        subject,
        html,
    });
};

/**
 * Send Welcome Email
 * @param {string} to - Recipient email
 * @param {string} userName - User name
 * @param {string} userType - User type (admin, instructor, student)
 * @param {string} dashboardUrl - Dashboard URL
 * @returns {Promise<Object>} - Send result
 */
export const sendWelcomeEmail = async (to, userName, userType = "admin", dashboardUrl = null) => {
    const subject = userType === "admin" ? "Welcome to Admin Panel - GHA" : "Welcome to GHA Learning Platform";

    // Import welcome template
    const { default: welcomeTemplate } = await import("../templates/welcome.template.js");

    const html = welcomeTemplate({
        userName,
        userType,
        email: to,
        dashboardUrl: dashboardUrl || process.env.ADMIN_DASHBOARD_URL || "http://localhost:5173/admin/dashboard",
        firstName: userName.split(' ')[0],
    });

    return await sendEmail({
        to,
        subject,
        html,
    });
};

export default { sendEmail, sendOTPEmail, sendPasswordResetEmail, sendWelcomeEmail };
