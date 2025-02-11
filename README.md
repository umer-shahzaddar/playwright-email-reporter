# playwright-email-reporter

`playwright-email-reporter` is a custom Playwright reporter that generates an HTML test report and sends it via email. The report includes a summary of test results and detailed information about failed tests.

## Features

- Generates a summary table with total tests, passed, failed, flaky, skipped, and duration.
- Includes a detailed table for failed tests.
- Sends the report via email to the specified recipient(s).

## Installation

Install the package using npm:

```bash
npm install playwright-email-reporter
```

## Usage

### Configure the Reporter

In your Playwright configuration file (`playwright.config.js`), add the reporter:

```javascript
module.exports = {
  reporter: [
    ['playwright-email-reporter', {
      reportName: process.env.REPORT_NAME,
      link: process.env.LINK,
      reportDesc: process.env.REPORT_DESC,
      smtpHost: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT,
      smtpSecure: process.env.SMTP_SECURE,
      smtpUser: process.env.SMTP_USER,
      smtpPass: process.env.SMTP_PSW,
      from: process.env.FROM,
      to: process.env.TO,
      mailOnSuccess: process.env.MAIL_ON_SUCCESS
    }],
  ],
};
```

| Option | Description | Required | Default |
| --- | --- | --- | --- |
| `reportName` | Name of the test report | `false` | `Playwright Test Report` |
| `link` | Link to the external test report | `false` | `undefined` |
| `reportDesc` | Description of the test report | `false` | `undefined` |
| `smtpHost` | SMTP server host | `true` | `undefined` |
| `smtpPort` | SMTP server port | `true` | `undefined` |
| `smtpSecure` | Use secure connection (true/false) | `true` | `undefined` |
| `smtpUser` | SMTP username | `true` | `undefined` |
| `smtpPass` | SMTP password | `true` | `undefined` |
| `from` | Sender email address | `true` | `undefined` |
| `to` | Recipient email addresses (comma-separated) | `true` | `undefined` |
| `mailOnSuccess` | Send email on successful test execution (true/false) | `false` | `false` |

## Report Structure

### Summary Table

| Total Tests | Passed | Failed | Flaky | Skipped | Duration |
|-------------|--------|--------|-------|---------|----------|
|     X       |    X   |    X   |   X   |    X    |     X    |

### Failed Tests Table

| Test                      | Project | Duration | Error Message       |
|---------------------------|---------|----------|---------------------|
| `name < describe < file`  |     X   |   X      | Error message here  |

### Notes for Gmail Users
- Use an **App Password** instead of your main Gmail password.
- [Google Account App Passwords Guide](https://support.google.com/accounts/answer/185833).

## Contributing

Contributions are welcome! Please open an issue or submit a pull request with improvements.

## License

This project is licensed under the MIT License.

## Repository

[GitHub Repository](https://github.com/your-username/playwright-email-reporter)

