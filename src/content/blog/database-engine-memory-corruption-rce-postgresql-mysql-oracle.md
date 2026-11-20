---
title: "How Low-Privilege Database Grants Lead to Engine RCE: Auditing PostgreSQL, MySQL, Oracle, and ClickHouse (CVE-2026-116331)"
description: "New research reveals how standard SQL privileges like TEMPORARY tables allow unprivileged database users to trigger C/C++ memory-corruption bugs in query planners and binary decoders. Here is an analysis of CVE-2026-116331, MySQL CVE-2026-101786, Oracle unauthenticated chains, and fleet hardening steps."
date: 2026-11-20
category: "Backend & APIs"
draft: false
image: "/images/blog/database-engine-memory-corruption-rce-postgresql-mysql-oracle.webp"
imageAlt: "Tactile 3D editorial illustration of sculpted midnight-navy database cylinders and relational query tables linked by fine amber circuits, protected by an interlocking cryptographic access shield on warm cream."
---

Most database security audits focus exclusively on Data Control Language (DCL): ensuring least-privilege `GRANT SELECT` or `GRANT INSERT` privileges, restricting application roles from touching sensitive columns, and masking personally identifiable information (PII). We operate under the assumption that if an account cannot read application tables, it cannot compromise the underlying server.

Groundbreaking research released by Depthfirst security researcher **Zheng Yu** shatters this assumption. The research demonstrates that database access controls govern *logical data access*, not the complex, memory-unsafe C and C++ engines responsible for parsing, planning, and executing queries. 

By leveraging ubiquitous low-privilege grants—specifically PostgreSQL's default `TEMPORARY` privilege and standard temporary table creation rights in MySQL and ClickHouse—an attacker with minimal database access can trigger memory corruption within the database engine itself, escaping the SQL sandbox to execute arbitrary code as the operating system user running the database.

Simultaneously, Oracle Database was found vulnerable to an unauthenticated Remote Code Execution (RCE) chain combining Oracle Text and Oracle REST Data Services (ORDS).

Here is a technical teardown of the exploit mechanics, the affected version landscape, and actionable steps to audit and harden your production database fleet.

---

## Technical Breakdown: From SQL Grants to Operating System Shell

Database management systems are amongst the largest C/C++ codebases in production. When a client executes a query, the engine parses ASTs, plans execution trees, transforms subqueries, allocates temporary memory contexts, and processes custom types.

```text
[ Low-Privilege Database User ]
              │
              │ (1) Sends valid SQL commands within temporary schema
              ▼
[ PostgreSQL / MySQL / ClickHouse Query Engine ]
              │
              │ (2) Memory-unsafe C/C++ parser & optimizer processes query
              ▼
[ Engine Memory Corruption ]
              │
              ├─► PostgreSQL (CVE-2026-116331): Type-confusion in temp objects
              ├─► MySQL (CVE-2026-101786): Query optimizer heap overflow
              ├─► ClickHouse: Binary row format integer-overflow write
              └─► Oracle (CVE-2026-114819 + CVE-2026-91609): ORDS GraphQL + Text chain
              ▼
[ Execution Hijack in Database Daemon Context (`postgres` / `mysql`) ]
              │
              │ (3) Spawns OS shell / writes shared libraries
              ▼
[ Full Database Server & Host Takeover ]
```

### 1. PostgreSQL: CVE-2026-116331 (Type-Confusion via Temporary Schemas)
In PostgreSQL, every newly created database role is granted the `TEMPORARY` (or `TEMP`) privilege on databases by default. This grant allows users to create temporary tables, temporary views, and custom session-scoped data types in their own private temporary schema (`pg_temp_NNN`).

Under **CVE-2026-116331**, an attacker creates custom composite objects and temporary functions within their session's temporary schema. When PostgreSQL's query optimizer evaluates expressions referencing these temporary objects alongside built-in catalog routines, a subtle type-confusion vulnerability occurs during memory allocation in `Node` struct evaluations. 

Because the attacker controls the internal memory representation of the temporary struct, they can corrupt pointer offsets in the engine's memory pool (`MemoryContext`), diverting code execution to attacker-controlled instructions within the `postgres` operating system process. The attacker never touches a single production table to achieve full OS-level control.

### 2. MySQL Server & Cluster: CVE-2026-101786 (Optimizer Heap Corruption)
MySQL Server and MySQL Cluster versions 26.7.0 through 26.7.1 suffer from a high-severity heap corruption flaw in the query optimization subsystem (**CVE-2026-101786**). While vendor advisories initially categorized this issue as requiring elevated administrative privileges, the Depthfirst research proved that an account granted solely `CREATE TEMPORARY TABLES`—without any `SELECT` permissions on schema tables—can reach the vulnerable optimizer path.

By formulating queries with deeply nested derived tables and window functions backed by temporary in-memory tables (`MEMORY` or `TempTable` storage engines), the query optimizer miscalculates buffer allocations during cost-based plan generation, resulting in controllable heap corruption and code execution within `mysqld`.

### 3. Oracle Database: Unauthenticated Web-to-Engine Chain (CVE-2026-114819 & CVE-2026-91609)
While PostgreSQL and MySQL require an initial database login, the Oracle vulnerability chain requires **zero database credentials**.

This attack chains two separate vulnerabilities:
1. **CVE-2026-91609**: An access control and input-validation flaw in the GraphQL interface of **Oracle REST Data Services (ORDS)** (versions 24.2.0 through 26.2.1), exposing unauthenticated endpoints.
2. **CVE-2026-114819 (CVSS 9.9)**: A critical memory corruption flaw in **Oracle Text** indexing routines within Oracle Database.

By sending structured GraphQL requests to an externally reachable ORDS web endpoint, an unauthenticated attacker can pipe crafted search queries into the backend Oracle Text parsing engine. The engine fails to bounds-check variable-length tokens, triggering memory overwrite and executing code before any authentication challenge is evaluated.

### 4. ClickHouse: Integer-Overflow in Binary Row Deserialization
ClickHouse was found vulnerable to an integer overflow during the deserialization of binary row formats. An authenticated user can configure session-level parameters, setting `format_binary_max_string_size = 0`. When reading crafted binary streams, the zero-value leads to integer wrap-around during dynamic buffer allocation, permitting out-of-bounds writes on the heap. This flaw was resolved in ClickHouse builds 26.9+ and backported to maintenance branches.

---

## Affected Systems & Fix Matrix

| Database Engine | Identifier | Affected Versions | Patched Release |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | CVE-2026-116331 | Versions prior to 18.7, 17.12, 16.16, 15.20, 14.25 | 18.7, 17.12, 16.16, 15.20, 14.25 |
| **MySQL Server / Cluster** | CVE-2026-101786 | 26.7.0 through 26.7.1 | Update via Oracle October 2026 CPU |
| **Oracle Database (Oracle Text)** | CVE-2026-114819 | 19.3–19.32, 21.3–21.24, 23.4.0–23.26.3 | Oracle November 2026 Security Alert |
| **Oracle REST Data Services** | CVE-2026-91609 | 24.2.0 through 26.2.1 | Oracle October 2026 CPU |
| **ClickHouse** | Open-source (No CVE) | 26.7.5.10 and unpatched builds | 26.9+, 26.8.3.41, 26.7.7.30, 26.6.5.55, 26.3.32.8 |

---

## Action Plan: Auditing and Hardening Your Databases

### Step 1: Apply Engine Patches Immediately

#### Ubuntu / Debian (PostgreSQL Official APT Repo)
```bash
sudo apt-get update
sudo apt-get --only-upgrade install postgresql-client-16 postgresql-16
# Verify running version
psql --version
sudo systemctl restart postgresql
```

#### RHEL / Rocky Linux (PostgreSQL)
```bash
sudo dnf check-update postgresql16-server
sudo dnf upgrade postgresql16-server
sudo systemctl restart postgresql-16
```

#### MySQL Upgrades
Check your running MySQL daemon build:
```bash
mysql --version
```
If operating on versions 26.7.0 or 26.7.1, apply Oracle's quarterly CPU updates or vendor package updates immediately.

---

### Step 2: Revoke Default `TEMPORARY` Privileges in PostgreSQL

In PostgreSQL, every user has the `TEMP` privilege by default because it is granted to the `PUBLIC` pseudo-role at database creation. Unless an application strictly requires session temporary tables, revoke this grant across all databases:

```sql
-- Connect to each database as superuser (postgres)
REVOKE TEMPORARY ON DATABASE your_database_name FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
```

To verify which roles currently hold `TEMPORARY` permissions:
```sql
SELECT datname, datacl 
FROM pg_database 
WHERE datname = 'your_database_name';
```
Look for `T` in the ACL privileges string. If present for `=Tc/postgres` (PUBLIC), revoke it.

If a specific application service account genuinely requires temporary table support, grant it explicitly rather than relying on wildcard `PUBLIC` access:
```sql
GRANT TEMPORARY ON DATABASE your_database_name TO app_worker_role;
```

---

### Step 3: Audit MySQL User Grants

Review all MySQL accounts to ensure non-administrative users do not possess global or schema-wide temporary table creation privileges:

```sql
-- Check global grants
SELECT user, host, Create_tmp_table_priv 
FROM mysql.user 
WHERE Create_tmp_table_priv = 'Y';

-- Check database-specific grants
SELECT user, host, db, Create_tmp_table_priv 
FROM mysql.db 
WHERE Create_tmp_table_priv = 'Y';
```

Revoke unnecessary privileges from application and analytics roles:
```sql
REVOKE CREATE TEMPORARY TABLES ON *.* FROM 'reporting_user'@'%';
REVOKE CREATE TEMPORARY TABLES ON your_app_db.* FROM 'reporting_user'@'%';
FLUSH PRIVILEGES;
```

---

### Step 4: Isolate Oracle ORDS and REST Endpoints

Because the Oracle exploit chain requires no login credentials, ensure that Oracle REST Data Services (ORDS) endpoints are never exposed directly to the public internet without an API gateway or Web Application Firewall (WAF) enforcing strict path controls:

1. Update ORDS to version 26.2.2 or higher.
2. Restrict access to `/ords/_/graphql` and administrative endpoints to internal VPC CIDR ranges.
3. Apply Oracle's November 2026 Security Alert patch for Oracle Text (`cspunov2026`).

---

### Step 5: Enforce OS-Level Sandboxing for Database Daemons

Even if an unknown engine zero-day allows memory corruption, OS-level isolation prevents an attacker from pivoting to the host or stealing secrets:

1. **Systemd Security Directives**: Configure PostgreSQL and MySQL systemd service units with kernel sandboxing:
   ```ini
   # /etc/systemd/system/postgresql.service.d/override.conf
   [Service]
   ProtectSystem=strict
   ProtectHome=true
   NoNewPrivileges=true
   PrivateTmp=true
   ProtectKernelTunables=true
   ProtectControlGroups=true
   RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
   ```
2. **Container Seccomp Profiles**: If running databases in Docker or Kubernetes, never run containers with `--privileged`. Enforce default seccomp profiles and set `readOnlyRootFilesystem: true` with dedicated temporary mount points for database data directories.

---

## Primary Sources & References

- [The Hacker News: Researcher Demonstrates Database RCE Exploits Affecting PostgreSQL, MySQL and Oracle](https://thehackernews.com/2026/11/researcher-demonstrates-database-rce.html)
- [Depthfirst Research: Narrow Grants, Wide Engines (Technical Analysis by Zheng Yu)](https://depthfirst.com/research/narrow-grants-wide-engines)
- [PostgreSQL Security Advisory: CVE-2026-116331](https://www.postgresql.org/support/security/CVE-2026-116331/)
- [Oracle Critical Patch Update & Security Alert Advisory (cspunov2026)](https://www.oracle.com/security-alerts/cspunov2026.html)
- [MySQL Security Advisory October 2026](https://dev.mysql.com/community/security/advisories/2026-10-20/)
- [ClickHouse Open-Source Fix (PR #115702)](https://github.com/ClickHouse/ClickHouse/pull/115702)

---

## Need Assistance Hardening Your Database Infrastructure?

Securing multi-tenant database clusters, auditing role permissions, and managing zero-downtime upgrades requires hands-on infrastructure experience. 

If you are planning an upgrade roadmap or need a comprehensive architecture and security audit for your PostgreSQL, MySQL, or cloud database clusters, explore my [DevOps and Database Management Services](/services/) or [get in touch directly](/contact/) to discuss your environment.
