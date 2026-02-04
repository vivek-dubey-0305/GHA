/**
 * Certificate Email Template
 * Professional certificate notification
 */

const certificateTemplate = (data) => {
  const {
    userName = "Student",
    courseTitle = "Course Name",
    instructorName = "Instructor",
    completionDate = new Date().toLocaleDateString(),
    certificateId = "CERT-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
    certificateUrl,
    score,
    totalLessons,
    certificateImageUrl,
  } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Certificate of Completion - ${courseTitle}</title>
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

        .certificate-content {
          padding: 30px;
          text-align: center;
        }

        .badge {
          display: inline-block;
          width: 80px;
          height: 80px;
          background-color: #000000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          margin-bottom: 20px;
          color: #ffffff;
        }

        .message {
          font-size: 16px;
          color: #666666;
          margin-bottom: 10px;
        }

        .student-name {
          font-size: 24px;
          color: #000000;
          font-weight: bold;
          margin: 15px 0;
          text-decoration: underline;
          text-decoration-style: solid;
          text-underline-offset: 6px;
        }

        .achievement-text {
          font-size: 14px;
          color: #666666;
          margin: 20px 0;
          line-height: 1.6;
        }

        .course-info {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
          border-left: 4px solid #666666;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 10px 0;
          font-size: 13px;
          color: #666666;
        }

        .info-label {
          font-weight: bold;
          color: #000000;
        }

        .info-value {
          color: #333333;
        }

        .stats {
          display: flex;
          justify-content: space-around;
          gap: 12px;
          margin: 25px 0;
          flex-wrap: wrap;
        }

        .stat-box {
          background-color: #000000;
          color: #ffffff;
          padding: 15px;
          border-radius: 6px;
          flex: 1;
          min-width: 100px;
          text-align: center;
        }

        .stat-number {
          font-size: 20px;
          font-weight: bold;
          margin: 0;
        }

        .stat-label {
          font-size: 11px;
          opacity: 0.9;
          margin: 6px 0 0 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .certificate-id {
          font-size: 11px;
          color: #999999;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #e5e5e5;
          font-family: 'Courier New', monospace;
          letter-spacing: 1px;
        }

        .cta-section {
          margin-top: 25px;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
        }

        .cta-button {
          display: inline-block;
          background-color: #000000;
          color: #ffffff;
          padding: 12px 25px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          font-size: 13px;
          margin: 8px 4px;
        }

        .secondary-button {
          display: inline-block;
          background-color: #f5f5f5;
          color: #000000;
          padding: 12px 25px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          font-size: 13px;
          margin: 8px 4px;
          border: 1px solid #cccccc;
        }

        .congratulations {
          font-size: 13px;
          color: #000000;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
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
          <h1>Certificate</h1>
          <p>of Achievement & Completion</p>
        </div>

        <div class="certificate-content">
          <div class="badge">🏆</div>

          <p class="congratulations">Congratulations!</p>

          <p class="message">This is to certify that</p>

          <div class="student-name">${userName}</div>

          <p class="achievement-text">
            has successfully completed and demonstrated mastery of the course
          </p>

          <div class="course-info">
            <div class="info-row">
              <span class="info-label">Course:</span>
              <span class="info-value">${courseTitle}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Instructor:</span>
              <span class="info-value">${instructorName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Completion Date:</span>
              <span class="info-value">${completionDate}</span>
            </div>
          </div>

          <div class="stats">
            <div class="stat-box">
              <p class="stat-number">${score}%</p>
              <p class="stat-label">Final Score</p>
            </div>
            <div class="stat-box">
              <p class="stat-number">${totalLessons}</p>
              <p class="stat-label">Lessons Completed</p>
            </div>
          </div>

          <p style="font-size: 13px; color: #666666; margin: 20px 0; line-height: 1.6;">
            With the successful completion of all required modules, assessments, and projects,
            this certificate is awarded as recognition of professional achievement and commitment to excellence.
          </p>

          <div class="certificate-id">
            Certificate ID: ${certificateId}
          </div>

          <div class="cta-section">
            ${certificateUrl ? `
              <a href="${certificateUrl}" class="cta-button">Download Certificate</a>
              <a href="${certificateUrl}" class="secondary-button">View Full Certificate</a>
            ` : ""}
          </div>
        </div>

        <div class="footer">
          <p><strong>Share Your Achievement!</strong></p>
          <p>Add this certificate to your LinkedIn profile, resume, or portfolio.</p>
          <p style="margin-top: 12px; color: #999999;">© 2026 Learning Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default certificateTemplate;