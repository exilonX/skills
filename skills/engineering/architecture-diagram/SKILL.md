---
name: architecture-diagram
description: Generate an architecture diagram of the current repository as Mermaid (+ optional SVG). Faithful local port of gitdiagram's two-prompt pipeline, with hard-validated output. Use when user says "diagram this project", "draw the architecture", "architecture diagram", "regenerate the architecture", "mermaid diagram of this repo", or invokes /architecture-diagram.
---

# Architecture Diagram

Produce a Mermaid flowchart of the current repo's architecture, validated against the same JSON schema gitdiagram uses, and written to `docs/architecture.mmd` (+ `architecture.svg` if `mmdc` is available).

This is a local port of gitdiagram's pipeline. The two prompts are verbatim from gitdiagram source ([prompts/explanation.md](prompts/explanation.md), [prompts/graph.md](prompts/graph.md)); the validator and renderer are ports of `src/server/generate/graph.ts`.

## Five-stage flow

You — the agent — drive stages 2 and 3 (the LLM work). Stages 1, 4, 5 are deterministic scripts. Do not skip stage 4: a graph that fails validation is **not** a valid output.

### 1. Gather inputs

Run from the project root (or pass the project root explicitly):

```bash
node <skill-dir>/scripts/gather-inputs.mjs [<repo-root>]
```

Returns JSON with:
- `repo_owner`, `repo_name`, `branch` — derived from `git remote get-url origin`; falls back to `local` / directory basename if no remote.
- `framework` — detected from the manifest filename (flutter / node / python / rust / go / …). Hint only; do not use for routing decisions.
- `file_tree` — newline-separated list of architecturally-relevant paths (one per line, includes directory entries). Filters out tests, lockfiles, platform shells (`ios/`, `android/`), assets, generated code.
- `readme` — full README text (empty if absent).
- `manifest` — `{ filename, content }` for the first matching manifest (`pubspec.yaml`, `package.json`, `pyproject.toml`, …). May be null.
- `stats` — counts for sanity-checking.

Save the JSON to a temp file (e.g. `g:/tmp/<repo>_inputs.json`) so you can refer back to `file_tree` exactly when emitting node paths in stage 3.

### 2. Draft the explanation

Follow [prompts/explanation.md](prompts/explanation.md) verbatim. Inputs: `file_tree`, `readme`, and `manifest.content` (wrapped as `<manifest>`).

Output: a `<explanation>...</explanation>` block, 8–16 short sections. Concrete, repo-specific. No Mermaid, no JSON.

Keep the explanation in your working context — stage 3 needs it.

### 3. Draft the graph JSON

Follow [prompts/graph.md](prompts/graph.md) verbatim. Inputs: the `<explanation>` you just wrote, plus `<file_tree>`, `<repo_owner>`, `<repo_name>`.

Output: a single JSON object matching the schema in [prompts/graph.md](prompts/graph.md). Save to a temp file (e.g. `g:/tmp/<repo>_graph.json`).

**Path discipline.** Every `node.path` must match a line in the `file_tree` you were given **exactly** (trimmed). Trailing slashes and casing matter. When in doubt, use `null` — a node without a path renders fine.

### 4. Validate

```bash
node <skill-dir>/scripts/validate-graph.mjs <graph.json> <repo-root>
```

- **Exit 0** with `OK — N groups, N nodes, N edges` → continue to stage 5.
- **Exit 1** with one `path: message` line per issue on stderr → these issues are the `<validation_feedback>` for the retry.

Retry up to **2 more times** (3 attempts total — gitdiagram's `MAX_GRAPH_ATTEMPTS`). On retry, feed:
- the previous JSON as `<previous_graph>`,
- the validator's stderr as `<validation_feedback>`,

and re-run the stage 3 prompt. If you still can't pass validation after 3 attempts, stop and surface the remaining issues to the user — do not write a partial diagram.

Common failure modes and the right reaction:
- `nodes.N.path: "..." does not exist in the repository file tree` → check spelling; if it really doesn't exist, set `path` to `null` or use the parent directory that does exist.
- `nodes.N.type: type len 76` (over 72) → tighten the type string.
- `nodes.N.id: bad id "..."` → the regex is `/^[a-z][a-z0-9_]*$/`. Lowercase, digits, underscores; must start with a letter.
- `groups: too many (11 > 10)` / `nodes: too many (35 > 34)` / `edges: too many (49 > 48)` → consolidate before retrying. The soft target is 14–24 nodes; the hard cap is 34.

### 5. Render

```bash
node <skill-dir>/scripts/render-mermaid.mjs <graph.json> <output.mmd> <repo_owner> <repo_name> <branch>
```

Default output path: `<repo-root>/docs/architecture.mmd` if `docs/` exists, otherwise `<repo-root>/architecture.mmd`. If the user passes an explicit path, honor it.

The renderer emits clickable GitHub links only when `repo_owner` is not `"local"` (i.e. the repo has an `origin` remote). Local-only repos get a plain diagram.

**Optional SVG.** If the user wants an SVG (or if it's a regeneration of an existing `.svg`), run:

```bash
npx -y -p @mermaid-js/mermaid-cli mmdc -i <output.mmd> -o <output.svg>
```

First-time `npx` install of `@mermaid-js/mermaid-cli` takes ~30s and pulls Chromium via puppeteer. Subsequent runs are fast.

## Report back

Tell the user:
- Where the `.mmd` (and `.svg`, if rendered) lives.
- Final node/group/edge counts (these are useful — close to the cap means there's more architecture than the diagram comfortably holds; well under the cap means the project is small or the decomposition is conservative).
- Whether you hit any validation retries (signals where the model's first instinct was wrong).

## When the user asks "increase by one more level of detail"

Pick the biggest aggregated nodes from the previous output (the ones with type-fields like `book + library providers` or `discovery providers`) and decompose them into 2–4 internal nodes. Re-run stages 3–5. If you're at the 34-node cap, you'll need to merge something else first — the schema forces the trade.

## When the user asks "make it simpler"

Aim for the lower end of the soft target (~14 nodes). Collapse one-to-one wrappers (e.g. `Service → External` pairs) into a single boundary node. Drop dashed "produces models" edges if they crowd the diagram.
