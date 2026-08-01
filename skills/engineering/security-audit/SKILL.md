---
name: security-audit
description: Deep, multi-vector security audit of a whole project or a scoped area — OWASP-aligned, taint-traced through all layers, verified findings, structured fix plan.
disable-model-invocation: true
---

# Security Audit

A deliberate, deep audit of your own codebase — not a grep for `eval`. The defining discipline: **trace data, not patterns**. A vulnerability is a path from attacker-controlled input to a dangerous operation; finding it means following the data through every layer, not spotting a scary function name one level deep.

Expensive by design. Scope it: whole project, one service, or one feature area — confirm the scope with the user before fanning out.

## Phase 1 — Map the attack surface

Enumerate every point where data or control enters the system. Read routing/config/build files — don't guess:

- **Network entry**: HTTP routes, GraphQL resolvers, WebSocket handlers, gRPC methods — each with its auth requirement as documented vs as implemented.
- **Async entry**: queue consumers, cron jobs, webhooks, event subscribers (attacker-influenced payloads arrive here too, laundered through a queue).
- **Client entry** (mobile/web frontends): deep links / app links, webviews and their JS bridges, clipboard/intent/file handlers, postMessage listeners.
- **Data entry**: file uploads, imports, third-party API responses you parse, database fields written by *other* systems.
- **Secrets & config**: where credentials live, what's in the repo history, what ships inside the client binary/bundle (everything in a Flutter/web bundle is public).
- **Dependencies**: lockfiles — flag known-vulnerable versions (`npm audit` / `composer audit` / `dart pub outdated` or advisory lookup).

Output of this phase: a numbered inventory of entry points with the trust level of each input. This inventory is the audit's coverage contract — every subsequent finding or all-clear refers back to it.

## Phase 2 — Sweep by attack vector

Audit the inventory against each vector class, in parallel sub-agents when the scope is large (one agent per vector class, each receiving the inventory and reporting file:line findings). Baseline vector classes — OWASP Top 10 plus the API and mobile variants, collapsed:

1. **Injection** — SQL/NoSQL/command/LDAP/template/header injection. Trace every query/exec/render back to its inputs; string concatenation anywhere on the path is a finding even if today's caller sanitises.
2. **Broken authentication** — session handling, token generation/validation/expiry/revocation, password storage, MFA bypass, credential handling in logs and URLs.
3. **Broken authorization** — IDOR (every `:id` param: is ownership checked?), missing function-level checks, privilege escalation paths, tenant isolation in multi-tenant data access. This is the highest-yield class in typical app code — budget accordingly.
4. **Sensitive data exposure** — PII/secrets in logs, error responses leaking internals, over-broad API serialization (returning whole entities), missing encryption at rest/in transit, secrets in client bundles or git history.
5. **Security misconfiguration** — CORS, CSP and security headers, debug endpoints/flags reachable in prod config, default credentials, permissive cloud-storage/bucket rules found in IaC files.
6. **XSS / unsafe rendering** — every sink that turns data into markup/JS (`innerHTML`, `dangerouslySetInnerHTML`, unescaped template output, webview `loadHtml`), traced to its sources.
7. **Insecure design & business logic** — race conditions on money/inventory/quota, missing rate limits on auth and expensive endpoints, workflow bypass (skipping payment/verification steps by calling later-stage endpoints directly), mass assignment.
8. **Vulnerable dependencies & supply chain** — the Phase 1 advisory results, plus install scripts and CI workflows that execute untrusted input.
9. **SSRF & unsafe deserialization** — any user-influenced URL that the server fetches; any `unserialize`/`pickle`-class sink fed external bytes.
10. **Client-platform specifics** (when scope includes mobile/web clients) — insecure local storage of tokens, certificate-validation overrides, JS-bridge exposure, deep-link parameter trust.

For each candidate: **follow the full path** — source → every transformation/check → sink — and record which layer was supposed to stop the attack. A check that exists but runs on a different code path than the sink is a finding.

## Phase 3 — Verify

For each candidate finding, attempt to refute it before reporting: is the input actually attacker-reachable? Does an upstream layer (framework auto-escaping, middleware, DB driver) already neutralise it? Write the concrete attack scenario — actor, entry point, payload shape, effect. A finding with no statable attack scenario is downgraded to a hardening note, not dropped silently.

Do **not** build working exploits or attack running systems — this is code audit; the scenario is described, not executed.

## Phase 4 — Report and plan

Deliver in `/structresponse` format. Findings section is a severity-ranked table then detail per finding:

- **Severity** — Critical (remote compromise / data breach, no preconditions) / High (compromise with realistic preconditions) / Medium (limited blast radius or significant preconditions) / Low / Hardening.
- Per finding: id, location (`file:line`), vector class, the traced path (source → sink), attack scenario, and the fix — with a code example of the corrected pattern.
- **Coverage recap**: the Phase 1 inventory with each entry marked audited-clean / has-findings / out-of-scope, so an all-clear is a claim about listed entry points, never "the app is secure".

Next actions: fixes ordered by severity, each sized (quick patch vs refactor), grouped so one PR fixes one vector class where possible. Offer to turn them into tickets via `/to-tickets`.
