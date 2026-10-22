---
title: "Patch Immediately: Critical PHP RCE Vulnerabilities (CVE-2026-109618 & CVE-2026-109619)"
description: "The NSA and cloud providers have issued emergency advisories for two critical remote code execution flaws in PHP. Learn what is affected and how to patch."
date: 2026-10-22
category: "Hosting & DevOps"
draft: false
image: "/images/blog/patch-critical-php-rce-vulnerabilities.webp"
imageAlt: "Editorial 3D illustration of a cloud server rack with a glowing security shield and code patch icon."
---

On October 21, 2026, two critical remote code execution (RCE) vulnerabilities in PHP were publicly disclosed, tracked under **CVE-2026-109618** and **CVE-2026-109619** (commonly referred to by security researchers as **PHP2Shell**). 

Both vulnerabilities carry critical severity scores (CVSS 9.2–9.8) and allow unauthenticated remote attackers to execute arbitrary code or extract sensitive memory directly over HTTP requests. Proof-of-concept exploit code is already circulating publicly, and threat actors are actively scanning internet-facing servers.

In response, national cyber agencies and major cloud platforms have issued urgent guidance:
- The **National Security Agency (NSA)** released an advisory urging organizations to apply security updates immediately or disconnect vulnerable internet-facing servers until patched.
- Infrastructure providers such as **DigitalOcean** published immediate remediation notices, suspending vulnerable 1-Click marketplace images and instructing customers across Droplets, Kubernetes (DOKS), and App Platform environments to patch.

If you manage servers running WordPress, Drupal, Laravel, Craft CMS, Magento, or custom PHP applications, treat this as a high-priority incident.

---

## What the Vulnerabilities Entail

Both flaws reside within core memory and runtime lifecycle management in the PHP engine:

### 1. CVE-2026-109618: Out-of-Memory Handling Flaw
This vulnerability stems from improper control flow during out-of-memory (OOM) handling using `longjmp()`. When an allocation failure is triggered under specific conditions, internal memory states are left uninitialized while execution continues. An attacker can craft requests that deliberately induce this condition, manipulating heap layouts to achieve reliable, unauthenticated remote code execution.

### 2. CVE-2026-109619: Process Lifecycle and Use-After-Free
The second flaw involves worker process state management and error cleanup. When an unhandled error or abrupt termination occurs, references to freed memory regions can persist across worker lifecycles. In environments where worker processes are reused (such as PHP-FPM or Apache `mod_php`), attackers can exploit this use-after-free condition to execute arbitrary commands or leak residual memory across requests—potentially exposing database credentials, API tokens, or session headers processed by other users.

---

## Who Is Affected and Which Versions Are Patched

Because these bugs exist in foundational components of the engine, virtually every major PHP version dating back through legacy releases is impacted.

The PHP Foundation released emergency patched versions across all active branches:

| PHP Branch | Patched Version | Upstream Status |
| :--- | :--- | :--- |
| **PHP 8.5** | **8.5.12** | Patched |
| **PHP 8.4** | **8.4.27** | Patched |
| **PHP 8.3** | **8.3.36** | Patched |
| **PHP 8.2** | **8.2.35** | Patched |
| **PHP 8.1 & earlier** | *No official patch* | **End of Life (EOL)** |

> [!WARNING]
> **The Legacy Version Trap:** PHP 8.1 and earlier are End-of-Life and do not receive official upstream security releases. If your infrastructure still relies on unsupported PHP branches, you must upgrade to a supported release immediately or isolate those services behind a private VPN or strict firewall rules.

---

## Action Plan: How to Secure Your Infrastructure

Applying the fix requires updating your runtime and ensuring the newly compiled binaries are loaded into running processes.

### 1. Identify Your Running Versions
Log into your servers or containers and check your CLI and FPM versions:
```bash
php -v
```
If you manage multiple PHP versions on the same host (common on multi-tenant control panels), inspect all installed packages and listening pools:
```bash
systemctl list-units | grep php
```

### 2. Update Operating System Packages
For standard Linux distributions, fetch the latest patched packages from official distribution security repositories:

**Ubuntu & Debian:**
```bash
sudo apt update
sudo apt install --only-upgrade 'php*'
```

**RHEL, AlmaLinux, Rocky Linux, & Fedora:**
```bash
sudo dnf upgrade 'php*'
```

*Note: Many Linux distributions backport security fixes into existing minor versions. Verify via your distribution's changelog (e.g., `apt-get changelog php8.3` or `rpm -q --changelog php`) that CVE-2026-109618 and CVE-2026-109619 are addressed.*

### 3. Restart Web Services (Do Not Skip This Step)
Updating files on disk does not terminate running worker processes. Stale, vulnerable child processes will remain in memory until restarted:
```bash
# Restart PHP-FPM for your installed version
sudo systemctl restart php8.3-fpm

# Restart your web server
sudo systemctl restart nginx
# or
sudo systemctl restart apache2
```

### 4. Update Containerized Workloads (Docker & Kubernetes)
If your applications run inside Docker containers or on Kubernetes (such as DOKS or Amazon EKS):
1. Update your Dockerfile base images to the patched point releases (e.g., `php:8.3.36-fpm-alpine`).
2. Trigger a clean rebuild without using cached layers:
   ```bash
   docker build --no-cache -t my-app:latest .
   ```
3. Roll out the newly built containers and verify that the old pods have terminated.

### 5. Deploy Temporary Perimeter Defenses
While patches are rolling out across your fleet:
- **Enable Web Application Firewall (WAF) Protections:** Edge providers such as Cloudflare have deployed emergency managed WAF rules specifically designed to detect and block known exploit payloads for these CVEs.
- **Restrict Unnecessary Exposure:** Restrict internal control panels, phpMyAdmin instances, staging environments, and legacy dashboards so they are not publicly accessible from the open internet.

### 6. Review Logs for Signs of Compromise
Applying a patch protects against future requests, but it will not remove backdoors if an attacker gained access prior to updating.
- Inspect access logs for high-frequency malformed payloads, unusual user-agent strings, or repeated requests triggering 500/502 errors.
- Check system logs (`journalctl` / `/var/log/syslog`) for segmentation faults (`SIGSEGV`) in `php-fpm` workers.
- Run integrity checks against your codebase, plugins, and upload directories to detect unexpected web shells or altered files.

---

## Official Advisories and References

For further details and provider-specific guidance, review the official sources:
- [NSA Advisory: Critical Patches Recommended for PHP Vulnerabilities](https://www.nsa.gov/Press-Room/Press-Releases-Statements/Press-Release-View/Article/4630238/nsa-advisory-critical-patches-recommended-for-php-vulnerabilities/) — Official statement and recommendations from the National Security Agency.
- [DigitalOcean: Critical PHP RCE Vulnerabilities: Patch Now](https://www.digitalocean.com/blog/critical-php-rce-vulnerabilities-patch-now) — Infrastructure guidance for Droplets, Kubernetes, 1-Click apps, and Cloudways.

---

Need assistance reviewing your server infrastructure, upgrading legacy PHP versions, or securing production environments? Learn more about [cloud, DevOps, and server management services](/services/devops/) or [get in touch](/contact/).
