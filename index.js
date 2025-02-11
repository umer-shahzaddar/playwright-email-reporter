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
    this.reportLink = options.reportLink || null;
    this.mailOnSuccess = options.mailOnSuccess || false; // Default to false
    this.reportName = options.reportName || 'Playwright Test Report';
    this.reportDesc = options.reportDesc || '';
    this.processedTests = new Set(); // To track unique tests
  }

  onBegin(config, suite) {
    this.results.startTime = new Date();
    this.suite = suite;
  }

  onStdOut(chunk) {
    const text = chunk.toString("utf-8");
    process.stdout.write(text);
  }

  onStdErr(chunk) {
    const text = chunk.toString("utf-8");
    process.stderr.write(text);
  }

  async onEnd() {
    this.suite.allTests().forEach((test) => {
      this.results.total++;

      const results = test.results;
      const lastResult = results.at(-1);

      if (lastResult.status === "passed" && lastResult.retry > 0) {
        this.results.flaky++;
      } else if (lastResult.status === "passed") {
        this.results.passed++;
      } else if (lastResult.status === "skipped") {
        this.results.skipped++;
      } else {
        this.results.failed++;
        const specFileName = test.location.file.split('/').pop();
        const describePart = test.parent.title;
        this.results.failedTests.push({
          name: `${test.title} < ${describePart} < ${specFileName}`,
          status: lastResult.status,
          duration: lastResult.duration,
          error: ansiToHtml.toHtml(lastResult.error?.message || "No error message"),
          project: (test.titlePath().join(' ')).split(' ')[1] || 'unknown'
        });
      }
    });

    this.results.endTime = new Date();
    const durationInMs = this.results.endTime - this.results.startTime;
    let duration = this.formatDuration(durationInMs);

    // Send email if mailOnSuccess is true or if there are failed tests
    if (this.mailOnSuccess || this.results.failed > 0) {
      const htmlContent = this.generateHtmlReport(duration);
      await this.sendEmail(htmlContent);
    }

  }

  formatDuration(durationInMs) {
    const hours = Math.floor(durationInMs / 3600000);
    const minutes = Math.floor((durationInMs % 3600000) / 60000);
    const seconds = Math.floor((durationInMs % 60000) / 1000);

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    return parts.length > 0 ? parts.join(' ') : `${durationInMs} ms`;
  }

  generateHtmlReport(duration) {
    const { total, passed, failed, flaky, skipped, failedTests } = this.results;

    let reportLink = '';
    if (this.reportLink) {
      reportLink = `The full report can be found at <a href="${this.reportLink}">${this.reportLink}</a>.`
    }

    const failedTestsRows = failedTests
      .map(
        (test) => `
          <tr>
            <td style="background-color: #1a1a2e; color: #f8f9fa;">${test.name}</td>
            <td style="background-color: #1a1a2e; color: #f8f9fa;">${test.project}</td>
            <td style="background-color: #1a1a2e; color: #f8f9fa;">${this.formatDuration(test.duration)}</td>
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
          h1 {
            color: #343a40;
          }
          h4 {
            color: #343a40;
          }
        </style>
      </head>
      <body>
        <h1>${this.reportName}</h1>
        <h4>${this.reportDesc}</h4>
        <h3>${reportLink}</h3>

        <table border="1" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th>Total Tests</th>
              <th>Passed ✅</th>
              <th>Failed ❌</th>
              <th>Flaky ⚠️</th>
              <th>Skipped</th>
              <th>Duration</th>
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
              <th>Project</th>
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
      subject: this.reportName,
      html: htmlContent,
    });

    console.log("Email sent successfully.");
  }
}

export default EmailReporter;
