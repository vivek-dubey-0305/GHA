/**
 * Delete Account/Course Email Template
 * Professional deletion verification with security key
 */

const deleteTemplate = (data) => {
  const {
    userName = "User",
    deleteType = "account", // account or course
    itemName = "Your Account",
    deletionKey = "KEY-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
    keyExpiry = "24 hours",
    verificationUrl,
    instructionText,
    courseTitle,
  } = data;

  const isAccount = deleteType === "account";
  const isCourse = deleteType === "course";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Deletion Verification - ${isAccount ? "Account" : "Course"}</title>
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
          padding: 25px 20px;
          text-align: center;
          color: #ffffff;
        }

        .header h1 {
          margin: 0;
          font-size: 22px;
          font-weight: bold;
          letter-spacing: -0.5px;
        }

        .header p {
          margin: 8px 0 0 0;
          font-size: 13px;
          opacity: 0.9;
        }

        .warning-icon {
          font-size: 32px;
          margin-bottom: 10px;
        }

        .content {
          padding: 25px;
        }

        .alert-box {
          background-color: #f9f9f9;
          border-left: 4px solid #666666;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .alert-title {
          color: #000000;
          font-weight: bold;
          font-size: 14px;
          margin: 0 0 8px 0;
        }

        .alert-text {
          color: #333333;
          font-size: 13px;
          margin: 0;
          line-height: 1.5;
        }

        .deletion-type {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          text-align: center;
        }

        .deletion-type-title {
          color: #000000;
          font-weight: bold;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 6px 0;
        }

        .deletion-type-content {
          color: #333333;
          font-size: 16px;
          font-weight: bold;
          margin: 0;
        }

        .key-section {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
          text-align: center;
          border: 1px solid #e5e5e5;
        }

        .key-label {
          color: #000000;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 10px 0;
        }

        .deletion-key {
          background-color: #ffffff;
          border: 2px solid #cccccc;
          padding: 12px 15px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 16px;
          font-weight: bold;
          color: #000000;
          letter-spacing: 2px;
          word-break: break-all;
          user-select: all;
          margin: 0;
        }

        .key-note {
          color: #666666;
          font-size: 11px;
          margin-top: 10px;
          font-style: italic;
        }

        .steps-section {
          background-color: #f5f5f5;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
          border-left: 4px solid #666666;
        }

        .steps-title {
          color: #000000;
          font-weight: bold;
          font-size: 13px;
          margin: 0 0 15px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .step {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          align-items: flex-start;
        }

        .step:last-child {
          margin-bottom: 0;
        }

        .step-number {
          background-color: #000000;
          color: #ffffff;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 11px;
          flex-shrink: 0;
        }

        .step-content {
          color: #666666;
          font-size: 13px;
          line-height: 1.5;
          margin: 0;
        }

        .step-content strong {
          color: #000000;
          font-weight: bold;
        }

        .info-box {
          background-color: #f9f9f9;
          border-left: 4px solid #666666;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }

        .info-title {
          color: #000000;
          font-weight: bold;
          font-size: 12px;
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-text {
          color: #333333;
          font-size: 12px;
          margin: 0;
          line-height: 1.5;
        }

        .expiry-warning {
          background-color: #f5f5f5;
          border-left: 4px solid #666666;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }

        .expiry-title {
          color: #000000;
          font-weight: bold;
          font-size: 12px;
          margin: 0 0 5px 0;
        }

        .expiry-text {
          color: #666666;
          font-size: 12px;
          margin: 0;
        }

        .cta-buttons {
          text-align: center;
          margin-top: 25px;
        }

        .cta-button {
          display: inline-block;
          background-color: #000000;
          color: #ffffff;
          padding: 10px 25px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin: 8px 4px;
          font-size: 13px;
        }

        .secondary-button {
          display: inline-block;
          background-color: #f5f5f5;
          color: #000000;
          padding: 10px 25px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin: 8px 4px;
          font-size: 13px;
          border: 1px solid #cccccc;
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="warning-icon">⚠️</div>
          <h1>${isAccount ? "Account Deletion" : "Course Deletion"}</h1>
          <p>Verification Required</p>
        </div>

        <div class="content">
          <div class="alert-box">
            <p class="alert-title">Important Notice</p>
            <p class="alert-text">
              A deletion request has been initiated for your ${isAccount ? "account" : "course"}.
              To proceed, you must verify this action using the security key below.
            </p>
          </div>

          <div class="deletion-type">
            <p class="deletion-type-title">${isAccount ? "Account" : "Course"} to be deleted</p>
            <p class="deletion-type-content">
              ${isAccount ? `👤 ${userName}` : `📚 ${courseTitle}`}
            </p>
          </div>

          <div class="key-section">
            <p class="key-label">Deletion Security Key</p>
            <p class="deletion-key">${deletionKey}</p>
            <p class="key-note">Keep this key confidential and do not share it with anyone.</p>
          </div>

          <div class="steps-section">
            <p class="steps-title">How to proceed:</p>

            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                Go to your ${isAccount ? "account settings" : "course settings"} in the dashboard
              </div>
            </div>

            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                Navigate to the <strong>Delete ${isAccount ? "Account" : "Course"}</strong> section
              </div>
            </div>

            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                Copy and paste the security key shown above into the verification field
              </div>
            </div>

            <div class="step">
              <div class="step-number">4</div>
              <div class="step-content">
                Click confirm to permanently delete your ${isAccount ? "account" : "course"}
              </div>
            </div>
          </div>

          <div class="info-box">
            <p class="info-title">What will happen:</p>
            <p class="info-text">
              ${isAccount ?
                "All your data, enrollments, progress, and certificates will be permanently deleted and cannot be recovered."
                : "This course and all associated content will be permanently removed from the system."
              }
            </p>
          </div>

          <div class="expiry-warning">
            <p class="expiry-title">Expiry Notice</p>
            <p class="expiry-text">
              This deletion key is valid for ${keyExpiry}. After that, you'll need to request a new deletion key.
            </p>
          </div>

          ${instructionText ? `
            <div style="background-color: #f9f9f9; border-left: 4px solid #666666; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #333333; font-size: 13px; margin: 0; line-height: 1.5;">${instructionText}</p>
            </div>
          ` : ""}

          <div class="cta-buttons">
            ${verificationUrl ? `
              <a href="${verificationUrl}" class="cta-button">Verify & Delete</a>
            ` : ""}
            <a href="#" class="secondary-button">Cancel Deletion</a>
          </div>
        </div>

        <div class="footer">
          <p><strong>Need Help?</strong></p>
          <p>If you didn't request this deletion or need assistance, please contact support immediately.</p>
          <p style="margin-top: 12px; color: #999999;">© 2026 Learning Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default deleteTemplate;
