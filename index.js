import { createTransport } from "nodemailer";

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
        error: result.error?.message || "No error message",
      });
    }
    if (result.status === "flaky") this.results.flaky++;
    if (result.status === "skipped") this.results.skipped++;
  }

  async onEnd() {
    this.results.endTime = new Date();
    const duration = (this.results.endTime - this.results.startTime) / 1000;

    const htmlContent = this.generateHtmlReport(duration);
    await this.sendEmail(htmlContent);
  }

  generateHtmlReport(duration) {
    const { total, passed, failed, flaky, skipped, failedTests } = this.results;

    const failedTestsRows = failedTests
      .map(
        (test) => `
          <tr>
            <td>${test.name}</td>
            <td>${test.status}</td>
            <td>${test.duration} ms</td>
            <td>${test.error}</td>
          </tr>
        `
      )
      .join("");

    return `
      <html>
      <body>
        <p>The full report can be found at <a href="${this.options.link}">${this.options.link}</a>.</p>

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
              <td>${passed}</td>
              <td>${failed}</td>
              <td>${flaky}</td>
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
            ${failedTestsRows || "<tr><td colspan='4'>No failed tests</td></tr>"}
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
