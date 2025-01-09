import { createTransport } from "nodemailer";
import AnsiToHtml from 'ansi-to-html';

const ansiToHtml = new AnsiToHtml();

class EmailReporter {
  constructor(options) {
    this.options = options;
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      flaky: 0,
      skipped: 0,
      failedTests: [],
      startTime: null,
      endTime: null
    };
    this.mailOnSuccess = options.mailOnSuccess || false; // Default to false
  }

  onBegin(config) {
    this.results.startTime = new Date();
  }

  onTestEnd(test, result) {
    this.results.total++;
    if (result.status === "passed") this.results.passed++;
    if (result.status === "failed") {
      this.results.failed++;
      const specFileName = test.location.file.split('/').pop();
      const describePart = test.parent.title ? ` > ${test.parent.title}` : "";
      this.results.failedTests.push({
        name: `${specFileName}${describePart} > ${test.title}`,
        status: result.status,
        duration: result.duration,
        error: ansiToHtml.toHtml(result.error?.message || "No error message"),
      });
    }
    if (result.status === "flaky") this.results.flaky++;
    if (result.status === "skipped") this.results.skipped++;
  }

  async onEnd() {
    this.results.endTime = new Date();
    const duration = (this.results.endTime - this.results.startTime) / 1000;

    // Send email if mailOnSuccess is true or if there are failed tests
    if (this.mailOnSuccess || this.results.failed > 0) {
      const htmlContent = this.generateHtmlReport(duration);
      await this.sendEmail(htmlContent);
    }
  }

  generateHtmlReport(duration) {
    const { total, passed, failed, flaky, skipped, failedTests } = this.results;

    const failedTestsRows = failedTests
      .map(
        (test) => `
          <tr>
            <td style="background-color: #1a1a2e; color: #f8f9fa;">${test.name}</td>
            <td style="background-color: #1a1a2e; color: #f8f9fa;">${test.status}</td>
            <td style="background-color: #1a1a2e; color: #f8f9fa;">${test.duration} ms</td>
            <td style="background-color: #1a1a2e; color: #f8f9fa;">${test.error}</td>
          </tr>
        `
      )
      .join("");

    return `
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          h3 {
            color: #343a40;
          }
          h3 a {
            text-decoration: none;
            color: #0056b3;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 20px;
          }
          thead tr {
            background-color: #f8f9fa;
            text-align: left;
            border-bottom: 2px solid #dee2e6;
          }
          th, td {
            padding: 10px;
            border: 1px solid #dee2e6;
          }
          tbody td {
            text-align: left;
          }
          td.passed {
            color: #28a745;
          }
          td.failed {
            color: #dc3545;
          }
          td.flaky {
            color: #ffc107;
          }
          h2 {
            color: #343a40;
            margin-top: 20px;
          }
          .no-failed-tests {
            text-align: center;
          }
        </style>
      </head>
      <body>
        <h3>The full report can be found at <a href="${this.options.link}">${this.options.link}</a>.</h3>

        <table border="1" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th>Total Tests</th>
              <th>Passed</th>
              <th>Failed</th>
              <th>Flaky</th>
              <th>Skipped</th>
              <th>Duration (seconds)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${total}</td>
              <td class="passed">${passed}</td>
              <td class="failed">${failed}</td>
              <td class="flaky">${flaky}</td>
              <td>${skipped}</td>
              <td>${duration}</td>
            </tr>
          </tbody>
        </table>

        <h2>Failed Tests</h2>
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th>Test</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Error Message</th>
            </tr>
          </thead>
          <tbody>
            ${failedTestsRows || "<tr><td colspan='4' class='no-failed-tests'>No failed tests</td></tr>"}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }

  async sendEmail(htmlContent) {
    const transporter = createTransport({
      host: this.options.smtpHost,
      port: this.options.smtpPort,
      secure: this.options.smtpSecure,
      auth: {
        user: this.options.smtpUser,
        pass: this.options.smtpPass,
      },
    });

    await transporter.sendMail({
      from: this.options.from,
      to: this.options.to,
      subject: "Playwright Test Report",
      html: htmlContent,
    });

    console.log("Email sent successfully.");
  }
}

export default EmailReporter;
