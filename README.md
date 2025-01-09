# playwright-email-reporter

`playwright-email-reporter` is a custom Playwright reporter that generates an HTML test report and sends it via email. The report includes a summary of test results and detailed information about failed tests.

## Features

- Generates a summary table with total tests, passed, failed, flaky, skipped, and duration.
- Includes a detailed table for failed tests with the format:
  - `file > describe > name` or `file > name` if no describe exists.
  - Test status, duration, and error message.
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
      link: 'https://example.com/full-report',
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: 'your-email@example.com',
      smtpPass: 'your-email-password',
      from: 'your-email@example.com',
      to: 'recipient@example.com',
      mailOnSuccess: true
    }],
  ],
};
```

### Running the Tests

Run your Playwright tests as usual:

```bash
npx playwright test
```

After the tests complete, the reporter will generate the HTML report and send it via email to the specified recipient.

## Report Structure

### Summary Table

| Total Tests | Passed | Failed | Flaky | Skipped | Duration (seconds) |
|-------------|--------|--------|-------|---------|--------------------|
|     X       |    X   |    X   |   X   |    X    |         X          |

### Failed Tests Table

| Test                      | Status | Duration | Error Message       |
|---------------------------|--------|----------|---------------------|
| `file > describe > name`  | Failed |   X ms   | Error message here  |

## SMTP Configuration

Ensure the SMTP configuration matches your email provider. For example, for Gmail:

```javascript
smtpHost: 'smtp.gmail.com',
smtpPort: 587,
smtpSecure: false,
smtpUser: 'your-email@gmail.com',
smtpPass: 'your-app-password',
```

### Notes for Gmail Users
- Use an **App Password** instead of your main Gmail password.
- [Google Account App Passwords Guide](https://support.google.com/accounts/answer/185833).

## Debugging

Enable debugging in the `nodemailer` transport configuration to troubleshoot issues:

```javascript
const transporter = nodemailer.createTransport({
  host: this.options.smtpHost,
  port: this.options.smtpPort,
  secure: this.options.smtpSecure,
  auth: {
    user: this.options.smtpUser,
    pass: this.options.smtpPass,
  },
  debug: true,
  logger: true,
});
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request with improvements.

## License

This project is licensed under the MIT License.

## Repository

[GitHub Repository](https://github.com/your-username/playwright-email-reporter)

