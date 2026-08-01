---
name: fix-from-evidence
description: Work backwards from production evidence — APM traces, error logs, stack traces, crash reports, slow-query logs — to the defect in the code. Use when the user pastes or links logs, a stack trace, an APM screenshot, a crash report, or an error-rate alert and wants the cause found and fixed. Stack-agnostic — backend (Node.js, PHP, any) or frontend (Flutter, web, any).
---

# Fix From Evidence

Production evidence is the *start* of diagnosis, not the diagnosis. The failure mode this skill prevents: pattern-matching a stack trace to a plausible-looking line, "fixing" it, and shipping without ever confirming that line caused the incident. Evidence narrows the search space; the `/diagnosing-bugs` loop still confirms the cause.

## Phase 1 — Interrogate the evidence

Extract every fact the evidence actually contains before touching code. Build a fact sheet:

- **Symptom** — exact error type/message, or the latency/throughput number for perf evidence. Quote it verbatim; paraphrased errors lose the discriminating detail.
- **Location** — deepest stack frame *in your code* (not framework/vendor frames), or the APM span/query where the time goes.
- **Frequency & spread** — one user or all? One endpoint/screen or many? Error rate flat, spiking, or growing?
- **Onset** — when did it start? Correlate against deploys, config changes, dependency bumps, data growth, and traffic shape at that timestamp. "Started at 14:02 Tuesday" plus a 14:00 deploy is your strongest single clue.
- **Environment** — versions (app build, runtime, OS/browser/device), region, feature flags. Frontend evidence: is the trace symbolicated/source-mapped? If frames are minified or obfuscated, de-obfuscate first (source maps for JS, symbol files for Flutter/native) — hypothesising over mangled frames is guessing.

Ask the user for missing high-value facts (onset time, deploy history, a second sample of the trace) instead of compensating with speculation — but proceed with what exists if they're unavailable.

## Phase 2 — Localise in code

Map the fact sheet onto the codebase:

1. Walk the stack trace / span tree to the **boundary between "code that ran fine" and "code that failed"** — that boundary, not the top frame, is where the defect lives. A `null` blowing up at frame 0 was usually *produced* several frames (or one async hop) earlier.
2. Read the implicated code path end to end, including the async edges where stack traces lie: queue handlers, `then`-chains, isolates, event emitters. Reconstruct the *logical* call chain, not just the captured frames.
3. `git log` the implicated files around the onset time from Phase 1.

## Phase 3 — Hypothesise, ranked by evidence fit

3–5 falsifiable hypotheses (format per `/diagnosing-bugs`), **ranked by how much of the fact sheet each explains**. A hypothesis that explains the stack trace but not the onset timing or the single-endpoint spread ranks below one that explains all three. State explicitly which facts each hypothesis does *not* explain.

## Phase 4 — Hand off to the diagnosis loop

Run `/diagnosing-bugs` starting from its Phase 1 (build a feedback loop), carrying your fact sheet and ranked hypotheses in. The evidence usually gifts you the repro: **replay it** — feed the logged payload/request/event through the code path in isolation, re-run the slow query with the logged parameters, reproduce the crash with the logged device/state.

Do not skip the loop because the cause "is obvious from the log". Confirmation costs minutes; a wrong fix in production costs an incident.

**Perf branch.** For APM latency/throughput evidence: baseline first (the APM numbers *are* the baseline), then measure locally under the same shape of load/data before and after the fix. A fix that helps with 100 rows and not with production's 1M rows is not a fix — check data-volume sensitivity explicitly (N+1s, missing indexes, and full scans only appear at scale).

## Phase 5 — Close out

- Fix + regression test per `/diagnosing-bugs` Phase 5–6.
- Verify against the original evidence: error rate drops / trace goes fast in the environment that produced it, not just locally.
- Report the outcome in the `/structresponse` format — Context states the incident in plain language; Findings walk evidence → cause with the code; Next actions include any monitoring/alerting gap that let this reach production silently.
