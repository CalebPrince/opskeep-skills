# Control domains

Every control in `security-baseline.yaml` carries one `domain`. Schema 2.2 requires each domain listed for the project's tier to be **addressed**: at least one active control in that domain, or a `NOT_APPLICABLE` control with a reason. In `DRAFT` a missing domain is a warning; from `REVIEW_REQUIRED` it is an error.

| Tier | Domains that must be addressed |
|---|---|
| LOW | `INPUT`, `SECRETS`, `CONFIG`, `SUPPLY_CHAIN`, `LOGGING`, `DEPLOY`, `GOVERNANCE` |
| MEDIUM | LOW + `AUTH`, `AUTHZ`, `SESSION`, `API`, `CRYPTO`, `DATA`, `ERROR_HANDLING`, `FRONTEND` |
| HIGH / CRITICAL | MEDIUM + `FILE`, `RECOVERY`, `AI_AGENT` |
| Any tier | `AI_AGENT` as soon as a component has `ai_capability: true` or an `AGENT` identity exists |

A `NOT_APPLICABLE` control still needs a reason a reviewer can check ("no file uploads exist; the form accepts text only"). It is cheap at LOW tier and is how the baseline proves the domain was considered rather than forgotten.

The questions below are the minimum prompts per domain. They are the "how" behind the crosswalk's COVERED entries. Answer them in the control's `requirement` and `acceptance` text, not as a separate document. Standards references go in the control's `refs` list (see `standards-crosswalk.yaml`).

| Domain | Address at least |
|---|---|
| `AUTH` | Credential storage and hashing; brute-force and credential-stuffing resistance; MFA and account recovery; federated sign-in (OAuth/OIDC) flows, redirect and token validation; service and workload authentication |
| `AUTHZ` | Default deny; object, function, tenant and admin-level checks on the server; SSRF, open-redirect and path-based access; the identity/permission matrix; authentication never implies authorization |
| `SESSION` | Session or token creation, expiry, rotation, revocation and replay; cookie attributes; CSRF; validation of self-contained tokens (signature, audience, expiry, algorithm pinning) |
| `INPUT` | Server-side validation; output encoding; injection classes (SQL/NoSQL/OS/template/header/prompt); deserialization; canonicalization |
| `API` | Schema and contract enforcement; rate limits, idempotency and replay protection; business-logic abuse; mass assignment; webhooks; CORS |
| `FILE` | Upload type, size and content checks; storage location and access; path traversal; archive bombs; download authorization; server-side fetches of user-supplied URLs |
| `FRONTEND` | CSP, XSS, clickjacking, third-party scripts and integrity pinning, client-side storage, no secrets in client bundles |
| `CRYPTO` | Algorithm and key choices; key management and rotation; TLS configuration and transport security; at-rest encryption; randomness |
| `SECRETS` | Where secrets live, who can read them, rotation and revocation; scanning; no secrets in repositories, client code, logs or prompts |
| `CONFIG` | Secure defaults; hardening; security headers; environment separation; debug and verbose modes off; infrastructure drift |
| `DATA` | Classification, minimization, retention and deletion; privacy and regulatory duties (`project.regulatory_context`); processors and cross-border transfers; backup encryption |
| `ERROR_HANDLING` | Fail-closed behavior on exceptions; safe error messages; timeouts and resource exhaustion; behavior when a dependency is down |
| `LOGGING` | Security-relevant events; log integrity and retention; no sensitive data in logs; alert routing and ownership |
| `SUPPLY_CHAIN` | Lockfiles; vulnerability gate; SBOM; build provenance and signing; dependency-confusion and typosquatting defenses; pinned CI actions; update automation |
| `DEPLOY` | CI/CD permissions; protected branches and environments; required approvals; artifact integrity; rollback |
| `RECOVERY` | Backup, restore, rollback, incident response; isolation and credential revocation; links to the `recovery` block |
| `AI_AGENT` | Use the checklist in `ai-agent-controls.md` |
| `GOVERNANCE` | The approval gate, ownership and change control for the baseline itself |

## Regulatory context

`project.regulatory_context` lists every law, standard or contract that may apply, each as `APPLICABLE`, `NOT_APPLICABLE` (with notes) or `NOT_ASSESSED`. It is required and non-empty from MEDIUM tier. At HIGH and CRITICAL an approval cannot carry `NOT_ASSESSED`.

Typical entries to consider: a national or regional data-protection law for any personal data (for a project operated from Ghana, the Data Protection Act, 2012 (Act 843) is the starting point), the privacy law of the visitors' jurisdictions, PCI DSS when card data is stored, processed or transmitted (or a hosted payment page that keeps the scope small), and any client contract or sector rule. The skill records what applies and which controls address it. It does not give legal advice, and it does not assume a regime applies or does not apply without an owner decision. These examples were not re-verified on the date of the crosswalk; confirm current versions before relying on them.
