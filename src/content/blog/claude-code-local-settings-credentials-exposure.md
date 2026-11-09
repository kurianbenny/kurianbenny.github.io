---
title: "Claude Code Security Alert: Why '.claude/settings.local.json' Leaks Secrets to Public GitHub Repos"
description: "Security research has revealed that over 1,120 public GitHub repositories contain plain-text API keys and database passwords saved by Claude Code when users select 'Yes, and don't ask again'. Here is how the leak occurs, how to audit your repositories, and how to rotate exposed secrets."
date: 2026-11-09
category: "Hosting & DevOps"
draft: false
image: "/images/blog/claude-code-local-settings-credentials-exposure.webp"
imageAlt: "Tactile 3D editorial illustration of an AI coding terminal module in midnight navy emitting plain-text credential blocks, intercepted and sealed by an amber cryptographic vault lock and pre-commit security shield on warm cream."
---

As developers increasingly embed autonomous AI coding agents into their daily terminal workflows, a subtle configuration design choice has triggered a widespread credential leakage incident across the open-source ecosystem.

A security investigation conducted by software security firm Apiiro identified **1,122 public GitHub repositories** containing live secrets, database passwords, cloud tokens, and sensitive private API keys stored in plain text inside `.claude/settings.local.json` configuration files.

The flaw lies at the intersection of developer convenience and multi-user git tracking. When a developer prompts Anthropic’s CLI assistant, Claude Code, to execute a command containing sensitive variables and chooses **"Yes, and don't ask again,"** the CLI writes the approved command verbatim—including all embedded secrets—into a project-level configuration file.

Because Claude Code attempts to ignore this file using a developer's machine-local git configuration rather than adding it to the repository's `.gitignore`, the file frequently gets committed when collaborative commits or automated git workflows run.

---

## Anatomy of the Leak: How Secrets Land in Version Control

Understanding how sensitive strings make their way into public GitHub commits reveals a classic security trap in developer agent tooling:

```text
[ Developer runs CLI command in Claude Code session ]
(e.g., `psql -h db.internal -U app -W "SuperSecretPass!"`)
                         │
                         ▼
[ Claude Code prompts: "Run this command?" ]
[ Option Selected: "Yes, and don't ask again" ]
                         │
                         ▼
[ CLI writes approved rule verbatim to project file ]
[ File: `.claude/settings.local.json` contains plain-text secret ]
                         │
   ┌─────────────────────┴───────────────────────────────────┐
   │ THE GIT HYGIENE GAP                                     │
   │ • Claude Code writes file path to local ~/.gitconfig     │
   │ • File is NOT added to project-level .gitignore          │
   │ • Coworkers / CI agents / Git GUI tools do NOT read     │
   │   the original developer's local git ignore config      │
   └─────────────────────┬───────────────────────────────────┘
                         │
                         ▼
[ `git add .` or automated commit includes `.claude/` directory ]
                         │
                         ▼
[ Pushed to Remote GitHub Repository (Public or Leaked Private) ]
                         │
                         ▼
[ Credentials harvested by threat actors via GitHub Event Stream ]
```

### 1. Plaintext Command Persistence
Claude Code requests user authorization before executing potentially destructive shell commands. When an engineer selects "Yes, and don't ask again," the tool creates an authorization entry under `.claude/settings.local.json` within the project root so future invocations execute without prompt delays.

If the executed command contained inline secrets—such as `curl -H "Authorization: Bearer <token>"`, `docker login -u user -p <pass>`, or database initialization strings—the exact command line is persisted without token sanitization or credential masking.

### 2. The Machine-Local Ignore Fallacy
To prevent committing local preferences, Claude Code automatically appends `.claude/settings.local.json` to the user's *global* git configuration (`core.excludesFile`, usually located at `~/.config/git/ignore` or `~/.gitconfig`).

While this keeps the file invisible to `git status` on that specific developer's laptop, **global excludes do not travel with the repository**:
- When another teammate clones the repository, their machine does not have the exclusion configured.
- When an AI agent generates automated commits (often with Claude listed as co-author), unstaged project files can be packaged into the commit.
- If a developer stages files using explicit pathnames or IDE GUI extensions, the local ignore is overridden.

In Apiiro's analysis of over 104,000 repositories containing `.claude/settings.local.json`, more than half of the commits adding the file featured automated or assisted commit messages, illustrating that agents often end up committing their own settings files.

---

## Immediate Action: How to Audit Your Repositories

If you or your team have used Claude Code or similar agentic CLI tools, follow this step-by-step audit and containment protocol.

### 1. Search Local Git History for `.claude/settings.local.json`
Run this shell one-liner from the root of your repositories to detect whether the file has ever been staged or committed:

```bash
git log --all --full-history -- "**/settings.local.json" "*settings.local.json"
```

If any commit hashes are returned, inspect the commit diff to verify whether secrets were recorded:
```bash
git log -p --all -- "**/settings.local.json"
```

### 2. Search for Leaked Secrets on GitHub via Search / GitHub CLI
If your repository is hosted on GitHub, verify if any commits pushed the file remotely:

```bash
gh search code "filename:settings.local.json path:.claude" --owner="@me"
```

---

## Remediation Workflow: Rotate First, Clean Git Second

> [!CAUTION]
> Simply deleting `.claude/settings.local.json` and pushing a new commit **does not secure your infrastructure**. The secret remains permanently readable in public commit history, git reflogs, and commit event caches.

Follow this sequential remediation plan:

### Step 1: Immediate Credential Invalidation & Rotation
Treat every credential discovered inside `.claude/settings.local.json` as fully compromised:
1. **API Keys & Cloud Tokens**: Immediately revoke and regenerate cloud provider tokens (AWS, GCP, DigitalOcean, Stripe, OpenAI, Anthropic).
2. **Database Passwords**: Rotate database credentials, terminate existing connection pools, and verify IP whitelist restrictions on your database firewalls.
3. **SSH Keys & Personal Access Tokens**: Invalidate compromised GitHub Personal Access Tokens (PATs) and SSH deployment keys.

### Step 2: Purge the File from Git History
Use `git-filter-repo` (the recommended modern replacement for `git filter-branch`) to completely expunge the file from all commits, branches, and tags:

```bash
# Install git-filter-repo if not present
pip install git-filter-repo

# Completely remove .claude/settings.local.json across all history
git filter-repo --path .claude/settings.local.json --invert-paths --force
```

Force-push the cleansed history to your remote repository:
```bash
git push origin --force --all
git push origin --force --tags
```

### Step 3: Enforce Repository-Level `.gitignore`
Ensure `.claude/` is explicitly committed to the repository's root `.gitignore` so the exclusion travels with the codebase to every contributor and build runner:

```text
# Claude Code and Agent CLI local configurations
.claude/
.claude/settings.local.json
*.local.json
```

Commit this `.gitignore` modification to your main branch:
```bash
git add .gitignore
git commit -m "chore(security): explicitly ignore .claude local configuration files"
git push origin master
```

---

## Preventing Agent Tool Secret Leaks: Best Practices

To safeguard your engineering workflows while utilizing AI developer tooling, establish these defensive boundaries:

### 1. Never Pass Plaintext Secrets into Shell Commands
Avoid embedding tokens directly into command arguments:
```bash
# INSECURE: Captured by shell history, process tables, and AI allow-lists
curl -H "Authorization: Bearer sk-ant-api03-xxxx..." https://api.anthropic.com/v1/messages

# SECURE: Reference environment variables without exposing raw strings
curl -H "Authorization: Bearer ${ANTHROPIC_API_KEY}" https://api.anthropic.com/v1/messages
```

Use `.env` files protected by `.gitignore` or secret managers (`direnv`, Doppler, 1Password CLI) that inject credentials at runtime without exposing raw literals in CLI arguments.

### 2. Implement Automated Pre-Commit Secret Scanning
Incorporate pre-commit hooks that detect accidental secret staging before `git commit` executes:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
```

Install and activate the hook across developer workstations:
```bash
pre-commit install
```

```text
[ Developer types `git commit` ]
               │
               ▼
   [ Pre-Commit Hook Runs Gitleaks ]
               │
       ┌───────┴───────┐
   Secrets found?    No secrets
       │               │
       ▼               ▼
[ COMMIT ABORTED ]  [ COMMIT ALLOWED ]
```

---

## Primary Sources & References

- **The Hacker News**: [Claude Code's “Don't Ask Again” File Exposes Passwords and Keys in 1,122 Public Copies on GitHub](https://thehackernews.com/2026/11/claude-codes-dont-ask-again-file.html)
- **Apiiro Security Research**: [Analyzing Credential Leakage in AI Developer Agent Configurations](https://apiiro.com/research/)
- **Anthropic Claude Code Documentation**: [Permissions and Global Excludes Settings](https://docs.anthropic.com/claude/docs/claude-code)
- **BleepingComputer**: [Truffle Security Launches Secrets Revocation Program as AI Leaks Grow](https://www.bleepingcomputer.com/news/security/)

---

## Protect Your CI/CD and Cloud Secret Infrastructure

Integrating AI developer tools into production engineering workflows increases speed, but without rigorous secret management and automated guardrails, developer tooling can inadvertently expose production keys to public scrapers.

If you are looking to audit your CI/CD pipelines, secure developer tooling environments, or modernize cloud secret architectures across your team, explore my [DevOps & Infrastructure Services](/services/devops/) or reach out through the [contact form](/contact/).
