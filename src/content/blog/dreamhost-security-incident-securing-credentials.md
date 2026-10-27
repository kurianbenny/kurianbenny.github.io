---
title: "DreamHost Security Incident: How to Secure Compromised Email, FTP, and SFTP Accounts"
description: "Web hosting provider DreamHost has forced widespread password resets for email and FTP/SFTP accounts following an ongoing security incident. Here is what site owners must audit and secure."
date: 2026-10-26
category: "Hosting & DevOps"
draft: false
image: "/images/blog/dreamhost-security-incident-securing-credentials.webp"
imageAlt: "Tactile 3D editorial illustration of a midnight navy web hosting server connected to an envelope mailbox module, replacing an old mechanical key with a glowing amber cryptographic key under a protective shield."
---

Beginning on October 23, 2026, web hosting provider and domain registrar **DreamHost** initiated emergency security protocols across its infrastructure, forcing widespread password expirations and account lockouts for thousands of customer email, FTP, and SFTP accounts.

The disruption began as an internal technical connectivity failure impacting DreamHost's browser-based **File Manager** interface, before rapidly escalating into forced webmail session logouts and mandatory credential resets. Crucially, DreamHost sent urgent notices advising customers not only to set new passwords but also to inspect every mailbox for **unrecognized email forwarding rules**—a telltale indicator that unauthorized third parties may have accessed underlying hosting systems.

If your business, agency, or clients host websites, WordPress blogs, or mailboxes on DreamHost—or any shared hosting provider—you must take immediate defensive steps to verify filesystem integrity, purge rogue mail forwarding rules, and rotate all connected credentials.

---

## The Incident Timeline: From File Manager Glitch to Mass Resets

The timeline of the incident reflects how what initially appeared to be a web interface disruption transitioned into an active security response:

### 1. File Manager Availability Disruption (October 23)
DreamHost first reported connectivity problems affecting the web-based File Manager tool in its customer control panel. Site owners attempting to upload, edit, or manage web assets through the browser experienced repeated connection drops and authentication errors.

### 2. Forced Webmail Logouts and Password Resets (October 24–25)
Over the weekend, DreamHost escalated its response by invalidating existing sessions across webmail and FTP services. Customers discovered their email clients (Apple Mail, Thunderbird, Outlook) and FTP deployment clients (FileZilla, Cyberduck, VS Code SFTP extensions) failing to authenticate. Passwords could only be restored by logging into the primary DreamHost Web Panel and generating new credentials.

### 3. The Warning: Audit Your Email Forwarding Rules
In direct communications to affected customers, DreamHost included an explicit advisory:
> *"We recommend that you review your email accounts in the DreamHost panel and confirm that no unauthorized email forwarding addresses have been created."*

When hosting providers advise checking for forwarding rules, it strongly implies that threat actors gained sufficient access to view mailbox configuration tables or manipulate mail routing rules, potentially aiming to intercept password resets and sensitive business communications.

---

## Understanding the Risk: Silent Forwarding and Shared Hosting Exposure

When an attacker gains unauthorized access to a hosting provider's file management or mailbox infrastructure, the potential blast radius extends far beyond a simple defacement:

### 1. Silent Email Forwarding for Account Takeover
Attackers rarely change mailbox passwords immediately, as doing so alerts the legitimate owner. Instead, they configure automated forwarding rules that quietly duplicate every incoming email to an external inbox controlled by the adversary. 
- The attacker then initiates password resets across high-value third-party services: payment gateways (Stripe, PayPal), cloud accounts (AWS, Cloudflare), domain registrars, and social media platforms.
- The reset tokens arrive in the victim's inbox, get automatically forwarded to the attacker, and allow silent account takeover before the owner realizes anything has occurred.

### 2. Web Root Manipulation via File Manager / SFTP
The browser-based File Manager tool and SFTP accounts provide read and write access to your web root directory (commonly `public_html`). An adversary with compromised file management access can:
- Read `wp-config.php`, `.env`, or database configuration files to extract database passwords, application secret keys, and API tokens.
- Inject malicious PHP backdoors, web shells, or redirect scripts into existing core files (like `index.php` or `header.php`).
- Create unauthorized administrative users directly inside database management tools like phpMyAdmin.

---

## Step-by-Step Action Plan for DreamHost and Hosting Customers

If your web applications or company email run on DreamHost or similar managed hosting platforms, follow this checklist to secure your accounts and verify system integrity.

### 1. Reset Master and Sub-Account Credentials

1. Log in to the primary [DreamHost Web Panel](https://panel.dreamhost.com/).
2. Change your primary account password immediately, using a unique, high-entropy passphrase (minimum 20 characters).
3. If not already active, enable **Two-Factor Authentication (2FA)** under **Profile** > **Security** using an authenticator app (such as Google Authenticator, 1Password, or YubiKey).

### 2. Audit and Purge Unrecognized Email Forwarding Rules

This is the most critical immediate step to prevent ongoing data leaks:

1. In the DreamHost Web Panel, navigate to **Mail** > **Custom MX** / **Mailboxes**.
2. Click on each configured email address and inspect the **Forward To** settings.
3. If you see any external email address that you or your team did not deliberately configure, remove it immediately and save changes.
4. Also log into DreamHost Webmail (Roundcube) for each mailbox, go to **Settings** > **Filters**, and verify that no server-side filter exists that forwards or deletes incoming messages matching keywords like `password`, `reset`, `verification`, or `invoice`.

### 3. Audit FTP and SFTP Users

1. In the Web Panel, go to **Websites** > **Users** (or **FTP Users**).
2. Review the list of all FTP and SFTP users associated with your domains.
3. Delete any user account that you do not explicitly recognize or no longer require.
4. For all remaining valid users, update their passwords to fresh, complex passphrases.
5. Where supported, restrict FTP/SFTP access exclusively to **SFTP (SSH File Transfer Protocol)** and disable plain unencrypted FTP.

### 4. Scan Web Root Directories for Modified PHP Files and Backdoors

If your website runs WordPress, Laravel, or a PHP CMS, connect via SSH or SFTP and search for recently modified files:

```bash
# Navigate to your domain's web root directory
cd ~/example.com

# Find all PHP files modified in the past 14 days
find . -type f -name "*.php" -mtime -14 -ls

# Search for common obfuscated backdoor signatures in PHP files
grep -rnE "(eval\(base64_decode|assert\(gzinflate|str_rot13|shell_exec\()" .
```

Inspect `.htaccess` files in your root and subdirectories to ensure no unauthorized redirects or script handlers have been inserted:

```bash
# View active .htaccess rules
cat .htaccess
```

### 5. Check WordPress Administrator Accounts and Database Users

If you run WordPress on DreamHost:

1. Log into your WordPress admin dashboard (`/wp-admin/`).
2. Go to **Users** > **All Users** and filter by the **Administrator** role.
3. Immediately delete any administrator account that was not created by your team.
4. If your site was exposed, rotate your WordPress security keys and salts. Edit `wp-config.php` and replace the existing keys with newly generated values from the [WordPress Salt Generator](https://api.wordpress.org/secret-key/1.1/salt/):

```php
define('AUTH_KEY',         'put your unique phrase here');
define('SECURE_AUTH_KEY',  'put your unique phrase here');
define('LOGGED_IN_KEY',    'put your unique phrase here');
define('NONCE_KEY',        'put your unique phrase here');
define('AUTH_SALT',        'put your unique phrase here');
define('SECURE_AUTH_SALT', 'put your unique phrase here');
define('LOGGED_IN_SALT',   'put your unique phrase here');
define('NONCE_SALT',       'put your unique phrase here');
```
Updating these salts immediately invalidates all active cookies and forces all logged-in users to re-authenticate.

### 6. Verify Email Authentication Records (SPF, DKIM, DMARC)

To prevent attackers from spoofing your domain while your credentials were exposed, verify that your domain has strong email authentication records in DNS:
- **SPF**: Ensure your TXT record specifies `v=spf1 include:netblocks.dreamhost.com -all` (or your appropriate mail sender).
- **DKIM**: Ensure DKIM signing is enabled in the DreamHost mail settings.
- **DMARC**: Publish a DMARC policy (e.g., `v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc-reports@example.com`) to reject unauthorized senders impersonating your domain.

---

## Primary Advisories and References

For continuing coverage and status reports:
- [BleepingComputer: DreamHost forces email, FTP, SFTP password resets in ongoing incident](https://www.bleepingcomputer.com/news/security/dreamhost-forces-email-ftp-sftp-password-resets-in-ongoing-incident/) — In-depth reporting on user impact and customer notifications.
- [DreamHost System Status](https://www.dreamhoststatus.com/) — Official incident announcements and platform maintenance updates.

---

Need help auditing your website files for backdoors, securing company email systems, or migrating to a dedicated VPS or cloud architecture? Learn more about our [DevOps and server management services](/services/devops/), explore our [legacy application maintenance solutions](/services/web-applications/), or [get in touch for expert assistance](/contact/).
