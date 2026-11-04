---
title: "LLMjacking Alert: How Leaked Cloud Credentials and LiteLLM Flaws Drive $1M in Fraudulent AI Infrastructure Charges"
description: "Google Cloud and Mandiant have sounded the alarm on widespread LLMjacking campaigns where threat actors hijack cloud environments, exploit LiteLLM flaws (CVE-2026-40217), and route millions of unauthorized frontier AI tokens through illicit proxy networks. Here is how to detect, audit, and harden your cloud AI infrastructure."
date: 2026-11-04
category: "Hosting & DevOps"
draft: false
image: "/images/blog/llmjacking-cloud-credentials-ai-infrastructure-charges.webp"
imageAlt: "Tactile 3D editorial illustration of a midnight-navy cloud server cluster tower with fine amber circuit pathways and a cryptographic shield lock blocking rogue LLM token theft on warm cream."
---

Cloud security teams and AI platform engineers face a sharp escalation in high-velocity resource hijacking. Google's Threat Intelligence Group (GTIG) and Mandiant have released a joint advisory disclosing an alarming spike in **"LLMjacking"** attacks—campaigns where threat actors systematically compromise enterprise cloud environments to siphon generative AI compute and hosted foundation model APIs.

Unlike traditional cryptomining, which maxes out host CPUs or GPUs to mint pennies on the dollar, LLMjacking directly burns through high-tier enterprise AI API quotas—such as Anthropic Claude 3.5 Sonnet, OpenAI GPT-4o, Google Vertex AI, and AWS Bedrock. In multiple analyzed incidents, victim organizations recorded fraudulent cloud consumption exceeding **$100,000 in a single 24-hour window**, with cumulative losses surpassing **$1,000,000** before rogue access could be revoked.

Understanding how threat actors identify targets, route requests, and monetize stolen tokens is essential for any engineering team deploying AI agents, hosted models, or cloud-native developer pipelines.

---

## Threat Landscape: UNC6993 & The Token Routing Syndicates

Google's intelligence highlights two coordinating operational clusters acting in tandem: reconnaissance specialists who harvest valid cloud credentials and proxy syndicate operators who package stolen access into commercial subscription services.

```text
[ Threat Cluster UNC6993 ]
        │
        ├─► (1) Initial Reconnaissance:
        │       • Scans public GitHub repositories for leaked cloud API keys
        │       • Exploits unauthenticated LiteLLM instances (CVE-2026-40217)
        │       • Extracts GCP Service Account keys & AWS IAM tokens from CI/CD
        │
        ▼
[ Compromised Cloud Workload / Account ]
        │
        ├─► (2) Persistence & Backdoors:
        │       • Deploys Node.js reverse proxies ("D1337-KAIROS")
        │       • Injects authorized SSH keys and backdoor IAM roles
        │
        ▼
[ Illicit "LLM Mixer" Services (e.g., jet-night[.]com, newapi[.]pro) ]
        │
        ├─► (3) Monetization & Traffic Blasting:
        │       • Sells "Unlimited Frontier Model Access" for $60/month
        │       • Blasts >1,000 requests/sec across stolen upstream victim accounts
        │
        ▼
[ Victim Enterprise Cloud Invoice: $100K+/Day ]
```

### The "LLM Mixer" Business Model
Once threat actors secure active cloud credentials (or deploy unauthorized reverse proxy endpoints), they rarely use the compute solely for their own prompts. Instead, they sell access to underground **"LLM mixers"**—services designed to mimic legitimate API aggregators.

Platforms like `jet-night[.]com` and `newapi[.]pro` market "unlimited frontier model access" for as little as $50 to $60 per month. Behind the scenes, their routing gateways load-balance customer prompts across pools of stolen enterprise API keys. In one documented case, an attacker routed **over 500,000 LLM API calls in less than eight hours** through a single hijacked account, passing nearly $1,000,000 in token costs to the victim.

---

## Primary Initial Access Vectors

Threat actors leverage three primary attack surfaces to penetrate cloud environments and harvest AI credentials:

### 1. Insecure AI Gateways: The LiteLLM RCE (CVE-2026-40217)
Many engineering teams deploy proxy gateways like LiteLLM to standardize calls across multi-model providers. Attackers actively exploit **CVE-2026-40217**, a critical vulnerability in LiteLLM's custom-code guardrail evaluation endpoint. Unauthenticated remote callers can supply arbitrary Python code within a payload to achieve remote command execution (RCE) on the host server.

From the compromised container, attackers dump environment variables, query instance metadata services (IMDSv2 on AWS, metadata.google.internal on GCP), and capture root cloud IAM tokens.

### 2. Leaked CI/CD Secrets & Hardcoded Keys
Automated scanners continuously sweep public code registries and container registries for long-lived credentials, including:
- Cloud provider root tokens (`AWS_SECRET_ACCESS_KEY`, `GOOGLE_APPLICATION_CREDENTIALS`).
- Direct model provider keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`).
- Pipeline tokens embedded in public GitHub Actions workflows or Docker image layers.

### 3. Rogue Reverse Proxies ("D1337-KAIROS")
When attackers gain shell access to an ephemeral Kubernetes pod or virtual machine, they frequently deploy customized Node.js proxy bundles (tracked under the persona **D1337-KAIROS**). These proxies expose internal cloud IAM endpoints to the public Internet through Cloudflare tunnels or dynamic DNS, transforming internal compute into globally accessible token relays.

---

## Indicators of Compromise & Audit Queries

Because LLMjacking requests use valid credentials, web application firewalls (WAFs) and standard rate limiters often fail to flag them. Detection requires analyzing request velocity, prompt token consumption, and anomalous geographic ingress.

### High-Fidelity IoCs
| Artifact / Indicator | Type | Threat Association |
| :--- | :--- | :--- |
| `jet-night[.]com` | Domain | Illicit token routing marketplace |
| `newapi[.]pro` | Domain | LLM proxy aggregation platform |
| `D1337-KAIROS` | Node.js Bundle / User-Agent | Rogue reverse proxy framework |
| Sudden request velocity spikes | Metric | $>500$ req/sec sustained from distributed client IPs |
| Uniform prompt sizes | Metric | Automated benchmark/scraping workloads |

### CloudTrail Detection Query (AWS Athena / Bedrock)
To detect uncharacteristic surges in Bedrock foundation model invocations:

```sql
SELECT 
    eventName,
    userIdentity.arn AS caller_arn,
    sourceIPAddress,
    count(*) AS call_count,
    sum(cast(json_extract_scalar(responseElements, '$.usage.totalTokens') AS bigint)) AS total_tokens
FROM cloudtrail_logs
WHERE eventSource = 'bedrock.amazonaws.com'
  AND eventTime > now() - interval '24' hour
GROUP BY eventName, userIdentity.arn, sourceIPAddress
HAVING count(*) > 10000
ORDER BY call_count DESC;
```

### GCP Cloud Logging Query (Vertex AI / Gemini)
To identify anomalous calls to Vertex AI prediction endpoints:

```text
resource.type="aiplatform.googleapis.com/Endpoint"
protoPayload.methodName="google.cloud.aiplatform.v1.PredictionService.Predict"
severity>=INFO
```

Filter by `protoPayload.authenticationInfo.principalEmail` and group by caller IP to flag unknown egress IPs or service accounts invoking models outside typical operating windows.

---

## Actionable Defense: Hardening Cloud AI Infrastructure

Protecting your organization against LLMjacking requires shifting from reactive billing alerts to proactive architectural controls.

### 1. Enforce Explicit IAM Denies on Foundation Model APIs
Never grant broad contributor, editor, or administrator roles to developer workstations or CI/CD pipelines. Explicitly deny cloud AI model endpoints on identities that do not require them.

On Google Cloud, ensure default compute service accounts have the following IAM permissions explicitly removed:
- `aiplatform.endpoints.predict`
- `aiplatform.models.predict`

On AWS, attach a Service Control Policy (SCP) or permission boundary:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RestrictBedrockFrontierModels",
      "Effect": "Deny",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "*",
      "Condition": {
        "StringNotLike": {
          "aws:PrincipalArn": [
            "arn:aws:iam::*:role/ai-production-workload-role"
          ]
        }
      }
    }
  ]
}
```

### 2. Implement Real-Time Hard Spending Caps & Kill Switches
Cloud providers typically offer billing alerts that notify administrators via email when thresholds are crossed. In an attack generating $4,000 every hour, email alerts arrive far too late.

Configure automated **billing circuit breakers**:
- **AWS Budgets Action**: Automatically attach a restrictive IAM policy to freeze model invocation roles when budget thresholds exceed 120% of expected daily spend.
- **GCP Pub/Sub Billing Disabler**: Wire Google Cloud Billing budget notifications to a Cloud Function that temporarily disables billing on the affected project or revokes API keys when an anomaly triggers.

### 3. Patch and Restrict AI Gateway Frameworks
If running LiteLLM, vLLM, or Langflow in your stack:
- Upgrade LiteLLM immediately to the latest patched release to neutralize CVE-2026-40217.
- Never expose management interfaces or guardrail endpoints directly to the public web. Bind them strictly to `127.0.0.1` and route ingress exclusively through authenticated reverse proxies enforcing mutual TLS (mTLS) or OAuth2/OIDC.
- Restrict egress traffic from AI application containers using Kubernetes NetworkPolicies or cloud security groups, ensuring containers cannot connect outbound to untrusted reverse proxies.

---

## Primary Sources & References

- **BleepingComputer**: [Google: LLMjacking attacks rack up $1 million in cloud AI charges](https://www.bleepingcomputer.com/news/security/google-llmjacking-attacks-rack-up-1-million-in-cloud-ai-charges/)
- **Dark Reading**: [LLMjacking Emerges as Thriving Cybercriminal Enterprise](https://www.darkreading.com/cloud-security/llmjacking-thriving-cybercriminal-enterprise)
- **Google Threat Intelligence Group (GTIG)**: Threat Research & Analysis on Cluster UNC6993
- **NIST NVD**: [CVE-2026-40217 - LiteLLM Custom Code Guardrail Execution Flaw](https://nvd.nist.gov/)
- **DigitalOcean Engineering**: [Product Security in the Post-AI Era & Guardrails](https://www.digitalocean.com/blog/securing-agentic-software-development)

---

## Secure Your Cloud Infrastructure & AI Deployments

Experiencing uncharacteristic surges in cloud API utilization, or planning to deploy frontier LLM models within production infrastructure? I provide comprehensive cloud architecture audits, automated IAM hardening, and DevOps observability to ensure your infrastructure remains resilient against modern credential hijacking.

Explore my [DevOps & Cloud Engineering Services](/services/devops/) or reach out directly through the [contact page](/contact/) to discuss securing your deployments.
