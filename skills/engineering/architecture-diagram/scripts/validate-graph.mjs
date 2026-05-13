#!/usr/bin/env node
// Validates a diagram-graph JSON against gitdiagram's schema + structural rules.
//   node validate-graph.mjs <graph.json> <repo-root>
// Exit 0 with summary on success; exit 1 with one "path: message" line per
// issue on failure — that output is what the prompt expects as
// <validation_feedback> when retrying.
//
// Schema reference: gitdiagram src/features/diagram/graph.ts
//   MAX_GROUPS=10, MAX_NODES=34, MAX_EDGES=48, MAX_LABEL=72, MAX_TYPE=72,
//   MAX_DESCRIPTION=240, MAX_PATH=512.

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const [, , graphPath, repoRootArg] = process.argv;
if (!graphPath || !repoRootArg) {
  console.error("usage: validate-graph.mjs <graph.json> <repo-root>");
  process.exit(2);
}
const repoRoot = resolve(repoRootArg);

const ID_RE = /^[a-z][a-z0-9_]*$/;
const MAX_GROUPS = 10, MAX_NODES = 34, MAX_EDGES = 48;
const MAX_LABEL = 72, MAX_TYPE = 72, MAX_DESC = 240, MAX_PATH = 512;
const SHAPES = new Set(["box", "database", "queue", "document", "circle", "hexagon"]);
const STYLES = new Set(["solid", "dashed"]);

let graph;
try {
  graph = JSON.parse(readFileSync(graphPath, "utf8"));
} catch (e) {
  console.error(`graph: not valid JSON — ${e.message}`);
  process.exit(1);
}

const issues = [];
const push = (path, msg) => issues.push(`${path}: ${msg}`);

const tree = execSync("git ls-files", { cwd: repoRoot, encoding: "utf8" });
const fileSet = new Set(tree.split("\n").map((l) => l.trim()).filter(Boolean));
const dirSet = new Set();
for (const f of fileSet) {
  const parts = f.split("/");
  for (let i = 1; i < parts.length; i++) dirSet.add(parts.slice(0, i).join("/"));
}
const lookup = new Set([...fileSet, ...dirSet]);

const requireArr = (key) => {
  if (!Array.isArray(graph[key])) {
    push(key, `must be an array`);
    return false;
  }
  return true;
};

if (!requireArr("groups") || !requireArr("nodes") || !requireArr("edges")) {
  for (const i of issues) console.error(i);
  process.exit(1);
}

if (graph.groups.length > MAX_GROUPS) push("groups", `too many (${graph.groups.length} > ${MAX_GROUPS})`);
if (graph.nodes.length < 1) push("nodes", `must have at least 1 node`);
if (graph.nodes.length > MAX_NODES) push("nodes", `too many (${graph.nodes.length} > ${MAX_NODES})`);
if (graph.edges.length > MAX_EDGES) push("edges", `too many (${graph.edges.length} > ${MAX_EDGES})`);

const groupIds = new Set();
graph.groups.forEach((g, i) => {
  if (typeof g?.id !== "string" || !ID_RE.test(g.id)) push(`groups.${i}.id`, `bad id "${g?.id}" (must match /^[a-z][a-z0-9_]*$/)`);
  if (groupIds.has(g.id)) push(`groups.${i}.id`, `duplicate "${g.id}"`);
  groupIds.add(g.id);
  if (typeof g?.label !== "string" || !g.label.trim() || g.label.length > MAX_LABEL) push(`groups.${i}.label`, `label missing or > ${MAX_LABEL} chars (got ${g?.label?.length})`);
  if (g?.description !== null && (typeof g?.description !== "string" || g.description.length > MAX_DESC)) push(`groups.${i}.description`, `must be string or null, max ${MAX_DESC} chars`);
});

const nodeIds = new Set();
graph.nodes.forEach((n, i) => {
  if (typeof n?.id !== "string" || !ID_RE.test(n.id)) push(`nodes.${i}.id`, `bad id "${n?.id}" (must match /^[a-z][a-z0-9_]*$/)`);
  if (nodeIds.has(n.id)) push(`nodes.${i}.id`, `duplicate "${n.id}"`);
  nodeIds.add(n.id);
  if (typeof n?.label !== "string" || !n.label.trim() || n.label.length > MAX_LABEL) push(`nodes.${i}.label`, `label missing or > ${MAX_LABEL} chars (got ${n?.label?.length})`);
  if (typeof n?.type !== "string" || !n.type.trim() || n.type.length > MAX_TYPE) push(`nodes.${i}.type`, `type missing or > ${MAX_TYPE} chars (got ${n?.type?.length})`);
  if (n?.description !== null && (typeof n?.description !== "string" || n.description.length > MAX_DESC)) push(`nodes.${i}.description`, `must be string or null, max ${MAX_DESC} chars`);
  if (n?.groupId !== null && !groupIds.has(n.groupId)) push(`nodes.${i}.groupId`, `unknown group "${n.groupId}"`);
  if (n?.path !== null) {
    if (typeof n?.path !== "string" || n.path.length < 1 || n.path.length > MAX_PATH) {
      push(`nodes.${i}.path`, `path must be string (1..${MAX_PATH}) or null`);
    } else if (!lookup.has(n.path)) {
      push(`nodes.${i}.path`, `"${n.path}" does not exist in the repository file tree`);
    }
  }
  if (n?.shape !== null && !SHAPES.has(n.shape)) push(`nodes.${i}.shape`, `bad shape "${n.shape}" (allowed: ${[...SHAPES].join(", ")})`);
});

graph.edges.forEach((e, i) => {
  if (!nodeIds.has(e?.from)) push(`edges.${i}.from`, `unknown source node "${e?.from}"`);
  if (!nodeIds.has(e?.to)) push(`edges.${i}.to`, `unknown target node "${e?.to}"`);
  if (e?.label !== null && (typeof e?.label !== "string" || !e.label.trim() || e.label.length > MAX_LABEL)) push(`edges.${i}.label`, `label must be non-empty string or null, max ${MAX_LABEL} chars`);
  if (e?.style !== null && !STYLES.has(e.style)) push(`edges.${i}.style`, `bad style "${e.style}" (allowed: solid, dashed)`);
});

if (issues.length === 0) {
  console.log(`OK — ${graph.groups.length} groups, ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
  process.exit(0);
} else {
  for (const i of issues) console.error(i);
  process.exit(1);
}
