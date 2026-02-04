/**
 * Welcome Email Template
 * Professional welcome message for new users
 */

const welcomeTemplate = (data) => {
  const {
    userName = "User",
    userType = "student", // student, instructor, admin
    email,
    dashboardUrl,
    firstName = "User",
  } = data;

  const userTypeConfig = {
    student: {
      title: "Welcome to Learning!",
      subtitle: "Start your learning journey today",
      features: [
        { title: "Explore Courses", desc: "Browse thousands of courses across various topics" },
        { title: "Track Progress", desc: "Monitor your learning progress with detailed analytics" },
        { title: "Earn Certificates", desc: "Get recognized certificates upon course completion" },
        { title: "Community Support", desc: "Connect with instructors and fellow learners" },
      ],
    },
    instructor: {
      title: "Welcome as an Instructor!",
      subtitle: "Start creating and teaching courses",
      features: [
        { title: "Create Courses", desc: "Design and publish engaging courses" },
        { title: "Analytics", desc: "Track student progress and engagement" },
        { title: "Monetize", desc: "Earn revenue from your courses" },
        { title: "Customization", desc: "Build your brand and showcase expertise" },
      ],
    },
    admin: {
      title: "Admin Panel Access Granted",
      subtitle: "Manage your learning platform",
      features: [
        { title: "User Management", desc: "Manage students, instructors, and administrators" },
        { title: "Course Control", desc: "Approve and manage all courses" },
        { title: "Platform Analytics", desc: "View comprehensive platform statistics" },
        { title: "Settings", desc: "Configure platform features and policies" },
      ],
    },
  };

  const config = userTypeConfig[userType] || userTypeConfig.student;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Learning Platform</title>
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

        .intro-text {
          font-size: 14px;
          color: #666666;
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .features-section {
          background-color: #f9f9f9;
          border: 1px solid #e5e5e5;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
        }

        .features-title {
          color: #000000;
          font-size: 14px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 15px 0;
        }

        .features {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .feature {
          display: flex;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid #e5e5e5;
        }

        .feature:last-child {
          border-bottom: none;
        }

        .feature-icon {
          font-size: 16px;
          min-width: 20px;
          text-align: center;
          color: #999999;
        }

        .feature-content {
          flex: 1;
        }

        .feature-title {
          color: #333333;
          font-weight: bold;
          font-size: 13px;
          margin: 0 0 3px 0;
        }

        .feature-desc {
          color: #666666;
          font-size: 12px;
          margin: 0;
          line-height: 1.4;
        }

        .account-info {
          background-color: #f5f5f5;
          border-left: 4px solid #666666;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }

        .account-label {
          color: #000000;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 10px 0;
        }

        .account-details {
          margin: 0;
          color: #333333;
          font-size: 13px;
          line-height: 1.6;
        }

        .account-detail {
          margin: 6px 0;
        }

        .account-label-text {
          font-weight: bold;
          display: inline-block;
          width: 80px;
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
          margin-top: 20px;
        }

        .next-steps {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 6px;
          margin: 25px 0 0 0;
          border: 1px solid #e5e5e5;
        }

        .next-steps-title {
          color: #000000;
          font-weight: bold;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 15px 0;
        }

        .step {
          display: flex;
          gap: 10px;
          margin-bottom: 12px;
          align-items: flex-start;
        }

        .step:last-child {
          margin-bottom: 0;
        }

        .step-number {
          background-color: #000000;
          color: #ffffff;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          flex-shrink: 0;
        }

        .step-text {
          color: #666666;
          font-size: 13px;
          margin: 0;
          line-height: 1.5;
        }

        .support-box {
          background-color: #f5f5f5;
          border-left: 4px solid #666666;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }

        .support-title {
          color: #000000;
          font-weight: bold;
          font-size: 12px;
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .support-text {
          color: #333333;
          font-size: 12px;
          margin: 0;
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${config.title}</h1>
          <p>${config.subtitle}</p>
        </div>

        <div class="content">
          <p class="greeting">Hello ${firstName},</p>

          <p class="intro-text">
            Welcome to our Learning Platform! We're excited to have you on board.
            Your account has been successfully created and you're ready to get started.
          </p>

          <div class="features-section">
            <p class="features-title">What You Can Do</p>
            <div class="features">
              ${config.features.map((feature, index) => `
                <div class="feature">
                  <div class="feature-icon">${index + 1}</div>
                  <div class="feature-content">
                    <p class="feature-title">${feature.title}</p>
                    <p class="feature-desc">${feature.desc}</p>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="account-info">
            <p class="account-label">Your Account Details</p>
            <div class="account-details">
              <div class="account-detail">
                <span class="account-label-text">Name:</span> ${userName}
              </div>
              <div class="account-detail">
                <span class="account-label-text">Email:</span> ${email || "your-email@example.com"}
              </div>
              <div class="account-detail">
                <span class="account-label-text">Role:</span> ${userType.charAt(0).toUpperCase() + userType.slice(1)}
              </div>
            </div>
          </div>

          ${dashboardUrl ? `<a href="${dashboardUrl}" class="cta-button">Go to Dashboard</a>` : ""}

          <div class="next-steps">
            <p class="next-steps-title">Next Steps</p>

            <div class="step">
              <div class="step-number">1</div>
              <p class="step-text">
                <strong>Complete Your Profile:</strong> Add a profile picture and bio to personalize your account
              </p>
            </div>

            <div class="step">
              <div class="step-number">2</div>
              <p class="step-text">
                <strong>Explore Content:</strong> Browse our course catalog and discover what interests you
              </p>
            </div>

            <div class="step">
              <div class="step-number">3</div>
              <p class="step-text">
                <strong>Start Learning:</strong> Enroll in a course and begin your learning journey
              </p>
            </div>

            <div class="step">
              <div class="step-number">4</div>
              <p class="step-text">
                <strong>Connect:</strong> Join our community and interact with instructors and peers
              </p>
            </div>
          </div>

          <div class="support-box">
            <p class="support-title">Need Help?</p>
            <p class="support-text">
              Check out our help center, documentation, or reach out to our support team. We're here to help!
            </p>
          </div>
        </div>

        <div class="footer">
          <p><strong>Welcome to the Community!</strong></p>
          <p>We look forward to seeing you grow and succeed on our platform.</p>
          <p style="margin-top: 12px; color: #999999;">© 2026 Learning Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default welcomeTemplate;
