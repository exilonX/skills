---
name: structresponse
description: Present research findings, task investigations, plans, or answers to technical questions in a fixed, structured format the user can follow without having watched the work happen. Use when concluding any research or investigation, when explaining how to tackle a task or bug, when answering a technical question with a non-trivial answer, or when the user says "structresponse", "structure this", or "I don't understand — explain properly".
---

# Structured Response

The reader of your answer did **not** watch you work. They don't share your context: they haven't read the files you read, don't know the codenames you invented mid-investigation, and can't see your reasoning. An answer that is correct but assumes that context is a failed answer.

Every research conclusion, task plan, or non-trivial technical answer ends with this exact structure. No other prose after it. Short answers to simple questions are exempt — don't inflate a one-liner into five sections.

## The format

```markdown
## TL;DR

<The answer itself, in 1–3 sentences. If the reader stops here, they know the outcome.>

## Context

<What was asked and why it matters, restated in 2–4 sentences a teammate
 with zero conversation history would understand. Define every
 project-specific or newly-introduced term on first use. State the scope:
 what this covers and what it deliberately does not.>

## Solution / Findings

<The substance. Numbered points, each one claim. Every claim about code
 carries evidence: a code example, or a `file.ts:42` reference, or both.
 Code examples show the exact relevant lines — before/after when proposing
 a change — not whole files.>

## Impact

<What this means for the feature / bug / system in 1–3 sentences:
 what changes, what risk is removed or introduced, what it costs.>

## Next actions

<Ordered, concrete steps. Each starts with a verb and names its target
 ("Add an index on `orders.user_id`", not "improve performance").
 If there are none, write "None — informational only.">
```

## Rules

1. **No assumed context.** Any term, module name, or abbreviation not in common technical vocabulary is defined at first use. If you named something during the investigation ("the v2 path", "the slow branch"), either drop the name or define it in Context.
2. **Unambiguous over short.** Complete sentences. No arrow chains (`A → B → fails`), no fragment bullets the reader must decode. Succinctness comes from *omitting what doesn't change the reader's decision*, never from compressing the writing.
3. **Evidence with every claim.** "The query is slow" is a vibe; "the query at `repo/orders.php:88` runs once per row — 400 queries for a 400-item page" is a finding. Code examples are mandatory in Solution / Findings whenever the subject is code.
4. **One idea per numbered point.** If a point needs "and also", split it.
5. **Each section earns its length.** TL;DR ≤ 3 sentences. Context ≤ 4. Impact ≤ 3. Solution and Next actions as long as the substance requires — no longer.
6. **Every proposed change carries its status quo and its road not taken.** Before proposing to change, delete, or replace anything, state in one line what it does today and why it exists — a reader cannot judge a deletion without knowing what is being deleted. If there is an obvious alternative, the one the reader would reach for first, name it and say why it loses. "Write to `php://stderr`" invites "why not stdout?"; answer it in the same breath, or the reader has to come back and ask.
7. **Self-test before sending:** could someone who joined the project yesterday act on this without asking a follow-up question? If any sentence fails that test, rewrite it.
