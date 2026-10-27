---
title: "Gheist Campaign Exfiltrates GitHub Actions Secrets via CI Logs: How to Audit and Protect Your Repositories"
description: "An automated threat campaign dubbed Gheist uses stolen GitHub tokens to plant malicious workflows in private repositories, bypassing GitHub log masking with base32 to harvest organization secrets. Here is how to detect and remediate."
date: 2026-10-26
category: "Hosting & DevOps"
draft: false
image: "/images/blog/gheist-github-actions-secrets-exfiltration.webp"
imageAlt: "Tactile 3D editorial illustration of an automated CI/CD pipeline gateway in midnight navy with glowing amber circuit tracks and a protective cryptographic vault shield."
---

On October 26, 2026, security researchers from cloud security firm Wiz published an in-depth advisory uncovering **Gheist**, an aggressive, automated threat campaign actively targeting private GitHub repositories and GitHub Enterprise Server instances.

By abusing stolen GitHub personal access tokens (PATs) harvested from infostealer malware and upstream developer tool breaches, the threat actors create disposable branches, inject custom GitHub Actions workflows, dump all organization and repository secrets into build logs using base32 encoding to evade masking, download the log artifacts via the GitHub API, and delete the workflow runs within seconds.

More than **13,500 malicious branches** across at least **850 compromised developer accounts** have already been confirmed. If your team relies on GitHub Actions for continuous integration, Docker builds, or cloud deployments, you need to understand how this attack works, how to audit your repositories for exposure, and how to harden your CI/CD configuration against token-based lateral movement.

---

## How the Gheist Campaign Operates

The attackers behind Gheist take advantage of an intrinsic property of GitHub repository access: **any identity with write permissions to a repository can read the secrets scoped to that repository and its execution environments**. 

When a developer's Personal Access Token or machine token is leaked, Gheist automates a surgical multi-step harvesting pipeline:

### 1. Branch Creation and Workflow Injection
The automated tool connects to GitHub's REST API using the custom HTTP User-Agent `gheist`. For every repository accessible to the stolen token, it creates a new branch following a strict naming convention:
```text
ci-sync-[0-9a-z]{6}
```
It then commits a single file, `.github/workflows/sync-check.yml`, with the innocuous commit message `ci: sync config`. Because the commit is authored under the token owner's name, it blends into routine development activity.

### 2. Evading GitHub's Secret Masking via Base32
GitHub Actions automatically masks registered repository secrets in workflow console logs, replacing known string values with `***`. However, this masking mechanism relies on exact string matching against the plaintext secret values registered in repository settings.

Gheist bypasses this safeguard entirely by concatenating the environment and all accessible secrets into JSON, piping the stream through `base32`:
```yaml
- name: Check Sync
  run: |
    echo '${{ toJSON(secrets) }}' | base32 -w 120
```
Because the base32-encoded ciphertext does not match the plaintext secret strings, GitHub Actions prints the complete encoded blob into the console logs unmasked.

### 3. Harvesting Environment and Cloud Deployment Secrets
Advanced variants of the Gheist tool enumerate repository environments (such as `production`, `staging`, or `aws-deploy`). The script dynamically generates separate matrix jobs targeted at each environment. This forces GitHub Actions to unlock environment-level secrets—frequently including production database connection URIs, AWS access keys, Stripe private keys, and cloud deployment credentials.

### 4. API Exfiltration and Log Deletion
Unlike traditional malware that opens an outbound socket connection to an external Command and Control (C2) server, Gheist operates completely within legitimate GitHub infrastructure:
1. The attacker waits for the Actions job to complete.
2. The tool fetches the raw build log via GitHub's API endpoint: `GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs`.
3. The tool immediately issues a `DELETE /repos/{owner}/{repo}/actions/runs/{run_id}` request, followed by deleting the `ci-sync-*` branch.

Because the data never leaves via an unusual network egress port and the workflow run is purged from the GitHub UI within minutes, teams without centralized audit log shipping remain unaware of the exfiltration.

### 5. Self-Hosted Runner Targeting
In mid-October 2026, Wiz observed a secondary payload targeting repositories registered with self-hosted runners. This variant deploys scripts (`.gdmp_pat`, `.gdmp_sweep`) designed to scrape local runner environments, looking for 31 distinct credential formats—including IMDSv2 cloud metadata tokens, runner credentials, Docker socket permissions, and Kubernetes Service Account tokens.

---

## Why Private Repositories and GitHub Enterprise Server Are Vulnerable

In July 2026, GitHub introduced a security safeguard that automatically pauses workflow runs flagged as suspicious until an authorized collaborator manually approves them.

> [!WARNING]
> **Private Repository Exposure**: GitHub's automatic workflow pause safeguard applies **only to public repositories on github.com**. It does not protect private repositories, nor does it exist on GitHub Enterprise Server (GHES). 

As a result, while public repository runs triggered by Gheist were halted awaiting approval, runs executed against private organizational repositories executed immediately, dumping proprietary deployment credentials without triggering alerts.

---

## Indicators of Compromise (IoCs)

Inspect your GitHub organization audit logs, SIEM, and cloud provider telemetry for the following signatures:

| Indicator Type | Value / Pattern | Description |
| :--- | :--- | :--- |
| **User Agent** | `gheist` | Custom HTTP client string used for GitHub API calls |
| **Branch Pattern** | `^ci-sync-[0-9a-z]{6}$` | Ephemeral branches created to execute workflows |
| **Commit Message** | `ci: sync config` | Commit message adding `.github/workflows/sync-check.yml` |
| **Workflow File** | `.github/workflows/sync-check.yml` | Payload file dumping `toJSON(secrets)` in base32 |
| **Log String** | `toJSON(secrets) }}' \| base32 -w 120` | Command string in Actions execution history |
| **Runner Artifacts** | `.gdmp_pat`, `.gdmp_patg`, `.gdmp_sweep` | Scripts dropped onto self-hosted runners |
| **Git Blob SHA** | `f3da2b8b357dcda02fd455d314be2a95007516a6` | Baseline unhashed sync-check workflow blob |
| **Git Blob SHA** | `c665b778b2d822453293003e7ca0bbb2cb08e39d` | Variant targeting self-hosted runners |

---

## Step-by-Step Action Plan: Auditing and Hardening Your Repositories

If you maintain organization repositories on GitHub or manage self-hosted CI runners, execute the following audit and remediation steps immediately.

### 1. Audit GitHub Logs for Malicious Branch and Run Activity

Use the GitHub CLI (`gh`) or the REST API to query your organization's audit log for runs triggered on `ci-sync-*` branches or actions initiated by the `gheist` user-agent:

```bash
# Query audit log for recently deleted workflow runs
gh api --paginate "/orgs/YOUR_ORG/audit-log?phrase=action:workflows.delete_workflow_run" \
  --jq '.[] | {created_at: .created_at, actor: .actor, repo: .repo, user_agent: .user_agent}'

# Search for created branches matching the Gheist naming convention
gh api --paginate "/orgs/YOUR_ORG/audit-log?phrase=action:git.create_ref ref:refs/heads/ci-sync-*" \
  --jq '.[] | {created_at: .created_at, actor: .actor, repo: .repo}'
```

If you find deleted runs that finished within 60 seconds of branch creation, assume all repository and environment secrets accessible to that workflow have been harvested.

### 2. Audit Cloud Provider OIDC Logs (AWS / GCP / Azure)

If your GitHub Actions workflows use OpenID Connect (OIDC) to assume roles in AWS, Google Cloud, or Azure without hardcoded keys, check your cloud audit logs (AWS CloudTrail or GCP Cloud Audit Logs):

```bash
# Example AWS CloudTrail query for AssumeRoleWithWebIdentity events
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRoleWithWebIdentity \
  --start-time $(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%SZ) \
  --query 'Events[?contains(CloudTrailEvent, `ci-sync-`)].{Time:EventTime, ARN:Resources[0].ResourceName}'
```

Any role assumed with a federated subject (`sub`) referencing `ref:refs/heads/ci-sync-*` confirms that the attacker successfully impersonated your deployment pipeline in your cloud infrastructure.

### 3. Immediate Revocation and Credential Rotation

If a repository shows evidence of Gheist activity:

1. **Revoke the Compromised GitHub Token**: Immediately revoke the personal access token or fine-grained token associated with the committing identity. Check the developer's local workstation for infostealer malware (RedLine, Lumma, Vidar).
2. **Rotate All Repository & Environment Secrets**: Rotate every API key, database URI, container registry token, and private SSH key stored in the repository settings.
3. **Rotate Organization-Wide Secrets**: If organization-level secrets were accessible to the affected repository, rotate those organization secrets globally.
4. **Quarantine Self-Hosted Runners**: If a self-hosted runner processed a `ci-sync-*` job, terminate the underlying host instance, rotate its cloud instance profile credentials, and deploy a clean runner image.

### 4. Restrict Default Workflow Permissions

By default, newly created GitHub repositories grant `read` and `write` permissions to the `GITHUB_TOKEN`. Restrict the default permission model across your entire organization to read-only:

1. Navigate to **Organization Settings** > **Actions** > **General**.
2. Under **Workflow permissions**, select **Read repository contents and packages permissions**.
3. Uncheck **Allow GitHub Actions to create and approve pull requests**.

In individual workflow files, explicitly declare minimal permissions:

```yaml
# Enforce least privilege in all repository workflows
permissions:
  contents: read
  issues: none
  pull-requests: none
```

### 5. Enforce Deployment Environment Protection Rules

To prevent stolen tokens from dumping sensitive production secrets:

1. Go to **Repository Settings** > **Environments** > Select your environment (e.g., `production`).
2. Enable **Required reviewers** and assign designated senior engineers or DevOps leads.
3. Enable **Deployment branches** and restrict access strictly to protected branches (e.g., `refs/heads/main`).

> [!NOTE]
> Even if an attacker creates an arbitrary `ci-sync-*` branch and attempts to trigger an environment-scoped job, GitHub Actions will block execution until an authorized reviewer approves the deployment run.

### 6. Harden OIDC Trust Policies to Specific Protected Branches

When configuring IAM trust policies for cloud role assumption (such as AWS IAM or GCP Workload Identity), never allow wildcard branch subjects (`repo:org/repo:*`).

Always bind the trust policy strictly to your production branch:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:your-org/your-repo:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

With this condition enforced, attempts by Gheist on `ci-sync-*` branches to assume cloud IAM roles will be rejected immediately by AWS STS with an HTTP 403 Access Denied.

### 7. Phase Out Classic Personal Access Tokens (PATs)

Classic Personal Access Tokens grant broad, account-wide scope across all repositories. Migrate your team and automation workflows to:
- **Fine-Grained Personal Access Tokens**: Restrict tokens to specific repositories with granular read/write permissions and mandatory expiration periods (30–90 days).
- **GitHub Apps**: For third-party integrations and CI/CD automation, use GitHub Apps backed by private key authentication and short-lived installation access tokens.

---

## Primary Sources and Technical References

For technical disclosure details and threat intelligence updates:
- [The Hacker News: Gheist Uses Stolen GitHub Tokens to Steal Private Repository Secrets via Actions Logs](https://thehackernews.com/2026/10/gheist-uses-stolen-github-tokens-to.html) — Comprehensive coverage of campaign indicators and victim demographics.
- [Wiz Security Research: Gheist Threat Intelligence Advisory](https://www.wiz.io/blog) — Primary technical breakdown of the `ci-sync-*` attack chain and self-hosted runner scripts.
- [GitHub Actions Documentation: Security Hardening for GitHub Actions](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions) — Official guidance on configuring least-privilege tokens and environment protection rules.

---

Need assistance auditing your GitHub Actions pipelines, migrating CI/CD secrets to AWS Secrets Manager or HashiCorp Vault, or hardening cloud IAM policies? Explore our [DevOps and server management services](/services/devops/), review our [backend development expertise](/services/backend-development/), or [schedule a technical consultation](/contact/).
