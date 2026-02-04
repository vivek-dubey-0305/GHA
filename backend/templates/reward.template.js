/**
 * Reward & Achievement Email Template
 * Professional celebration of user milestones and achievements
 */

const rewardTemplate = (data) => {
  const {
    userName = "Student",
    rewardType = "milestone", // milestone, achievement, badge, completion
    title = "Achievement Unlocked",
    description = "Great job!",
    points = 0,
    badge,
    nextMilestone,
    courseTitle,
    actionUrl,
  } = data;

  const rewardTypeConfig = {
    milestone: {
      icon: "🎯",
      label: "Milestone Reached",
    },
    achievement: {
      icon: "🏅",
      label: "Achievement Unlocked",
    },
    badge: {
      icon: "🎖️",
      label: "Badge Earned",
    },
    completion: {
      icon: "🎉",
      label: "Course Completed",
    },
  };

  const config = rewardTypeConfig[rewardType] || rewardTypeConfig.milestone;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Achievement Unlocked - ${title}</title>
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

        .achievement-icon {
          font-size: 32px;
          margin-bottom: 10px;
        }

        .content {
          padding: 25px;
        }

        .greeting {
          font-size: 16px;
          color: #000000;
          margin: 0 0 15px 0;
          font-weight: bold;
        }

        .message {
          font-size: 14px;
          color: #666666;
          margin: 15px 0;
          line-height: 1.6;
        }

        .achievement-box {
          background-color: #f9f9f9;
          border: 2px solid #cccccc;
          padding: 25px;
          border-radius: 8px;
          margin: 25px 0;
          text-align: center;
        }

        .achievement-badge {
          width: 80px;
          height: 80px;
          background-color: #000000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          margin: 0 auto 15px;
          color: #ffffff;
        }

        .achievement-title {
          color: #000000;
          font-size: 20px;
          font-weight: bold;
          margin: 0 0 8px 0;
        }

        .achievement-description {
          color: #333333;
          font-size: 14px;
          margin: 8px 0 0 0;
          font-weight: normal;
        }

        .achievement-type {
          display: inline-block;
          background-color: #e5e5e5;
          color: #000000;
          padding: 6px 12px;
          border-radius: 15px;
          font-size: 11px;
          font-weight: bold;
          margin-top: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .points-display {
          background-color: #f5f5f5;
          border: 1px solid #cccccc;
          padding: 20px;
          border-radius: 6px;
          text-align: center;
          margin: 20px 0;
        }

        .points-label {
          color: #000000;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 8px 0;
        }

        .points-value {
          color: #000000;
          font-size: 28px;
          font-weight: bold;
          margin: 0;
        }

        .course-info {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          border-left: 4px solid #666666;
        }

        .course-info-title {
          color: #000000;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 6px 0;
        }

        .course-name {
          color: #333333;
          font-size: 14px;
          font-weight: bold;
          margin: 0;
        }

        .next-milestone {
          background-color: #f5f5f5;
          border-left: 4px solid #666666;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }

        .next-milestone-title {
          color: #000000;
          font-weight: bold;
          font-size: 12px;
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .next-milestone-text {
          color: #333333;
          font-size: 13px;
          margin: 0;
          line-height: 1.5;
        }

        .share-section {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
          text-align: center;
          border: 1px solid #e5e5e5;
        }

        .share-title {
          color: #000000;
          font-weight: bold;
          font-size: 14px;
          margin: 0 0 10px 0;
        }

        .share-text {
          color: #666666;
          font-size: 13px;
          margin: 0;
          line-height: 1.5;
        }

        .cta-button {
          display: inline-block;
          background-color: #000000;
          color: #ffffff;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin-top: 20px;
          font-size: 14px;
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
          <div class="achievement-icon">${config.icon}</div>
          <h1>Achievement Unlocked</h1>
          <p>Congratulations on your success</p>
        </div>

        <div class="content">
          <p class="greeting">Congratulations, ${userName}!</p>

          <p class="message">
            Your dedication and hard work have paid off. You've reached an important milestone in your learning journey.
            Keep up the excellent progress!
          </p>

          <div class="achievement-box">
            <div class="achievement-badge">${config.icon}</div>
            <h2 class="achievement-title">${title}</h2>
            <p class="achievement-description">${description}</p>
            <div class="achievement-type">${config.label}</div>
          </div>

          ${points > 0 ? `
            <div class="points-display">
              <p class="points-label">Points Earned</p>
              <p class="points-value">+${points} XP</p>
            </div>
          ` : ""}

          ${courseTitle ? `
            <div class="course-info">
              <p class="course-info-title">Course</p>
              <p class="course-name">${courseTitle}</p>
            </div>
          ` : ""}

          ${nextMilestone ? `
            <div class="next-milestone">
              <p class="next-milestone-title">Next Milestone</p>
              <p class="next-milestone-text">
                ${nextMilestone}
              </p>
            </div>
          ` : ""}

          <div class="share-section">
            <p class="share-title">Share Your Achievement</p>
            <p class="share-text">
              Feel free to share this milestone with your friends and family. Your success can inspire others to learn!
            </p>
          </div>

          ${actionUrl ? `<a href="${actionUrl}" class="cta-button">View Achievement</a>` : ""}
        </div>

        <div class="footer">
          <p><strong>Keep Learning!</strong></p>
          <p>Every achievement brings you closer to mastery. Continue your learning journey!</p>
          <p style="margin-top: 12px; color: #999999;">© 2026 Learning Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default rewardTemplate;
