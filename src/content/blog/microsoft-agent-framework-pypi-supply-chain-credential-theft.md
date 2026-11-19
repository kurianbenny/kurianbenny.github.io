---
title: "Compromised Microsoft Agent Framework PyPI Package: How Attackers Hijacked Python Startup Hooks to Steal Cloud Credentials and OIDC Tokens"
description: "Threat actors breached Microsoft's official agent-framework Python package on PyPI, distributing versions 1.26.1 and 1.26.2 weaponized with .pth startup hooks. Here is a technical breakdown of how the payload silently executed on every Python launch, abused Azure IMDS and CI/CD OIDC endpoints to mint fresh cloud tokens, and how engineering teams must respond."
date: 2026-11-19
category: "AI & Development"
draft: false
image: "/images/blog/microsoft-agent-framework-pypi-supply-chain-credential-theft.webp"
imageAlt: "Tactile 3D editorial illustration of a midnight-navy Python module box with an abstract robotic agent arm, sealed by an interlocking amber cryptographic shield on warm cream."
---

In a significant software supply chain compromise targeting the artificial intelligence developer ecosystem, threat actors breached Microsoft's official **`agent-framework`** package on the Python Package Index (PyPI). Attackers published two weaponized releases—versions **1.26.1** and **1.26.2**—designed to silently harvest developer credentials, cloud configuration secrets, and federated identity tokens.

`agent-framework` serves as Microsoft's core meta-package for orchestrating multi-agent AI systems, accumulating approximately **190,000 monthly downloads** across enterprise AI workflows and automated CI/CD build pipelines.

What makes this supply chain attack uniquely dangerous is its persistence mechanism: rather than waiting for an application to explicitly `import agent_framework`, the malicious wheels dropped `.pth` startup files into Python's `site-packages` directory. As a consequence, the stealer executed automatically on **every single Python invocation** across affected machines and build runners—including basic `pip` operations—while querying cloud metadata endpoints to mint active, valid session tokens.

Here is an architectural breakdown of the attack, the live token-minting mechanics, and the necessary remediation blueprint for DevOps and AI engineering teams.

---

## The Attack Mechanics: Weaponizing Python .pth Startup Files

Python provides `.pth` (path configuration) files to allow third-party packages to dynamically add directories to `sys.path`. However, the Python interpreter has an obscure built-in feature: any line in a `.pth` file beginning with `import ` is executed immediately by the interpreter during startup.

```text
[ Developer / CI Runner installs `agent-framework==1.26.1` ]
                           │
                           ▼ (1) Wheel unpacks into virtualenv `site-packages`
[ Dropped File: `site-packages/agent_framework_meta.pth` ]
                           │
                           ▼ (2) Any subsequent `python` or `pip` command executes
[ Python Interpreter Initializes ]
                           │
                           ├─► Executes `import agent_framework_meta` via .pth hook
                           ▼
[ Malicious Stealer Runtime Initializes ]
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
 (A) Scans Local Disk  (B) Queries Azure IMDS  (C) Abuses OIDC Endpoints
  • ~/.azure/*.json     • 169.254.169.254       • Azure DevOps Token
  • ~/.docker/config    • MSI_ENDPOINT          • GitHub Actions OIDC
  • .git-credentials    • Mints Fresh Azure     • Exchanges for cloud
  • .env / pip.conf       Compute Tokens          access tokens
       └───────────────────┬───────────────────┘
                           │
                           ▼ (3) Packages into zlib-compressed, Base64 JSON
[ Exfiltrates payload to webhook[.]site endpoint ]
```

### 1. Zero-Import Execution via .pth Hooks
When a developer or CI workflow executed `pip install agent-framework`, the package dropped one of two `.pth` files:
- **Version 1.26.1**: Dropped `agent_framework_meta.pth`, containing `import agent_framework_meta`.
- **Version 1.26.2**: Dropped `af_runtime_diag.pth`, importing `af_runtime_diag.py`.

Because Python evaluates `.pth` files during standard interpreter bootstrap, the credential stealer executed on every subsequent invocation of Python—even when running unrelated commands like `pytest`, `python manage.py runserver`, or `pip list`.

### 2. Live Cloud Identity Minting (Beyond Static Secret Theft)
Most credential stealers merely read static files from the filesystem. The `agent-framework` payload went further: **it actively asked cloud platforms to issue fresh credentials**.

#### A. Azure Instance Metadata Service (IMDS) Exploitation
When running on Azure Virtual Machines or containerized compute, the script performed HTTP `GET` requests against the local IMDS endpoint at `169.254.169.254`:

```python
# Conceptual extraction of the attacker's managed identity query
import urllib.request
import json

req = urllib.request.Request(
    "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/",
    headers={"Metadata": "true"}
)
with urllib.request.urlopen(req) as resp:
    token_payload = json.loads(resp.read().decode())
    # Attacker obtains valid OAuth2 Bearer token for enterprise Azure resources
```

On Azure App Service and Azure Functions, it leveraged `IDENTITY_ENDPOINT` and `MSI_ENDPOINT` environment variables with `X-IDENTITY-HEADER` to acquire valid tokens.

#### B. CI/CD OIDC Token Exchange
Inside automated build pipelines, static credentials are often replaced with OpenID Connect (OIDC) workload identity federation. The malware detected these environments:
- **Azure DevOps**: Harvested `SYSTEM_ACCESSTOKEN` and `SYSTEM_OIDCREQUESTURI` to request federated tokens for `api://AzureADTokenExchange`.
- **GitHub Actions**: In version 1.26.2, the script captured `ACTIONS_ID_TOKEN_REQUEST_URL` and `ACTIONS_ID_TOKEN_REQUEST_TOKEN` to mint federated cloud tokens with the permissions granted to the GitHub repository.

#### C. Static Credential Scraping
Simultaneously, the script performed recursive regex scans across developer environments, collecting:
- Azure CLI credentials: `~/.azure/*.json`
- Source control & package registries: `.git-credentials`, `~/.npmrc`, `pip.conf`, `~/.docker/config.json`
- AI model tokens: Hugging Face cached tokens and OpenAI/Anthropic API keys
- Local environment files: `.env` and application configuration JSON files

All gathered artifacts were compiled into a single JSON blob, compressed with `zlib`, Base64-encoded, and exfiltrated via HTTPS POST to `webhook[.]site/d381fd80-ec62-42ad-8f5c-d1b15103c9bb`.

---

## Indicators of Compromise (IoCs)

Engineering teams should inspect developer workstations, Docker base layers, and CI/CD agent logs for the following indicators:

| Type | Indicator / Path | Description |
| :--- | :--- | :--- |
| **PyPI Package** | `agent-framework==1.26.1` | Compromised package release (Nov 17, 2026, 20:35 UTC) |
| **PyPI Package** | `agent-framework==1.26.2` | Secondary compromised package release (Nov 17, 2026, 21:08 UTC) |
| **Rogue File** | `site-packages/agent_framework_meta.pth` | Startup hook dropped by version 1.26.1 |
| **Rogue File** | `site-packages/af_runtime_diag.pth` | Startup hook dropped by version 1.26.2 |
| **Rogue File** | `site-packages/af_runtime_diag.py` | Stealer execution logic module |
| **Network C2** | `webhook[.]site/d381fd80-ec62-42ad-8f5c-d1b15103c9bb` | Data exfiltration endpoint |

---

## Incident Response: Step-by-Step Remediation Plan

If your team or automated pipelines installed `agent-framework` between **20:35 UTC and 22:00 UTC on November 17, 2026**, treat the host and associated cloud environments as compromised.

### 1. Audit Python Environments for Rogue Startup Hooks
Run this shell command across development workstations and virtual environment directories to detect rogue `.pth` files:

```bash
# Search virtual environments and site-packages for the rogue hooks
find . -type f \( -name "agent_framework_meta.pth" -o -name "af_runtime_diag.pth" -o -name "af_runtime_diag.py" \)
```

If found, immediately isolate the machine from internal networks.

### 2. Purge and Pin to Safe Version
PyPI administrators quickly quarantined versions 1.26.1 and 1.26.2. Pin all dependency files (`requirements.txt`, `Pipfile`, `pyproject.toml`) to the last verified legitimate release:

```text
agent-framework==1.26.0
```

Recreate virtual environments from scratch rather than attempting in-place uninstallation:
```bash
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Revoke and Invalidate Cloud Credentials
Because the stealer minted live Azure and GitHub federated tokens, simply rotating static passwords is insufficient:

1. **Azure Active Directory / Entra ID**:
   - Invalidate all active user sessions: `Revoke-AzureADUserAllRefreshToken`.
   - Audit Managed Identity access logs for anomalous API calls originating from external IP addresses.
   - Rotate Azure Service Principal secrets and client certificates.
2. **GitHub Actions**:
   - Rotate all repository and organization secrets (especially deploy keys, Docker registry credentials, and AWS access keys).
   - Review audit logs for unexpected workflow runs or runner registrations.
3. **Local Developer Secrets**:
   - Invalidate Git credentials, Docker registry tokens, and NPM automation tokens.
   - Regenerate all API keys stored in local `.env` files (OpenAI, Anthropic, database connections).

---

## Architectural Lessons: Protecting AI Engineering Workflows

The compromise of `agent-framework` follows a broader pattern of threat actors targeting developer machines and AI frameworks to leap into enterprise cloud environments.

### 1. Enforce Hash Pinning with `pip-tools` or `uv`
Never allow production pipelines or developer setups to resolve unpinned dependencies. Always generate cryptographic lockfiles:

```bash
# Using uv or pip-compile with hash verification
pip-compile --generate-hashes requirements.in
```

### 2. Restrict IMDS Access on Cloud Runners
Virtual machines and CI/CD agents running in cloud environments (AWS, Azure, DigitalOcean) must restrict access to the local instance metadata service:
- On AWS, enforce **IMDSv2** with a hop limit of `1` (`HttpPutResponseHopLimit=1`) so that Docker containers cannot reach the host metadata IP.
- On Azure, configure firewall or `iptables` rules preventing unprivileged user processes from querying `169.254.169.254`.

```bash
# Example iptables rule blocking unprivileged users from accessing IMDS
sudo iptables -A OUTPUT -m owner ! --uid-owner 0 -d 169.254.169.254 -j DROP
```

---

## Primary Sources & References

- **The Hacker News**: [Attackers Compromise Microsoft's Agent Framework PyPI Package to Steal Cloud Credentials](https://thehackernews.com/2026/11/attackers-compromise-microsofts-agent.html)
- **BleepingComputer**: [Microsoft Agent Framework PyPI Compromise: Cloud Credential Harvesting](https://www.bleepingcomputer.com/news/security/)
- **Dark Reading**: [Agentic AI Ecosystem Emerges as Prime Target for Supply Chain Intrusions](https://www.darkreading.com/)
- **Socket Security Research**: [Malicious agent-framework Releases Exfiltrate Cloud Secrets via Python Startup Hooks](https://socket.dev/blog)
- **Endor Labs Analysis**: [How .pth Files Turn Package Installation into Immediate Arbitrary Execution](https://www.endorlabs.com/blog)
- **SafeDep Research**: [Token Minting and Managed Identity Abuse in agent-framework Compromise](https://safedep.io/)
- **OX Security**: [Securing CI/CD Pipelines Against Compromised AI Agent Packages](https://www.ox.security/)

---

## Strengthen Your AI Development and Cloud Security Posture

As AI agents and autonomous workflows become standard components of software architecture, securing developer environments, pipeline secrets, and cloud metadata endpoints is critical. Third-party packages cannot be trusted blindly, and CI/CD runners must be treated as perimeter boundaries.

I work with software teams and growing companies to architect zero-trust cloud pipelines, conduct rigorous code and package security audits, and harden full-stack AI applications against supply chain risks.

Explore my [AI Application Development & Security Auditing](/services/ai-website-review/), discover my [Backend Development Services](/services/backend-development/), or [reach out for a cloud security review](/contact/).
