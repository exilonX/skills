---
name: coding-standards
description: Language-agnostic implementation standards applied while writing or changing code — reuse before reinvention, short single-purpose functions, performance and security defaults, honest naming. Use when implementing a feature, refactoring, or writing any non-trivial code in any stack (Node.js, PHP, Flutter/Dart, frontend JS, or anything else), or when the user says "apply coding standards" or "follow best practices".
---

# Coding Standards

The bar for code as it is **written** — not reviewed after the fact (that is `/code-review`'s job). A documented repo standard (`CONTRIBUTING.md`, lint config, `CODING_STANDARDS.md`) always overrides anything here; anything a linter/formatter already enforces, skip.

## 1. Reuse before reinvention

Before writing any helper, utility, validator, formatter, or query: **search the codebase for an existing one**. Grep for the concept, not just the name you'd give it. Writing a second `formatDate` is a defect even if it works.

- Found one that almost fits? Extend it or refactor it to fit — don't fork it.
- Found duplication while working? Extract the shared shape into the layer both callers can reach; don't add a third copy.
- No existing seam? Put the new function where the next person would look for it, not next to today's caller.

## 2. Function and module shape

- **Short functions, one job.** A function that needs "and" to describe is two functions. Aim under ~30 lines; treat crossing it as a prompt to justify, not a hard rule.
- **Small public surface.** Modules expose the few functions/classes callers need; everything else stays private. Depth over breadth: a deep module hides complexity behind a small interface (`/codebase-design` has the full discipline).
- **Parameters travel in named structures** once you're past 3 of them, or when the same few keep appearing together.
- **No speculative generality.** No options, hooks, or abstract layers for needs that don't exist yet. Delete-until-needed beats design-for-maybe.
- **Errors are handled at the boundary that can act on them.** Don't swallow, don't log-and-rethrow at every layer; catch where a decision can be made, let the rest propagate typed/structured errors.

## 3. Performance defaults

Write it right the first time; profile before optimising further (`/diagnosing-bugs` covers regressions).

- **No N+1.** Any query, HTTP call, or file read inside a loop is guilty until proven bounded. Batch, join, or prefetch.
- **Right data structure.** Membership tests against a list inside a loop → set/map. Repeated recomputation of an invariant → hoist it out.
- **Pagination and limits on every unbounded read** — DB queries, API list endpoints, file streams. "It's small now" is how it starts.
- **Async where the platform expects it.** Never block the event loop (Node) or the UI isolate (Flutter) with synchronous CPU/IO work; push heavy work to workers/isolates/queues.
- **Payload discipline.** Select the columns/fields you need; don't serialize whole entities across the wire because it was convenient.

## 4. Security defaults

Applied to every change, not just "security work" (`/security-audit` is the deep scan; this is the daily floor):

- **Validate and type all external input at the boundary** — request bodies, query params, file uploads, message payloads, deep links. Inside the boundary, work with parsed, typed values.
- **Parametrized queries only.** String-built SQL/NoSQL/shell commands are defects even when today's input "can't" be user-controlled.
- **Encode output for its context** (HTML, URL, shell, SQL) — rely on the framework's escaping, never hand-rolled.
- **Secrets never in code, logs, or error messages.** Config/env only; verify new log lines don't leak tokens, passwords, or PII.
- **AuthZ at every entry point.** Every new route/handler states who may call it; deny by default. Never trust client-side checks alone.
- **Dependencies are code you ship.** Prefer stdlib/framework over a new package; pin versions.

## 5. Naming and honesty

- Names say what a thing **is or does now** — not its history ("new", "v2", "temp") or its type ("dataObject", "infoManager"). If no honest name comes, the design is murky; fix the design.
- Comments state constraints the code can't show (invariants, why-not-the-obvious-way). Never what the next line does, never narration of the change you just made.
- Match the surrounding file's idiom, comment density, and formatting. Consistency beats personal preference.

## Self-check before finishing

1. Did I search for existing code before writing each new function?
2. Can every new function be described without "and"?
3. Any query/call/read inside a loop? Any unbounded read?
4. Is every external input validated, every query parametrized, every new endpoint authorized?
5. Would every name survive a stranger reading it cold?
