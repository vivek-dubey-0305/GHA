/**
 * Assignment Email Template
 * Professional assignment notifications
 */

const assignmentTemplate = (data) => {
  const {
    userName = "Student",
    assignmentTitle = "Assignment",
    courseTitle = "Course",
    status = "submitted", // submitted, scored, overdue, passed, failed, resubmit
    dueDate,
    submittedDate,
    score,
    totalMarks,
    percentage,
    feedback,
    actionUrl,
    instruction,
  } = data;

  // Status message mapping
  const statusConfig = {
    submitted: {
      message: "Successfully Submitted",
    },
    scored: {
      message: "Grade Released",
    },
    overdue: {
      message: "Submission Overdue",
    },
    passed: {
      message: "Assignment Passed",
    },
    failed: {
      message: "Action Required",
    },
    resubmit: {
      message: "Resubmission Available",
    },
  };

  const config = statusConfig[status] || statusConfig.submitted;

  const getStatusContent = () => {
    switch (status) {
      case "submitted":
        return `
          <p style="font-size: 16px; color: #666666; margin: 15px 0; line-height: 1.6;">
            Your assignment <strong>"${assignmentTitle}"</strong> for <strong>"${courseTitle}"</strong>
            has been successfully submitted.
          </p>
          <div style="background-color: #f9f9f9; border-left: 4px solid #666666; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 8px 0; color: #333333; font-size: 14px;">
              <strong>Submission ID:</strong> ${Math.random().toString(36).substr(2, 9).toUpperCase()}
            </p>
            <p style="margin: 8px 0; color: #333333; font-size: 14px;">
              <strong>Submitted on:</strong> ${submittedDate || new Date().toLocaleDateString()}
            </p>
            <p style="margin: 8px 0; color: #333333; font-size: 14px;">
              <strong>Due Date:</strong> ${dueDate || "N/A"}
            </p>
          </div>
        `;

      case "scored":
        const scorePercentage = percentage || (score / totalMarks) * 100;
        const scoreGrade = scorePercentage >= 80 ? "A" : scorePercentage >= 60 ? "B" : scorePercentage >= 40 ? "C" : "F";
        return `
          <p style="font-size: 16px; color: #666666; margin: 15px 0; line-height: 1.6;">
            Your grade for <strong>"${assignmentTitle}"</strong> is now available. Review your score and feedback below.
          </p>
          <div style="background-color: #000000; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; color: #ffffff;">
            <p style="font-size: 14px; margin: 0; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Your Score</p>
            <div style="font-size: 36px; font-weight: bold; margin: 10px 0; display: flex; align-items: center; justify-content: center; gap: 12px;">
              ${score}/${totalMarks}
              <span style="font-size: 24px; background-color: rgba(255, 255, 255, 0.2); padding: 6px 12px; border-radius: 6px; font-weight: bold;">
                ${scoreGrade}
              </span>
            </div>
            <p style="font-size: 14px; margin: 8px 0; opacity: 0.95;">
              ${scorePercentage.toFixed(1)}% Correct
            </p>
          </div>
          ${feedback ? `<div style="background-color: #f9f9f9; border-left: 4px solid #666666; padding: 15px; margin: 15px 0; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; color: #000000; font-weight: bold; font-size: 14px;">Instructor Feedback:</p>
            <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.6;">${feedback}</p>
          </div>` : ""}
        `;

      case "overdue":
        return `
          <p style="font-size: 16px; color: #333333; margin: 15px 0; line-height: 1.6;">
            The due date for <strong>"${assignmentTitle}"</strong> has passed.
          </p>
          <div style="background-color: #f9f9f9; border-left: 4px solid #666666; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 8px 0; color: #333333; font-size: 14px;">
              <strong>Assignment:</strong> ${assignmentTitle}
            </p>
            <p style="margin: 8px 0; color: #333333; font-size: 14px;">
              <strong>Due Date:</strong> ${dueDate}
            </p>
            <p style="margin: 8px 0; color: #333333; font-size: 14px; font-style: italic;">
              Please contact your instructor for late submission policy.
            </p>
          </div>
        `;

      case "passed":
        return `
          <p style="font-size: 16px; color: #333333; margin: 15px 0; line-height: 1.6;">
            Congratulations! You have successfully passed <strong>"${assignmentTitle}"</strong>.
          </p>
          <div style="background-color: #000000; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; color: #ffffff;">
            <p style="font-size: 20px; margin: 0; font-weight: bold;">PASSED</p>
            <p style="font-size: 14px; margin: 8px 0; opacity: 0.95;">Score: ${score}/${totalMarks} (${percentage || (score / totalMarks) * 100}%)</p>
          </div>
        `;

      case "failed":
        return `
          <p style="font-size: 16px; color: #333333; margin: 15px 0; line-height: 1.6;">
            Your score for <strong>"${assignmentTitle}"</strong> is below the passing threshold.
          </p>
          <div style="background-color: #f9f9f9; border-left: 4px solid #666666; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="font-size: 20px; margin: 0; font-weight: bold; color: #000000;">NEEDS IMPROVEMENT</p>
            <p style="font-size: 14px; margin: 8px 0; color: #333333;">Score: ${score}/${totalMarks} (${percentage || (score / totalMarks) * 100}%)</p>
            <p style="font-size: 13px; margin: 12px 0; color: #666666;">You can resubmit this assignment. Contact your instructor for more details.</p>
          </div>
          ${feedback ? `<div style="background-color: #f9f9f9; border-left: 4px solid #666666; padding: 15px; margin: 15px 0; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; color: #000000; font-weight: bold; font-size: 14px;">Feedback for Improvement:</p>
            <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.6;">${feedback}</p>
          </div>` : ""}
        `;

      case "resubmit":
        return `
          <p style="font-size: 16px; color: #333333; margin: 15px 0; line-height: 1.6;">
            You are now eligible to resubmit <strong>"${assignmentTitle}"</strong>.
          </p>
          <div style="background-color: #f9f9f9; border-left: 4px solid #666666; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 8px 0; color: #333333; font-size: 14px;">
              <strong>Original Score:</strong> ${score}/${totalMarks}
            </p>
            <p style="margin: 8px 0; color: #333333; font-size: 14px;">
              <strong>Resubmission Deadline:</strong> ${dueDate || "Check course page"}
            </p>
          </div>
        `;

      default:
        return "";
    }
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Assignment Update - ${assignmentTitle}</title>
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

        .status-badge {
          display: inline-block;
          background-color: #f9f9f9;
          color: #000000;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: bold;
          margin-top: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .content {
          padding: 25px;
        }

        .content p {
          margin: 0;
          color: #666666;
        }

        .cta-button {
          display: inline-block;
          background-color: #000000;
          color: #ffffff;
          padding: 10px 25px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin-top: 18px;
          font-size: 13px;
        }

        .footer {
          background-color: #f5f5f5;
          padding: 18px;
          text-align: center;
          color: #666666;
          font-size: 12px;
          border-top: 1px solid #e5e5e5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${config.message}</h1>
          <div class="status-badge">${status}</div>
        </div>

        <div class="content">
          ${getStatusContent()}
          ${actionUrl ? `<a href="${actionUrl}" class="cta-button">View Assignment</a>` : ""}
          ${instruction ? `<p style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e5e5; font-size: 13px; color: #666666; line-height: 1.6;">${instruction}</p>` : ""}
        </div>

        <div class="footer">
          <p style="margin: 0;">If you have any questions, please contact your instructor.</p>
          <p style="margin: 4px 0 0 0;">© 2026 Learning Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default assignmentTemplate;
