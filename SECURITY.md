# Security Policy

## Supported Versions

The following versions of HoYo Code Sender Discord Bot are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of HoYo Code Sender Discord Bot seriously. If you believe you've found a security vulnerability, please follow these steps:

### How to Report

**DO NOT create a public GitHub issue** for security vulnerabilities.

Instead, please report security vulnerabilities through one of these channels:

1. **Email**: Send details to [mail@chiraitori.io.vn](mailto:mail@chiraitori.io.vn) with the subject "Security Vulnerability Report"

2. **Discord**: Contact the bot owner privately through our [Discord support server](https://dsc.gg/chiraitori-support)

### What to Include

When reporting a security issue, please include:

- A clear description of the vulnerability
- Steps to reproduce the issue
- Potential impact of the vulnerability
- Any possible mitigations you've identified
- Your name/handle for credit (optional)

### What to Expect

After you report a security vulnerability:

1. **Acknowledgment**: We aim to acknowledge receipt of your report within 48 hours
2. **Assessment**: We'll investigate the issue and determine its impact and severity
3. **Resolution Plan**: We'll develop a fix for the vulnerability
4. **Disclosure**: Once a fix is ready, we'll coordinate disclosure with you

We're committed to responding quickly to security reports and keeping you informed throughout the process.

## Security Best Practices for Bot Users

### Server Administrators

1. **Permission Management**: Only grant the bot the minimum permissions it needs
2. **Channel Restrictions**: Restrict the bot to specific channels where it needs to operate
3. **Regular Audits**: Periodically review which bots have access to your server and their permissions

### Self-Hosting Users

If you're self-hosting this bot:

1. **Keep Updated**: Always use the latest version with security patches
2. **Environment Security**:
   - Use secure environment variables for tokens and sensitive data
   - Never commit .env files to public repositories
   - Ensure your hosting environment has proper firewalls and security measures
3. **Dependency Management**: Regularly update dependencies to patch known vulnerabilities
4. **Limited Access**: Restrict database access to only what's necessary

## Security Features

The HoYo Code Sender Discord Bot includes the following security features:

- Input validation to prevent injection attacks
- Rate limiting to prevent abuse
- Proper handling of Discord permissions
- Secure storage of configuration data

## Disclosure Policy

- Security vulnerabilities will be addressed as quickly as possible
- Fixed vulnerabilities will be disclosed after patches are available
- Credit will be given to reporters who wish to be identified
- Updates about vulnerabilities will be announced in our Discord server

## Thank You

We appreciate the community's help in keeping HoYo Code Sender Discord Bot secure. Responsible disclosure of vulnerabilities helps protect all our users.
