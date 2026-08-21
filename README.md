# Skills For Real Engineers: Personal Fork

My personal fork of [Matt Pocock's skills repo](https://github.com/mattpocock/skills), a curated set of Claude Code slash-command skills built to resist vibe coding. The upstream rationale and most of the writing below is Matt's. I've reorganized the layout into bucket folders, dropped a couple of skills I don't use, added project-bootstrap templates I copy into every new repo, and added a set of personal skills (`architecture-diagram`, `zoom-out`, `caveman`, `structresponse`, `coding-standards`, `fix-from-evidence`, `security-audit`) tailored to how I work.

If you're new to these skills, read Matt's original repo first; the philosophy is his. To follow new skills as he publishes them, sign up at [aihero.dev](https://www.aihero.dev/s/skills-newsletter).

## Install

This fork lives at a stable path on disk. The linker populates the user-level skill directories for each harness (`~/.claude/skills/<skill-name>` for Claude Code, `~/.agents/skills/<skill-name>` for Codex and other Agent Skills harnesses) from the repo's bucket layout, flattening it. Behaviour is OS-dependent:

- **macOS / Linux:** real symlinks. Edits in the repo go live instantly.
- **Windows (Git Bash):** file copies. Re-run the linker after editing a skill to push the change to the live directory. (Native symlinks would need elevation or Developer Mode; copies are simpler and work in any shell.)

```bash
# 1. Clone wherever you keep your tools
git clone git@github.com:exilonX/skills.git ~/code/skills
cd ~/code/skills

# 2. Populate the harness skill directories.
#    Skills under deprecated/ and in-progress/ are skipped; skills that have
#    since been renamed or removed are pruned.
bash scripts/link-skills.sh
```

After that, every session in any project gets `/grill-me`, `/zoom-out`, `/wait-what`, `/to-spec`, and the rest for free. On Windows, treat `link-skills.sh` as a deploy step: edit the repo, run the script, and the next session sees your change. **Always edit the repo, never the live copy.** The next sync will silently overwrite changes made directly under `~/.claude/skills/`.

Then run [`/setup-matt-pocock-skills`](./skills/engineering/setup-matt-pocock-skills/SKILL.md) once per repo. It asks which issue tracker you want (GitHub, Linear, or local files), which labels you apply when you triage, and where to save any docs the skills create.

## Bootstrap a new project

The engineering skills assume a small set of persistent docs in each project. Copy the templates from [./templates/](./templates/) into the project's `docs/` directory, then drive each one with the matching skill:

| Template                  | Output                    | Skill to populate it              |
| ------------------------- | ------------------------- | --------------------------------- |
| `CONTEXT.template.md`     | `docs/CONTEXT.md`         | `/zoom-out`                       |
| `PRD.template.md`         | `docs/PRD.md`             | `/to-spec`                        |
| `ISSUES.template.md`      | `docs/ISSUES.md`          | `/to-tickets`                     |
| `ADR.template.md`         | `docs/DECISIONS/NNN-*.md` | record manually as decisions land |

`CONTEXT.md` is the highest-leverage one; it's the shared-language doc the other skills read.

## Why These Skills Exist

(The rest of this section is Matt's original writing, lightly trimmed. It explains the failure modes the skills target.)

### #1: The Agent Didn't Do What I Want

> "No-one knows exactly what they want"
>
> David Thomas & Andrew Hunt, [The Pragmatic Programmer](https://www.amazon.co.uk/Pragmatic-Programmer-Anniversary-Journey-Mastery/dp/B0833F1T3V)

**The Problem**. The most common failure mode in software development is misalignment. You think the dev knows what you want. Then you see what they've built, and you realize it didn't understand you at all.

This is just the same in the AI age. There is a communication gap between you and the agent. The fix for this is a **grilling session**: getting the agent to ask you detailed questions about what you're building.

**The Fix** is to use:

- [`/grill-me`](./skills/productivity/grill-me/SKILL.md) for non-code uses
- [`/grill-with-docs`](./skills/engineering/grill-with-docs/SKILL.md), the same as `/grill-me`, but updates `CONTEXT.md` and ADRs inline

These help you align with the agent before you get started, and think deeply about the change you're making. Use them _every_ time you want to make a change.

### #2: The Agent Is Way Too Verbose

> With a ubiquitous language, conversations among developers and expressions of the code are all derived from the same domain model.
>
> Eric Evans, [Domain-Driven-Design](https://www.amazon.co.uk/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215)

**The Problem**: At the start of a project, devs and the people they're building the software for (the domain experts) are usually speaking different languages. Agents are usually dropped into a project and asked to figure out the jargon as they go. So they use 20 words where 1 will do.

**The Fix** is a shared language: a `CONTEXT.md` document that helps agents decode the jargon used in the project. Built into [`/grill-with-docs`](./skills/engineering/grill-with-docs/SKILL.md), and actively sharpened by [`/domain-modeling`](./skills/engineering/domain-modeling/SKILL.md).

The communication problem runs the other way too, with the agent explaining itself badly. [`/structresponse`](./skills/productivity/structresponse/SKILL.md) enforces a fixed, structured answer format for research and task explanations. [`/wait-what`](./skills/productivity/wait-what/SKILL.md) is the escape hatch for a single message that didn't land: it makes the agent re-pitch with the context you were missing. [`/caveman`](./skills/productivity/caveman/SKILL.md) goes the other way and strips the prose back to its technical substance.

### #3: The Code Doesn't Work

**The Problem**: You and the agent are aligned on what to build, but the agent _still_ produces crap. Without feedback on how the code actually runs, the agent flies blind.

**The Fix**: feedback loops, meaning static types, browser access, and automated tests. For tests specifically, a red-green-refactor loop is critical: the agent writes a failing test first, then fixes it, which gives it a consistent level of feedback that results in far better code.

- [`/tdd`](./skills/engineering/tdd/SKILL.md) encourages red-green-refactor and gives the agent guidance on what makes good and bad tests.
- [`/diagnosing-bugs`](./skills/engineering/diagnosing-bugs/SKILL.md) wraps best debugging practices into a disciplined loop, gated phase by phase.
- [`/fix-from-evidence`](./skills/engineering/fix-from-evidence/SKILL.md) is the production on-ramp to that loop: start from APM traces, error logs, or crash reports and work backwards to the defect.

### #4: We Built A Ball Of Mud

> "Invest in the design of the system _every day_."
>
> Kent Beck, [Extreme Programming Explained](https://www.amazon.co.uk/Extreme-Programming-Explained-Embrace-Change/dp/0321278658)

**The Problem**: Agents radically speed up coding, which also accelerates software entropy. Codebases get more complex at an unprecedented rate.

**The Fix** is caring about the design of the code, every day:

- [`/to-spec`](./skills/engineering/to-spec/SKILL.md) quizzes you about which modules you're touching before creating a spec.
- [`/zoom-out`](./skills/engineering/zoom-out/SKILL.md) tells the agent to explain code in the context of the whole system.
- [`/coding-standards`](./skills/engineering/coding-standards/SKILL.md) sets the implementation-time bar: short functions, reuse, performance and security defaults.
- [`/code-review`](./skills/engineering/code-review/SKILL.md) reviews the diff since a fixed point along Standards and Spec axes.
- [`/improve-codebase-architecture`](./skills/engineering/improve-codebase-architecture/SKILL.md) surveys a codebase for deepening opportunities and hands you the candidates. Run it once every few days. It is a survey, not a rescue: on a genuinely old codebase it will find real candidates, but it won't untangle the mud for you.
- [`/security-audit`](./skills/engineering/security-audit/SKILL.md) runs a deep OWASP-aligned scan when you need to know the codebase is safe, not just clean.

### Summary

Software engineering fundamentals matter more than ever. These skills are Matt's best effort at condensing those fundamentals into repeatable practices, to help you ship the best apps of your career.

## Reference

These split on one axis: who can invoke them. **User-invoked** skills are reachable only when you type them (e.g. `/grill-me`); their job is to orchestrate. **Model-invoked** skills can be invoked by you _or_ reached for automatically by the agent when the task fits; they hold the reusable discipline. A user-invoked skill may invoke model-invoked skills, but never another user-invoked one.

### Engineering

Skills used daily for code work. See [skills/engineering/README.md](./skills/engineering/README.md).

**User-invoked**

- **[ask-matt](./skills/engineering/ask-matt/SKILL.md)**: Ask which skill or flow fits your situation. A router over the user-invoked skills in this repo.
- **[grill-with-docs](./skills/engineering/grill-with-docs/SKILL.md)**: Grilling session that also builds your project's domain model, sharpening terminology and updating `CONTEXT.md` and ADRs inline.
- **[triage](./skills/engineering/triage/SKILL.md)**: Move issues through a state machine of triage roles.
- **[improve-codebase-architecture](./skills/engineering/improve-codebase-architecture/SKILL.md)**: Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick.
- **[security-audit](./skills/engineering/security-audit/SKILL.md)**: Deep, multi-vector security audit of a whole project or a scoped area, driven by OWASP-aligned attack-vector checklists and parallel sub-agents; ends in a structured, prioritised findings report with a fix plan.
- **[setup-matt-pocock-skills](./skills/engineering/setup-matt-pocock-skills/SKILL.md)**: Configure this repo for the engineering skills (issue tracker, triage labels, domain doc layout). Run once per repo before using the other engineering skills.
- **[to-spec](./skills/engineering/to-spec/SKILL.md)**: Turn the current conversation into a spec and publish it to the issue tracker. No interview, just synthesizes what you've already discussed.
- **[to-tickets](./skills/engineering/to-tickets/SKILL.md)**: Break any plan, spec, or conversation into a set of tracer-bullet tickets, each declaring its blocking edges, written as text in a local file, or as native blocking links on a real tracker.
- **[implement](./skills/engineering/implement/SKILL.md)**: Build the work described by a spec or set of tickets, driving `/tdd` at pre-agreed seams and closing out with `/code-review` before committing.
- **[wayfinder](./skills/engineering/wayfinder/SKILL.md)**: Plan a huge chunk of work, more than one agent session can hold, as a shared map of decision tickets on the issue tracker, and resolve them one at a time until the way to the destination is clear.
- **[zoom-out](./skills/engineering/zoom-out/SKILL.md)**: Tell the agent to zoom out and give broader context or a higher-level perspective on an unfamiliar section of code.

**Model-invoked**

- **[architecture-diagram](./skills/engineering/architecture-diagram/SKILL.md)**: Generate a validated Mermaid architecture diagram of the current repo. Local port of gitdiagram's two-prompt pipeline; outputs `docs/architecture.mmd` (+ optional SVG).
- **[prototype](./skills/engineering/prototype/SKILL.md)**: Build a throwaway prototype to answer a design question, either a single shareable HTML file for state/logic questions, or several radically different UI variations toggleable from one route.
- **[diagnosing-bugs](./skills/engineering/diagnosing-bugs/SKILL.md)**: Disciplined diagnosis loop for hard bugs and performance regressions: build a feedback loop that goes red on this bug → minimise → hypothesise → instrument → fix → regression-test.
- **[fix-from-evidence](./skills/engineering/fix-from-evidence/SKILL.md)**: Work backwards from production evidence (APM traces, error logs, stack traces, crash reports) to the defect, then hand a confirmed hypothesis to the diagnosis loop. Stack-agnostic.
- **[research](./skills/engineering/research/SKILL.md)**: Investigate a question against high-trust primary sources and capture the findings as a cited Markdown file in the repo, run as a background agent.
- **[tdd](./skills/engineering/tdd/SKILL.md)**: Test-driven development with a red-green-refactor loop. Builds features or fixes bugs one vertical slice at a time.
- **[coding-standards](./skills/engineering/coding-standards/SKILL.md)**: Language-agnostic implementation standards applied while writing or changing code: short functions, reuse before reinvention, performance and security defaults, and honest naming.
- **[domain-modeling](./skills/engineering/domain-modeling/SKILL.md)**: Actively build and sharpen a project's domain model: challenge terms against the glossary, stress-test with edge-case scenarios, and update `CONTEXT.md` and ADRs inline.
- **[codebase-design](./skills/engineering/codebase-design/SKILL.md)**: Shared discipline and vocabulary for designing deep modules: a lot of behaviour behind a small interface, placed at a clean seam, testable through that interface.
- **[code-review](./skills/engineering/code-review/SKILL.md)**: Two-axis review of the diff since a fixed point: **Standards** (does it follow the repo's coding standards, plus a Fowler smell baseline?) and **Spec** (does it faithfully implement the originating issue/spec?), run as parallel sub-agents so neither pollutes the other.
- **[resolving-merge-conflicts](./skills/engineering/resolving-merge-conflicts/SKILL.md)**: Work through an in-progress git merge or rebase conflict hunk by hunk, resolving by intent traced to each side's primary source, then finish the operation (never `--abort`).
- **[wizard](./skills/engineering/wizard/SKILL.md)**: Generate an interactive bash wizard that walks a human through steps only they can perform: provisioning infrastructure, setting up credentials or CI secrets, walking an unfamiliar third-party dashboard, or running a one-off migration or cutover.

### Productivity

General workflow tools, not code-specific. See [skills/productivity/README.md](./skills/productivity/README.md).

**User-invoked**

- **[caveman](./skills/productivity/caveman/SKILL.md)**: Ultra-compressed communication mode. Cuts token usage ~75% by dropping filler while keeping full technical accuracy.
- **[grill-me](./skills/productivity/grill-me/SKILL.md)**: Get relentlessly interviewed about a plan or design until every branch of the design tree is resolved.
- **[handoff](./skills/productivity/handoff/SKILL.md)**: Compact the current conversation into a handoff document so another agent can continue the work.
- **[teach](./skills/productivity/teach/SKILL.md)**: Teach the user a new skill or concept over multiple sessions, using the current directory as a stateful teaching workspace.
- **[to-questionnaire](./skills/productivity/to-questionnaire/SKILL.md)**: Turn a decision you can't answer alone into a Markdown questionnaire for the one person who can, filled in async, or together over a meeting. It grills you about the send (who it's for, what you need back), not the subject.
- **[wait-what](./skills/productivity/wait-what/SKILL.md)**: Fire this the moment a message doesn't land. The agent re-pitches it with the context you're missing, in plain English, using your `CONTEXT.md` vocabulary.

**Model-invoked**

- **[grilling](./skills/productivity/grilling/SKILL.md)**: Interview the user relentlessly about a plan, decision, or idea until every branch of the design tree is resolved. The reusable interview primitive behind `grill-me`, `grill-with-docs`, `triage`, `wayfinder` and `improve-codebase-architecture`.
- **[structresponse](./skills/productivity/structresponse/SKILL.md)**: Fixed answer format for research conclusions, investigation recaps, and non-trivial answers: TL;DR → Context → Solution/Findings → Impact → Next actions, written for a reader without the conversation context.
- **[writing-for-agents](./skills/productivity/writing-for-agents/SKILL.md)**: Writing documents for agents: skills, AGENTS.md/CLAUDE.md, and any doc an agent reaches by a pointer.

### Misc

Non-promoted tools kept around but rarely used. See [skills/misc/README.md](./skills/misc/README.md).

## Credits

All credit for the design and writing of these skills goes to [Matt Pocock](https://github.com/mattpocock). This fork only reorganizes, trims, and adds a few personal skills; the substance is upstream. To follow new skills as Matt publishes them, sign up at [aihero.dev](https://www.aihero.dev/s/skills-newsletter).
