# Skills For Real Engineers — Personal Fork

My personal fork of [Matt Pocock's skills repo](https://github.com/mattpocock/skills) — a curated set of Claude Code slash-command skills built to resist vibe coding. The upstream rationale and most of the writing below is Matt's; I've reorganized the layout into bucket folders, dropped a couple of skills I don't use, and added project-bootstrap templates I copy into every new repo.

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

After that, every Claude Code session in any project gets `/grill-me`, `/zoom-out`, `/to-prd`, etc. for free. On Windows, treat `link-skills.sh` as a deploy step: edit the repo, run the script, and the next Claude Code session sees your change. **Always edit the repo, never the live copy** — the next sync will silently overwrite changes made directly under `~/.claude/skills/`.

## Bootstrap a new project

The engineering skills assume a small set of persistent docs in each project. Copy the templates from [./templates/](./templates/) into the project's `docs/` directory, then drive each one with the matching skill:

| Template                  | Output                  | Skill to populate it      |
| ------------------------- | ----------------------- | ------------------------- |
| `CONTEXT.template.md`     | `docs/CONTEXT.md`       | `/zoom-out`               |
| `PRD.template.md`         | `docs/PRD.md`           | `/to-prd`                 |
| `ISSUES.template.md`      | `docs/ISSUES.md`        | `/to-issues`              |
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

**The Fix** is a shared language — a `CONTEXT.md` document that helps agents decode the jargon used in the project. Built into [`/grill-with-docs`](./skills/engineering/grill-with-docs/SKILL.md).

### #3: The Code Doesn't Work

**The Problem**: You and the agent are aligned on what to build, but the agent _still_ produces crap. Without feedback on how the code actually runs, the agent flies blind.

**The Fix**: feedback loops — static types, browser access, automated tests. For tests specifically, a red-green-refactor TDD loop is critical.

- [`/tdd`](./skills/engineering/tdd/SKILL.md) encourages red-green-refactor and gives the agent guidance on what makes good and bad tests.
- [`/diagnose`](./skills/engineering/diagnose/SKILL.md) wraps best debugging practices into a simple loop.

### #4: We Built A Ball Of Mud

> "Invest in the design of the system _every day_."
>
> Kent Beck, [Extreme Programming Explained](https://www.amazon.co.uk/Extreme-Programming-Explained-Embrace-Change/dp/0321278658)

**The Problem**: Agents radically speed up coding, which also accelerates software entropy. Codebases get more complex at an unprecedented rate.

**The Fix** is caring about the design of the code, every day:

- [`/to-prd`](./skills/engineering/to-prd/SKILL.md) quizzes you about which modules you're touching before creating a PRD.
- [`/zoom-out`](./skills/engineering/zoom-out/SKILL.md) tells the agent to explain code in the context of the whole system.
- [`/improve-codebase-architecture`](./skills/engineering/improve-codebase-architecture/SKILL.md) helps you rescue a codebase that has become a ball of mud. Run it every few days.

## Reference

### Engineering

Skills used daily for code work.

- **[architecture-diagram](./skills/engineering/architecture-diagram/SKILL.md)** — Generate a validated Mermaid architecture diagram of the current repo. Local port of gitdiagram's two-prompt pipeline; outputs `docs/architecture.mmd` (+ optional SVG).
- **[diagnose](./skills/engineering/diagnose/SKILL.md)** — Disciplined diagnosis loop for hard bugs and performance regressions: reproduce → minimise → hypothesise → instrument → fix → regression-test.
- **[grill-with-docs](./skills/engineering/grill-with-docs/SKILL.md)** — Grilling session that challenges your plan against the existing domain model, sharpens terminology, and updates `CONTEXT.md` and ADRs inline.
- **[improve-codebase-architecture](./skills/engineering/improve-codebase-architecture/SKILL.md)** — Find deepening opportunities in a codebase, informed by the domain language in `CONTEXT.md` and the decisions in `docs/adr/`.
- **[setup-matt-pocock-skills](./skills/engineering/setup-matt-pocock-skills/SKILL.md)** — Scaffold the per-repo config (issue tracker, triage label vocabulary, domain doc layout) that the other engineering skills consume. Run once per repo before using `to-issues`, `to-prd`, `triage`, `diagnose`, `tdd`, `improve-codebase-architecture`, or `zoom-out`.
- **[tdd](./skills/engineering/tdd/SKILL.md)** — Test-driven development with a red-green-refactor loop. Builds features or fixes bugs one vertical slice at a time.
- **[to-issues](./skills/engineering/to-issues/SKILL.md)** — Break any plan, spec, or PRD into independently-grabbable issues using vertical slices.
- **[to-prd](./skills/engineering/to-prd/SKILL.md)** — Turn the current conversation context into a PRD. No interview — just synthesizes what you've already discussed.
- **[triage](./skills/engineering/triage/SKILL.md)** — Triage issues through a state machine of triage roles.
- **[zoom-out](./skills/engineering/zoom-out/SKILL.md)** — Tell the agent to zoom out and give broader context or a higher-level perspective on an unfamiliar section of code.

### Productivity

General workflow tools, not code-specific.

- **[caveman](./skills/productivity/caveman/SKILL.md)** — Ultra-compressed communication mode. Cuts token usage ~75% by dropping filler while keeping full technical accuracy.
- **[grill-me](./skills/productivity/grill-me/SKILL.md)** — Get relentlessly interviewed about a plan or design until every branch of the decision tree is resolved.
- **[write-a-skill](./skills/productivity/write-a-skill/SKILL.md)** — Create new skills with proper structure, progressive disclosure, and bundled resources.

### Misc

Tools kept around but rarely used.

- **[git-guardrails-claude-code](./skills/misc/git-guardrails-claude-code/SKILL.md)** — Set up Claude Code hooks to block dangerous git commands (push, reset --hard, clean, etc.) before they execute.
- **[setup-pre-commit](./skills/misc/setup-pre-commit/SKILL.md)** — Set up Husky pre-commit hooks with lint-staged, Prettier, type checking, and tests.

## Credits

All credit for the design and writing of these skills goes to [Matt Pocock](https://github.com/mattpocock). This fork only reorganizes and trims; the substance is upstream. To follow new skills as Matt publishes them, sign up at [aihero.dev](https://www.aihero.dev/s/skills-newsletter).
