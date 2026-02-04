/**
 * OTP Email Template
 * Professional OTP verification with security information
 */

const otpTemplate = (data) => {
  const {
    userName = "User",
    otp = "123456",
    otpType = "login", // login, signup, verify, reset
    expiryTime = "10 minutes",
    expiryMinutes = 10,
    securityNote = true,
  } = data;

  const otpTypeConfig = {
    login: {
      title: "Login Verification",
      message: "Your one-time password for secure login",
    },
    signup: {
      title: "Verify Your Email",
      message: "Your one-time password to complete registration",
    },
    verify: {
      title: "Email Verification",
      message: "Your one-time password to verify your email",
    },
    reset: {
      title: "Password Reset",
      message: "Your one-time password to reset your password",
    },
  };

  const config = otpTypeConfig[otpType] || otpTypeConfig.login;

  // Split OTP into individual digits
  const otpDigits = otp.toString().split("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>One-Time Password - ${config.title}</title>
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
          margin-bottom: 25px;
          line-height: 1.5;
        }

        .otp-container {
          background-color: #f9f9f9;
          border: 2px solid #cccccc;
          padding: 25px;
          border-radius: 8px;
          margin: 25px 0;
          text-align: center;
        }

        .otp-label {
          color: #333333;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 15px;
        }

        .otp-display {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 15px;
        }

        .otp-digit {
          width: 45px;
          height: 55px;
          background-color: #ffffff;
          border: 2px solid #999999;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          color: #000000;
        }

        .otp-text {
          font-family: 'Courier New', monospace;
          font-size: 24px;
          font-weight: bold;
          color: #000000;
          letter-spacing: 6px;
          margin-top: 10px;
          user-select: all;
        }

        .timer-section {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 6px;
          text-align: center;
          margin-top: 20px;
          border: 1px solid #e5e5e5;
        }

        .timer-label {
          color: #666666;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 8px 0;
        }

        .timer {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
        }

        .timer-circle {
          width: 50px;
          height: 50px;
          background-color: #000000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 18px;
          font-weight: bold;
        }

        .timer-text {
          color: #333333;
        }

        .timer-time {
          font-size: 14px;
          font-weight: bold;
          color: #000000;
          margin: 0;
        }

        .security-info {
          background-color: #f9f9f9;
          border-left: 4px solid #666666;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }

        .security-title {
          color: #000000;
          font-weight: bold;
          font-size: 12px;
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .security-text {
          color: #333333;
          font-size: 12px;
          margin: 0;
          line-height: 1.5;
        }

        .safety-tips {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }

        .tips-title {
          color: #000000;
          font-weight: bold;
          font-size: 12px;
          margin: 0 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tip {
          color: #666666;
          font-size: 12px;
          margin: 6px 0;
          padding-left: 15px;
          position: relative;
          line-height: 1.4;
        }

        .tip:before {
          content: '•';
          position: absolute;
          left: 0;
          color: #999999;
          font-weight: bold;
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
          <h1>${config.title}</h1>
          <p>${config.message}</p>
        </div>

        <div class="content">
          <p class="greeting">Hi ${userName},</p>
          <p class="message">
            Use this one-time password to verify your identity. Do not share this code with anyone.
          </p>

          <div class="otp-container">
            <div class="otp-label">Your Code</div>

            <div class="otp-display">
              ${otpDigits.map(digit => `<div class="otp-digit">${digit}</div>`).join("")}
            </div>

            <div class="otp-text">${otp}</div>

            <div class="timer-section">
              <p class="timer-label">Code Expires In</p>
              <div class="timer">
                <div class="timer-circle">
                  <span>${expiryMinutes}</span>
                </div>
                <div class="timer-text">
                  <p class="timer-time">${expiryTime}</p>
                  <p style="font-size: 11px; margin: 0; color: #666666;">from now</p>
                </div>
              </div>
            </div>
          </div>

          ${securityNote ? `
            <div class="security-info">
              <p class="security-title">Security Notice</p>
              <p class="security-text">
                Never share your OTP with anyone, including our support team. We will never ask for your code via email, phone, or message.
              </p>
            </div>
          ` : ""}

          <div class="safety-tips">
            <p class="tips-title">Safety Tips</p>
            <p class="tip">Only use this code to complete your current action</p>
            <p class="tip">This code is valid for ${expiryTime}</p>
            <p class="tip">If you didn't request this, ignore this email</p>
            <p class="tip">Never share your code via email or chat</p>
          </div>
        </div>

        <div class="footer">
          <p><strong>Didn't request this code?</strong></p>
          <p>If this wasn't you, please secure your account immediately by changing your password.</p>
          <p style="margin-top: 12px; color: #999999;">© 2026 Learning Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default otpTemplate;