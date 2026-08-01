# Skills For Real Engineers — Personal Fork

My personal fork of [Matt Pocock's skills repo](https://github.com/mattpocock/skills) — a curated set of Claude Code slash-command skills built to resist vibe coding. The upstream rationale and most of the writing below is Matt's; I've reorganized the layout into bucket folders, dropped a couple of skills I don't use, added project-bootstrap templates I copy into every new repo, and added a set of personal skills (`structresponse`, `coding-standards`, `fix-from-evidence`, `security-audit`) tailored to how I work.

If you're new to these skills, read Matt's original repo first — the philosophy is his.

## Install

This fork lives at a stable path on disk. The linker populates Claude Code's user-level skills directory (`~/.claude/skills/<skill-name>`) from each skill in the repo's bucket layout, flattening it. Behaviour is OS-dependent:

- **macOS / Linux:** real symlinks. Edits in the repo go live instantly.
- **Windows (Git Bash):** file copies. Re-run the linker after editing a skill to push the change to the live directory. (Native symlinks would need elevation or Developer Mode; copies are simpler and work in any shell.)

```bash
# 1. Clone wherever you keep your tools
git clone git@github.com:exilonX/skills.git ~/code/skills
cd ~/code/skills

# 2. Populate ~/.claude/skills/. Skills under deprecated/ are skipped.
bash scripts/link-skills.sh
```

After that, every Claude Code session in any project gets `/grill-me`, `/zoom-out`, `/to-spec`, etc. for free. On Windows, treat `link-skills.sh` as a deploy step: edit the repo, run the script, and the next Claude Code session sees your change. **Always edit the repo, never the live copy** — the next sync will silently overwrite changes made directly under `~/.claude/skills/`.

## Bootstrap a new project

The engineering skills assume a small set of persistent docs in each project. Copy the templates from [./templates/](./templates/) into the project's `docs/` directory, then drive each one with the matching skill:

| Template                  | Output                  | Skill to populate it      |
| ------------------------- | ----------------------- | ------------------------- |
| `CONTEXT.template.md`     | `docs/CONTEXT.md`       | `/zoom-out`               |
| `PRD.template.md`         | `docs/PRD.md`           | `/to-spec`                |
| `ISSUES.template.md`      | `docs/ISSUES.md`        | `/to-tickets`             |
| `ADR.template.md`         | `docs/DECISIONS/NNN-*.md` | record manually as decisions land |

`CONTEXT.md` is the highest-leverage one — it's the shared-language doc the other skills read.

## Why These Skills Exist

(The rest of this section is Matt's original writing, lightly trimmed. It explains the failure modes the skills target.)

### #1: The Agent Didn't Do What I Want

> "No-one knows exactly what they want"
>
> David Thomas & Andrew Hunt, [The Pragmatic Programmer](https://www.amazon.co.uk/Pragmatic-Programmer-Anniversary-Journey-Mastery/dp/B0833F1T3V)

**The Problem**. The most common failure mode in software development is misalignment. You think the dev knows what you want. Then you see what they've built — and you realize it didn't understand you at all.

This is just the same in the AI age. There is a communication gap between you and the agent. The fix for this is a **grilling session** — getting the agent to ask you detailed questions about what you're building.

**The Fix** is to use:

- [`/grill-me`](./skills/productivity/grill-me/SKILL.md) — for non-code uses
- [`/grill-with-docs`](./skills/engineering/grill-with-docs/SKILL.md) — same as `/grill-me`, but updates `CONTEXT.md` and ADRs inline

These help you align with the agent before you get started, and think deeply about the change you're making. Use them _every_ time you want to make a change.

### #2: The Agent Is Way Too Verbose

> With a ubiquitous language, conversations among developers and expressions of the code are all derived from the same domain model.
>
> Eric Evans, [Domain-Driven-Design](https://www.amazon.co.uk/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215)

**The Problem**: At the start of a project, devs and the people they're building the software for (the domain experts) are usually speaking different languages. Agents are usually dropped into a project and asked to figure out the jargon as they go. So they use 20 words where 1 will do.

**The Fix** is a shared language — a `CONTEXT.md` document that helps agents decode the jargon used in the project. Built into [`/grill-with-docs`](./skills/engineering/grill-with-docs/SKILL.md), and actively sharpened by [`/domain-modeling`](./skills/engineering/domain-modeling/SKILL.md).

The communication problem runs the other way too — the agent explaining itself badly. [`/structresponse`](./skills/productivity/structresponse/SKILL.md) enforces a fixed, structured answer format for research and task explanations.

### #3: The Code Doesn't Work

**The Problem**: You and the agent are aligned on what to build, but the agent _still_ produces crap. Without feedback on how the code actually runs, the agent flies blind.

**The Fix**: feedback loops — static types, browser access, automated tests. For tests specifically, a red-green-refactor TDD loop is critical.

- [`/tdd`](./skills/engineering/tdd/SKILL.md) encourages red-green-refactor and gives the agent guidance on what makes good and bad tests.
- [`/diagnosing-bugs`](./skills/engineering/diagnosing-bugs/SKILL.md) wraps best debugging practices into a simple loop.
- [`/fix-from-evidence`](./skills/engineering/fix-from-evidence/SKILL.md) is the production on-ramp to that loop: start from APM traces, error logs, or crash reports and work backwards to the defect.

### #4: We Built A Ball Of Mud

> "Invest in the design of the system _every day_."
>
> Kent Beck, [Extreme Programming Explained](https://www.amazon.co.uk/Extreme-Programming-Explained-Embrace-Change/dp/0321278658)

**The Problem**: Agents radically speed up coding, which also accelerates software entropy. Codebases get more complex at an unprecedented rate.

**The Fix** is caring about the design of the code, every day:

- [`/to-spec`](./skills/engineering/to-spec/SKILL.md) turns the current conversation into a spec before you build.
- [`/zoom-out`](./skills/engineering/zoom-out/SKILL.md) tells the agent to explain code in the context of the whole system.
- [`/coding-standards`](./skills/engineering/coding-standards/SKILL.md) sets the implementation-time bar: short functions, reuse, performance and security defaults.
- [`/code-review`](./skills/engineering/code-review/SKILL.md) reviews the diff since a fixed point along Standards and Spec axes.
- [`/improve-codebase-architecture`](./skills/engineering/improve-codebase-architecture/SKILL.md) helps you rescue a codebase that has become a ball of mud. Run it every few days.
- [`/security-audit`](./skills/engineering/security-audit/SKILL.md) runs a deep OWASP-aligned scan when you need to know the codebase is safe, not just clean.

## Reference

### Engineering

Skills used daily for code work. See [skills/engineering/README.md](./skills/engineering/README.md) for the user-invoked vs model-invoked split.

- **[architecture-diagram](./skills/engineering/architecture-diagram/SKILL.md)** — Generate a validated Mermaid architecture diagram of the current repo. Local port of gitdiagram's two-prompt pipeline; outputs `docs/architecture.mmd` (+ optional SVG).
- **[ask-matt](./skills/engineering/ask-matt/SKILL.md)** — Ask which skill or flow fits your situation. A router over the user-invoked skills in this repo.
- **[code-review](./skills/engineering/code-review/SKILL.md)** — Two-axis review of the diff since a fixed point: Standards (repo coding standards + a Fowler smell baseline) and Spec (does it implement the originating issue/PRD?), run as parallel sub-agents.
- **[codebase-design](./skills/engineering/codebase-design/SKILL.md)** — Shared discipline and vocabulary for designing deep modules: small interfaces, clean seams, testable through the interface.
- **[coding-standards](./skills/engineering/coding-standards/SKILL.md)** — Language-agnostic implementation standards applied while writing or changing code: short functions, reuse before reinvention, performance and security defaults, and honest naming.
- **[diagnosing-bugs](./skills/engineering/diagnosing-bugs/SKILL.md)** — Disciplined diagnosis loop for hard bugs and performance regressions: reproduce → minimise → hypothesise → instrument → fix → regression-test.
- **[domain-modeling](./skills/engineering/domain-modeling/SKILL.md)** — Actively build and sharpen a project's domain model — challenge terms, stress-test with scenarios, update `CONTEXT.md` and ADRs inline.
- **[fix-from-evidence](./skills/engineering/fix-from-evidence/SKILL.md)** — Work backwards from production evidence (APM traces, error logs, stack traces, crash reports) to the defect, then hand a confirmed hypothesis to the diagnosis loop. Stack-agnostic.
- **[grill-with-docs](./skills/engineering/grill-with-docs/SKILL.md)** — Grilling session that challenges your plan against the existing domain model, sharpens terminology, and updates `CONTEXT.md` and ADRs inline.
- **[implement](./skills/engineering/implement/SKILL.md)** — Build the work described by a spec or set of tickets, driving `/tdd` at pre-agreed seams and closing out with `/code-review` before committing.
- **[improve-codebase-architecture](./skills/engineering/improve-codebase-architecture/SKILL.md)** — Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick.
- **[prototype](./skills/engineering/prototype/SKILL.md)** — Build a throwaway prototype to answer a design question: a runnable terminal app for state/logic, or several toggleable UI variations.
- **[research](./skills/engineering/research/SKILL.md)** — Investigate a question against high-trust primary sources and capture the findings as a cited Markdown file in the repo, run as a background agent.
- **[resolving-merge-conflicts](./skills/engineering/resolving-merge-conflicts/SKILL.md)** — Work through an in-progress git merge or rebase conflict hunk by hunk, resolving by intent traced to each side's primary source, then finish the operation — never `--abort`.
- **[security-audit](./skills/engineering/security-audit/SKILL.md)** — Deep, multi-vector security audit of a whole project or a scoped area, driven by OWASP-aligned attack-vector checklists and parallel sub-agents; ends in a structured, prioritised findings report with a fix plan.
- **[setup-matt-pocock-skills](./skills/engineering/setup-matt-pocock-skills/SKILL.md)** — Configure this repo for the engineering skills (issue tracker, triage labels, domain doc layout). Run once per repo.
- **[tdd](./skills/engineering/tdd/SKILL.md)** — Test-driven development with a red-green-refactor loop. Builds features or fixes bugs one vertical slice at a time.
- **[to-spec](./skills/engineering/to-spec/SKILL.md)** — Turn the current conversation into a spec and publish it to the issue tracker.
- **[to-tickets](./skills/engineering/to-tickets/SKILL.md)** — Break any plan, spec, or conversation into a set of tracer-bullet tickets, each declaring its blocking edges.
- **[triage](./skills/engineering/triage/SKILL.md)** — Triage issues through a state machine of triage roles.
- **[wayfinder](./skills/engineering/wayfinder/SKILL.md)** — Plan a huge chunk of work — more than one agent session can hold — as a shared map of decision tickets, resolved one at a time.
- **[zoom-out](./skills/engineering/zoom-out/SKILL.md)** — Tell the agent to zoom out and give broader context or a higher-level perspective on an unfamiliar section of code.

### Productivity

General workflow tools, not code-specific.

- **[caveman](./skills/productivity/caveman/SKILL.md)** — Ultra-compressed communication mode. Cuts token usage ~75% by dropping filler while keeping full technical accuracy.
- **[grill-me](./skills/productivity/grill-me/SKILL.md)** — Get relentlessly interviewed about a plan or design until every branch of the decision tree is resolved.
- **[grilling](./skills/productivity/grilling/SKILL.md)** — The shared grilling primitive that `grill-me` and `grill-with-docs` both run.
- **[handoff](./skills/productivity/handoff/SKILL.md)** — Write a handoff file so a fresh session can pick up exactly where this one left off.
- **[structresponse](./skills/productivity/structresponse/SKILL.md)** — Enforce a fixed, structured answer format for research, planning, and task explanations: purpose → solution with code examples → impact → next actions. Kills ambiguous, context-assuming answers.
- **[teach](./skills/productivity/teach/SKILL.md)** — Explain a topic by teaching it, checking understanding as you go.
- **[writing-great-skills](./skills/productivity/writing-great-skills/SKILL.md)** — Create new skills with proper structure, progressive disclosure, and bundled resources.

### Misc

Non-promoted tools kept around but rarely used — see [skills/misc/README.md](./skills/misc/README.md).

## Credits

All credit for the design and writing of these skills goes to [Matt Pocock](https://github.com/mattpocock). This fork only reorganizes, trims, and adds a few personal skills; the substance is upstream. To follow new skills as Matt publishes them, sign up at [aihero.dev](https://www.aihero.dev/s/skills-newsletter).
