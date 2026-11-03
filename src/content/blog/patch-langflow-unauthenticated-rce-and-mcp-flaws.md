---
title: "Patch Langflow Immediately: Critical Unauthenticated RCE and MCP Tool Exposure (CVE-2026-93680 & CVE-2026-110186)"
description: "IBM and the Langflow project have disclosed critical vulnerabilities (CVSS 9.8) in Langflow OSS enabling unauthenticated remote attackers to bypass authentication, enumerate Model Context Protocol (MCP) tools, and execute arbitrary code on AI orchestration servers. Here is how to audit and upgrade to 1.13.0."
date: 2026-11-02
category: "AI & Development"
draft: false
image: "/images/blog/patch-langflow-unauthenticated-rce-and-mcp-flaws.webp"
imageAlt: "Tactile 3D editorial illustration of an AI neural workflow node graph in midnight navy and slate blue with interlocking amber hexagonal security gates and shielded code blocks on warm cream."
---

IBM and the Langflow open-source project have disclosed multiple critical vulnerabilities affecting Langflow—a widely adopted visual orchestration framework for building Large Language Model (LLM) agents and automated AI workflows.

The most severe flaws, tracked as **CVE-2026-93680** and **CVE-2026-110186** (both carrying a **CVSS score of 9.8**), allow remote attackers with no credentials to bypass authentication controls and execute arbitrary operating system commands on the hosting server. A public exploit module targeting the authentication bypass has already been published in the Metasploit Framework, signaling that active reconnaissance and weaponization against exposed AI servers is imminent.

The vulnerabilities affect all Langflow releases from **1.0.0 through 1.12.8**. Complete remediation requires updating to **Langflow 1.13.0**, which fundamentally restructures default authentication mechanisms and patches Model Context Protocol (MCP) exposure.

---

## Vulnerability Overview & Impact Matrix

IBM's security advisory covers four distinct vulnerabilities discovered within Langflow's core engine, API endpoints, and agent assistant components:

| CVE Identifier | CVSS v3.1 | Authentication Required | Vulnerability Description & Impact |
| :--- | :--- | :--- | :--- |
| **CVE-2026-93680** | **9.8 (Critical)** | **None** | Improper authentication handling allowing remote unauthenticated bypass of security controls and Model Context Protocol (MCP) session initiation. |
| **CVE-2026-110186** | **9.8 (Critical)** | **None** | Improper control of code generation, allowing remote attackers to run arbitrary system code during flow evaluation. |
| **CVE-2026-110193** | **8.8 (High)** | Low-Privileged Account | Command injection flaw in the Agentic Assistant allowing malicious component code submission that executes operating system commands. |
| **CVE-2026-110192** | **6.5 (Medium)** | Authenticated Account | Insufficient protection of stored API credentials and environment secrets within workflow exports. |

---

## Technical Deep Dive: MCP Exposure & Auto-Login Insecurity

Langflow bridges human developers with autonomous AI agents by translating drag-and-drop node configurations into executable Python code. In recent releases, Langflow integrated the **Model Context Protocol (MCP)**, allowing external AI systems to query Langflow as an MCP server and invoke flows as specialized tools.

```text
[ Remote Unauthenticated Attacker ]
                │
                │ (1) Sends unauthenticated HTTP request to MCP endpoint
                ▼
[ Langflow Server (:7860) ]
        │
        ├─► LANGFLOW_AUTO_LOGIN Check:
        │   Default configuration evaluates to TRUE
        │   Session instantly elevated to Superuser / Admin!
        │
        ├─► MCP Tool Enumeration (CVE-2026-93680):
        │   Lists all internal AI tools, prompt templates, and connected data sources
        │
        └─► Dynamic Component Execution (CVE-2026-110186):
            Submits arbitrary Python execution payload into flow runner
            OS command execution achieved in context of host user!
```

### 1. Insecure Default: The `LANGFLOW_AUTO_LOGIN` Trap

In versions prior to 1.13.0, Langflow shipped with automatic login enabled by default in its configuration services:

```python
# langflow/services/settings/auth.py (v1.12.8)
class AuthSettings(BaseSettings):
    LANGFLOW_AUTO_LOGIN: bool = True  # Default was TRUE
```

The codebase documentation intended this flag purely for local sandbox development. However, when deployed using standard Docker containers (`docker run -p 7860:7860 langflowai/langflow`) or hosted on public VPS instances without an overarching reverse proxy, the server automatically treated incoming HTTP connections as superuser sessions.

Even when authentication was supposedly configured, IBM identified an incomplete remediation in earlier point releases that allowed attackers to forge or bypass the auto-login security boundary.

### 2. Model Context Protocol (MCP) Tool Enumeration

Through CVE-2026-93680, an attacker can connect directly to Langflow's MCP server socket without credentials. A Metasploit auxiliary module (`langflow_auth_bypass_cve_2026_93680.rb`) demonstrates this vulnerability by:
1. Negotiating an MCP initialization handshake without bearer tokens.
2. Establishing an active session.
3. Calling `tools/list` to enumerate all custom Python functions, prompt templates, and database connection strings registered in the workspace.

This exposure reveals proprietary workflows, database credentials, vector database endpoints, and OpenAI/Anthropic API keys stored inside flow properties.

### 3. Remote Code Execution via Flow Evaluation (CVE-2026-110186)

Once an attacker gains unauthenticated session access, they can trigger Langflow's dynamic code runner. Langflow allows custom Python components to execute arbitrary code blocks to transform data between LLM prompts and vector retrievers.

Because code generation lacked strict sandbox isolation or AST verification, unauthenticated callers can trigger custom component compilation that spawns sub-shells, downloads reverse shells, or exfiltrates host environment variables (`AWS_SECRET_ACCESS_KEY`, `DATABASE_URL`, etc.).

---

## Step-by-Step Upgrade Guide to Langflow 1.13.0

Langflow 1.13.0 (released late October 2026) disables auto-login by default, enforces strict authentication guards across all MCP endpoints, and restricts arbitrary code compilation. Follow this procedure to upgrade cleanly without risking data loss.

### 1. Create a Snapshot of Persistent Data

Before running package updates, back up the SQLite database or Postgres state and secret keys. If using Docker:

```bash
# Locate and copy the persistent volume directory
docker stop langflow-instance
sudo cp -r /var/lib/docker/volumes/langflow-data/_data /var/backups/langflow_backup_$(date +%F)
```

If running via Python virtual environment:

```bash
# Default SQLite database location is ~/.cache/langflow or ~/.langflow
cp -r ~/.langflow/langflow.db /var/backups/langflow_db_$(date +%F).db
```

> [!WARNING]
> Do NOT reinstall or purge your Langflow environment from scratch. Langflow's migration guidance notes that removing existing database schemas can permanently delete custom flows and component definitions.

### 2. Upgrade the Python Package or Container

#### For Python Virtual Environments / PyPI:

```bash
# Upgrade to 1.13.0 explicitly
pip install --upgrade "langflow==1.13.0"

# Verify installed release
python3 -c "import langflow; print(langflow.__version__)"
```

#### For Docker Deployments:

Update your `docker-compose.yml` or container launch script:

```yaml
services:
  langflow:
    image: langflowai/langflow:1.13.0
    restart: always
    ports:
      - "127.0.0.1:7860:7860" # Bind to localhost only!
    environment:
      - LANGFLOW_AUTO_LOGIN=false
      - LANGFLOW_SUPERUSER=admin
      - LANGFLOW_SUPERUSER_PASSWORD=YourStrongGeneratedPasswordHere
      - LANGFLOW_SECRET_KEY=Your64CharacterRandomHexSecretKeyHere
    volumes:
      - langflow_data:/app/langflow
```

Pull the image and recreate the container:

```bash
docker compose pull
docker compose up -d
```

### 3. Migrate Superuser Credentials

Because Langflow 1.13.0 disables `LANGFLOW_AUTO_LOGIN` by default, ensure you have set valid superuser credentials to access the administrative dashboard:

```bash
# If running CLI directly, set credentials before starting
export LANGFLOW_AUTO_LOGIN=false
export LANGFLOW_SUPERUSER="admin@yourdomain.com"
export LANGFLOW_SUPERUSER_PASSWORD="SecureComplexPassword123!"

langflow run --host 127.0.0.1 --port 7860
```

---

## Infrastructure Hardening Checklist for AI Applications

Beyond updating Langflow, adopt the following zero-trust practices for all self-hosted AI workflow tools (Langflow, Flowise, Dify, Ollama):

1. **Never Bind Directly to Public Interfaces (`0.0.0.0`)**: Configure the application server to listen exclusively on `127.0.0.1`.
2. **Place Behind an Authenticating Reverse Proxy**: Enforce Mutual TLS, Cloudflare Zero Trust Access, or HTTP Basic Auth at the Nginx/Caddy ingress level before traffic touches the AI application.
3. **Run in Unprivileged Containers with Dropped Capabilities**:
   ```yaml
   security_opt:
     - no-new-privileges:true
   cap_drop:
     - ALL
   read_only: true
   ```
4. **Rotate Exposed API Tokens**: If your Langflow server was internet-facing between version 1.0.0 and 1.12.8, assume your stored API keys (Anthropic, OpenAI, Pinecone, LangSmith) may have been enumerated via MCP. Rotate these secrets immediately.

---

## Primary Sources and Technical References

- [IBM Security Bulletin: Langflow OSS Affected by Multiple Vulnerabilities](https://www.ibm.com/support/pages/security-bulletin-langflow-oss-affected-multiple-vulnerabilities-2) — Official disclosure and CVSS scoring details.
- [The Hacker News: Critical Langflow Flaws Could Let Unauthenticated Attackers Run Code on Servers](https://thehackernews.com/2026/11/critical-langflow-flaws-could-let.html) — Threat reporting and vulnerability analysis.
- [Langflow GitHub Release 1.13.0](https://github.com/langflow-ai/langflow/releases/tag/v1.13.0) — Official release notes and patch details.
- [Rapid7 Metasploit Module (langflow_auth_bypass_cve_2026_93680)](https://github.com/rapid7/metasploit-framework/blob/master/modules/auxiliary/gather/langflow_auth_bypass_cve_2026_93680.rb) — Public verification exploit for MCP authentication bypass.

---

Building custom AI applications, integrating LLM orchestration pipelines, or securing self-hosted AI servers? Explore our [AI and full-stack development services](/services/ai-development/), check our [backend API architecture capabilities](/services/backend-development/), or [contact us for infrastructure consulting](/contact/).
