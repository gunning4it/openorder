# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in OpenOrder, please report it responsibly by emailing: **security@openorder.com**

**Do not** open public GitHub issues for security vulnerabilities. This ensures that potential security issues can be addressed before they are publicly disclosed.

## Response Timeline

We take security seriously and will respond to valid security reports as follows:

- **Acknowledgment:** Within 48 hours of report submission
- **Initial Triage:** Within 7 days we will provide an initial assessment
- **Fix & Disclosure:** Coordinated disclosure within 90 days, depending on severity and complexity

## Scope

### In Scope

The following vulnerability types are within scope for security reports:

- Authentication and authorization bypass
- SQL injection vulnerabilities
- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- Server-Side Request Forgery (SSRF)
- Payment processing security flaws
- POS integration security issues
- Webhook signature verification bypass
- Sensitive data exposure
- Session management vulnerabilities
- Remote code execution
- Privilege escalation
- API security issues
- Cryptographic weaknesses

### Out of Scope

The following are generally out of scope:

- Social engineering attacks
- Physical attacks on infrastructure
- Denial of Service (DoS) attacks on public demo instances
- Issues in third-party dependencies (please report directly to the maintainers)
- Attacks requiring physical access to a user's device
- Theoretical vulnerabilities without proof of concept
- Issues in outdated versions (please test against the latest release)

## Supported Versions

Security updates are provided for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < 1.0   | :x:                |

We recommend always running the latest version of OpenOrder to benefit from security patches.

## Security Best Practices for Self-Hosters

If you're self-hosting OpenOrder, please follow these security best practices:

1. **Environment Variables:** Never commit `.env` files to version control. Use strong, unique values for `APP_SECRET` and `DB_PASSWORD`.

2. **Database Security:**
   - Use strong database passwords
   - Restrict database access to the API server only
   - Enable SSL/TLS for database connections in production

3. **HTTPS:** Always use HTTPS in production. Configure SSL/TLS certificates for your domain.

4. **Webhook Secrets:** Ensure webhook signature verification is enabled for all POS and payment integrations.

5. **Regular Updates:** Keep OpenOrder and all dependencies up to date with the latest security patches.

6. **Backup Strategy:** Implement regular encrypted backups of your database.

7. **Access Control:** Implement proper network firewalls and restrict access to internal services (PostgreSQL, Redis).

8. **Monitoring:** Set up logging and monitoring to detect suspicious activity.

## Security Features

OpenOrder includes the following security features:

- **Password Hashing:** Argon2id (industry-standard, resistant to GPU attacks)
- **JWT Authentication:** Short-lived access tokens (15 minutes) with refresh tokens
- **Rate Limiting:** Redis-backed rate limiting on all public endpoints
- **CORS Protection:** Configurable CORS policies
- **Webhook Verification:** HMAC-SHA256 signature verification for all webhooks
- **Encryption at Rest:** POS and payment adapter configs encrypted with AES-256-GCM
- **SQL Injection Protection:** Parameterized queries via Prisma ORM
- **XSS Protection:** Content Security Policy headers and input sanitization

## Security Disclosure Process

1. **Private Disclosure:** Report vulnerability via email
2. **Acknowledgment:** We confirm receipt and begin investigation
3. **Validation:** We reproduce and validate the vulnerability
4. **Fix Development:** We develop and test a patch
5. **Coordinated Disclosure:** We coordinate a public disclosure timeline with you
6. **Credit:** We credit you in the security advisory (unless you prefer to remain anonymous)
7. **Release:** We release the patch and publish a security advisory

## Contact

For security-related inquiries, please contact: **security@openorder.com**

For non-security issues, please use GitHub Issues: https://github.com/openorder/openorder/issues

## Attribution

We appreciate the work of security researchers who help keep OpenOrder secure. Researchers who responsibly disclose valid vulnerabilities will be acknowledged in our security advisories (if desired).

---

**License:** This project is licensed under AGPL-3.0. Any modifications to hosted services must be open-sourced.
