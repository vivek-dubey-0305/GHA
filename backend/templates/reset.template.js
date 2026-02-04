/**
 * Password Reset Email Template
 * Professional password reset with verification link
 */

const resetTemplate = (data) => {
  const {
    userName = "User",
    resetUrl,
    expiryTime = "24 hours",
    expiryHours = 24,
    securityNote = true,
    supportEmail = "support@lms.com",
  } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 20px;
          color: #333333;
        }

        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border: 1px solid #cccccc;
          border-radius: 8px;
          overflow: hidden;
        }

        .header {
          background-color: #000000;
          padding: 30px 20px;
          text-align: center;
          color: #ffffff;
        }

        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
          letter-spacing: -0.5px;
        }

        .header p {
          margin: 10px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .content {
          padding: 30px;
        }

        .greeting {
          font-size: 16px;
          color: #333333;
          margin-bottom: 15px;
        }

        .message {
          font-size: 14px;
          color: #666666;
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .alert-box {
          background-color: #f9f9f9;
          border-left: 4px solid #666666;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }

        .alert-title {
          color: #000000;
          font-weight: bold;
          font-size: 12px;
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .alert-text {
          color: #333333;
          font-size: 12px;
          margin: 0;
          line-height: 1.5;
        }

        .cta-section {
          background-color: #f5f5f5;
          padding: 20px;
          border-radius: 6px;
          margin: 25px 0;
          text-align: center;
          border: 1px solid #e5e5e5;
        }

        .cta-label {
          color: #000000;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 15px 0;
        }

        .cta-button {
          display: inline-block;
          background-color: #000000;
          color: #ffffff;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          font-size: 14px;
          margin: 8px 4px;
        }

        .alt-text {
          color: #666666;
          font-size: 12px;
          margin-top: 15px;
        }

        .alt-link {
          color: #000000;
          text-decoration: none;
          font-weight: bold;
          word-break: break-all;
        }

        .timer-box {
          background-color: #f9f9f9;
          border: 1px solid #cccccc;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          text-align: center;
        }

        .timer-title {
          color: #000000;
          font-weight: bold;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 10px 0;
        }

        .timer-content {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
        }

        .timer-icon {
          font-size: 20px;
          color: #666666;
        }

        .timer-text {
          color: #333333;
          font-size: 13px;
          margin: 0;
        }

        .timer-time {
          font-weight: bold;
          color: #000000;
          font-size: 16px;
        }

        .security-box {
          background-color: #f5f5f5;
          border-left: 4px solid #666666;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }

        .security-title {
          color: #000000;
          font-weight: bold;
          font-size: 12px;
          margin: 0 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .security-text {
          color: #333333;
          font-size: 12px;
          margin: 0 0 8px 0;
          line-height: 1.5;
        }

        .security-list {
          color: #666666;
          font-size: 12px;
          margin: 0;
          padding-left: 15px;
        }

        .security-list li {
          margin: 4px 0;
          line-height: 1.4;
        }

        .info-box {
          background-color: #f9f9f9;
          border: 1px solid #e5e5e5;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }

        .info-title {
          color: #000000;
          font-weight: bold;
          font-size: 12px;
          margin: 0 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-text {
          color: #666666;
          font-size: 12px;
          margin: 6px 0;
          line-height: 1.5;
        }

        .footer {
          background-color: #f5f5f5;
          padding: 20px;
          text-align: center;
          color: #666666;
          font-size: 12px;
          border-top: 1px solid #e5e5e5;
        }

        .footer p {
          margin: 6px 0;
        }

        .footer strong {
          color: #000000;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
          <p>Secure your account by resetting your password</p>
        </div>

        <div class="content">
          <p class="greeting">Hi ${userName},</p>

          <p class="message">
            We received a request to reset your password. If you made this request, click the button below to set a new password.
          </p>

          <div class="alert-box">
            <p class="alert-title">Security Notice</p>
            <p class="alert-text">
              This link will only work for ${expiryTime}. If you didn't request a password reset, please ignore this email.
            </p>
          </div>

          <div class="cta-section">
            <p class="cta-label">Reset Your Password</p>
            ${resetUrl ? `
              <a href="${resetUrl}" class="cta-button">Reset Password</a>
            ` : ""}

            <p class="alt-text">
              Or copy and paste this link in your browser:<br>
              <a href="${resetUrl}" class="alt-link">${resetUrl || "https://lms.example.com/reset-password"}</a>
            </p>
          </div>

          <div class="timer-box">
            <p class="timer-title">Link Expires In</p>
            <div class="timer-content">
              <div class="timer-icon">⏳</div>
              <div>
                <p class="timer-text">
                  <span class="timer-time">${expiryHours}</span> hours
                </p>
              </div>
            </div>
          </div>

          <div class="security-box">
            <p class="security-title">Password Reset Best Practices</p>
            <p class="security-text">When creating your new password:</p>
            <ul class="security-list">
              <li>Use at least 8 characters</li>
              <li>Mix uppercase, lowercase, numbers, and symbols</li>
              <li>Don't reuse your old password</li>
              <li>Avoid common words or patterns</li>
            </ul>
          </div>

          <div class="info-box">
            <p class="info-title">Important Information</p>
            <p class="info-text">
              <strong>Didn't request this?</strong><br>
              If you didn't request a password reset, please ignore this email. Your account remains secure.
            </p>
            <p class="info-text">
              <strong>Still having issues?</strong><br>
              Contact our support team at <a href="mailto:${supportEmail}" style="color: #000000; text-decoration: none; font-weight: bold;">${supportEmail}</a>
            </p>
          </div>
        </div>

        <div class="footer">
          <p><strong>Quick Troubleshooting:</strong></p>
          <p>If the button doesn't work, copy the link above and paste it into your browser.</p>
          <p>Make sure you're using the same device where you received this email.</p>
          <p style="margin-top: 12px; color: #999999;">© 2026 Learning Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default resetTemplate;
