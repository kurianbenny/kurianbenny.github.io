---
title: "Patch Immediately: Actively Exploited Nextcloud Collabora Online RCE (CVE-2026-110447)"
description: "A critical CVSS 9.2 OS command injection vulnerability in Nextcloud's built-in Collabora Online server is actively exploited to drop web shells. Learn what is affected and how to patch."
date: 2026-10-26
category: "Hosting & DevOps"
draft: false
image: "/images/blog/patch-nextcloud-collabora-online-rce.webp"
imageAlt: "Editorial 3D illustration of a midnight navy cloud document server cylinder receiving an amber hexagonal security patch shield against remote command injection."
---

On October 23, 2026, the U.S. Cybersecurity and Infrastructure Security Agency (CISA) added **CVE-2026-110447** to its Known Exploited Vulnerabilities (KEV) catalog, assigning it a mandatory remediation deadline under Binding Operational Directive (BOD) 26-04.

Carrying a critical severity score of **CVSS 9.2**, the flaw is an OS command injection vulnerability (`CWE-78`) residing within the **Collabora Online Built-in CODE Server** application (`richdocumentscode`) for **Nextcloud**. Threat actors are actively scanning internet-exposed Nextcloud instances to deploy persistent web shells, steal database credentials, and compromise underlying cloud host servers.

If you self-host Nextcloud or administer private cloud storage for your team or clients, treat this advisory as an immediate emergency update.

---

## Technical Breakdown: OS Command Injection in `proxy.php`

Nextcloud allows organizations to edit office documents directly in the web browser through Collabora Online. Many administrators deploy the **Built-in CODE Server** app (`richdocumentscode`), which packages the Collabora document engine directly inside the Nextcloud PHP environment without requiring a separate Docker container or dedicated daemon.

The vulnerability resides within the app's internal reverse-proxy routing component, specifically `proxy.php`:

### 1. The Trigger Condition
When an end user opens a document, `proxy.php` forwards incoming HTTP requests and WebSocket connections to the local CODE binary running in the background. However, if the local document server daemon is not currently running—such as immediately after a host reboot, an app update, or a process crash under heavy memory load—the script attempts to spawn or manage the local daemon process dynamically.

### 2. Lack of Shell Argument Sanitization
During this fallback startup and proxying routine, incoming request parameters passed by remote clients are concatenated directly into operating system shell commands without strict sanitization, typing, or parameter escaping. 

### 3. Remote Code Execution (RCE)
An unauthenticated or minimally privileged remote attacker can submit crafted HTTP requests targeting the `proxy.php` endpoint containing command delimiters (such as `;`, `|`, or backticks). The underlying Linux shell executes the injected payload with the privileges of the web server process (typically `www-data` or `nginx`).

---

## Active Exploitation in the Wild: Web Shell Deployment

CISA and threat intelligence firms report active, automated scanning targeting public Nextcloud endpoints across cloud hosting providers (AWS, DigitalOcean, Hetzner, and Linode):

1. **Reconnaissance**: Attackers probe for exposed Nextcloud endpoints hosting the built-in document server at `/apps/richdocumentscode/proxy.php`.
2. **Payload Delivery**: If the endpoint responds, attackers inject curl or wget commands to download obfuscated PHP web shells into writeable directories, such as `/var/www/nextcloud/apps/` or the Nextcloud `data/` directory.
3. **Credential Harvesting**: Using the planted web shell, adversaries dump `config/config.php` to extract MySQL/PostgreSQL database credentials, instance secret salts, and S3 object storage access keys.
4. **Persistence and Lateral Movement**: Attackers establish cron jobs under the `www-data` crontab, search local disks for cryptocurrency wallets and SSH keys, and attempt privilege escalation to `root`.

---

## Who Is Affected and Fixed Versions

Review your installation against the following criteria:

| Component | Vulnerable Versions | Patched Version | Upstream Status |
| :--- | :--- | :--- | :--- |
| **Collabora Online Built-in CODE Server** (`richdocumentscode`) | **Prior to 26.4.303** | **26.4.303** or later | Patched (Emergency Release) |
| **Standalone Collabora Online Server** (`coolwsd` via Docker or systemd) | *Not Affected* | *Not Affected* | Secure by architecture |

> [!NOTE]
> If your Nextcloud installation connects to an **external, standalone Collabora Online server** running in its own dedicated Docker container or separate VM via the standard `richdocuments` connector, your instance is **not affected** by this vulnerability. The flaw exists exclusively within the built-in local CODE server app (`richdocumentscode`).

---

## Step-by-Step Action Plan: How to Secure Your Nextcloud Server

Securing your environment requires updating the app via the Nextcloud command-line interface (`occ`), auditing access logs for exploitation attempts, and scanning local directories for unauthorized web shells.

### 1. Verify Your Installed CODE Server Version

Connect to your Nextcloud host via SSH and check the status of the `richdocumentscode` app using the `occ` CLI:

```bash
cd /var/www/nextcloud
sudo -u www-data php occ app:list | grep richdocumentscode
```

If the installed version is lower than `26.4.303`, your system is vulnerable.

### 2. Update the App Immediately via `occ`

Run the update command directly from the terminal to pull the latest patched package from the official Nextcloud app store:

```bash
# Update the built-in CODE server app
sudo -u www-data php occ app:update richdocumentscode

# Verify the app is now at 26.4.303 or higher
sudo -u www-data php occ app:list | grep richdocumentscode
```

If you manage Nextcloud via Docker (e.g., the official `nextcloud:apache` image):

```bash
docker exec -u www-data nextcloud-app php occ app:update richdocumentscode
```

### 3. Audit Web Server Access Logs for Exploit Attempts

Inspect your Nginx or Apache access logs for incoming requests directed at `proxy.php`:

```bash
# Search Nginx access logs for requests targeting proxy.php
grep "apps/richdocumentscode/proxy.php" /var/log/nginx/access.log* | grep -E "(%20|;|\||`|\$|wget|curl)"

# Search Apache access logs
grep "apps/richdocumentscode/proxy.php" /var/log/apache2/access.log* | grep -E "(%20|;|\||`|\$|wget|curl)"
```

Look for requests containing shell metacharacters, base64 payloads, or requests originating from untrusted foreign IP ranges.

### 4. Scan for Planted Web Shells and Rogue Files

Because this vulnerability has been actively exploited to drop persistent web shells, simply applying the patch will not remove a pre-existing backdoor. Run the following filesystem integrity checks:

```bash
# Search for recently modified PHP files in Nextcloud app directories
find /var/www/nextcloud/apps/ /var/www/nextcloud/custom_apps/ -name "*.php" -mtime -14 -ls

# Search the Nextcloud data directory for executable PHP scripts
find /var/www/nextcloud/data/ -name "*.php" -ls

# Check www-data crontabs for unauthorized scheduled tasks
crontab -u www-data -l
```

Any unknown `.php` file located in the `data/` folder or outside standard app directories should be isolated and inspected immediately.

### 5. Rotate Database and Application Secrets

If you discover evidence of unauthorized access or suspicious access log entries:

1. **Rotate Nextcloud Database Password**: Change the database user password in MySQL/PostgreSQL and update `config/config.php`:
   ```bash
   sudo -u www-data php occ config:system:set dbpassword --value="NEW_SECURE_PASSWORD"
   ```
2. **Invalidate Active User Sessions**:
   ```bash
   sudo -u www-data php occ user:reset-password admin
   ```
3. **Rotate Cloud Storage Keys**: If your Nextcloud instance uses S3 or external storage, revoke and reissue your object storage access and secret keys in your cloud console.

---

## Primary Advisories and Technical References

For technical disclosure details and vulnerability tracking:
- [CISA Known Exploited Vulnerabilities Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) — Official KEV entry for CVE-2026-110447.
- [Collabora Online Security Advisory GHSA-g3vx-3m76-fghh](https://github.com/CollaboraOnline/online/security/advisories/GHSA-g3vx-3m76-fghh) — Official GitHub security bulletin from the Collabora Online maintainers.
- [Nextcloud Community Security Advisory](https://help.nextcloud.com/t/to-collabora-built-in-user-update-asap/250516) — Emergency guidance and discussion for Nextcloud system administrators.

---

Need assistance patching your self-hosted Nextcloud server, auditing Linux environments for backdoors, or architecting isolated Docker deployments? Discover our [DevOps and server management services](/services/devops/), explore our [backend development solutions](/services/backend-development/), or [reach out directly for support](/contact/).
