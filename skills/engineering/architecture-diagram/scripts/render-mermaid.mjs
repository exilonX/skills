#!/usr/bin/env node
// Renders a diagram-graph JSON to Mermaid flowchart text.
//   node render-mermaid.mjs <graph.json> <output.mmd> [<repo-owner> <repo-name> <branch>]
// Faithful port of compileDiagramGraph from gitdiagram's
// src/server/generate/graph.ts: subgraphs, shape switch, dashed connector,
// label + secondary detail + bracketed file hint, suppression of generic types,
// clickable links (only when repo-owner is set to something other than "local"),
// 6-tone classDef cycling per group.

import { readFileSync, writeFileSync } from "node:fs";

const [, , graphPath, outPath, ownerArg, nameArg, branchArg] = process.argv;
if (!graphPath || !outPath) {
  console.error("usage: render-mermaid.mjs <graph.json> <output.mmd> [owner name branch]");
  process.exit(2);
}

const graph = JSON.parse(readFileSync(graphPath, "utf8"));
const owner = ownerArg ?? "local";
const repo = nameArg ?? "repo";
const branch = branchArg ?? "main";
const clickable = owner !== "local";

const GENERIC_TYPES = new Set([
  "app", "application", "component", "directory", "folder", "library",
  "module", "package", "project", "repo", "repository", "service",
  "system", "utility",
]);
const MAX_FILE_HINT = 18;

const esc = (v) => v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').trim();
const nodeMid = (id) => `node_${id}`;
const groupMid = (id) => `group_${id}`;

function detailForNode(n) {
  const t = n.type.trim();
  if (!t) return null;
  const lt = t.toLowerCase();
  const ll = n.label.trim().toLowerCase();
  if (GENERIC_TYPES.has(lt) || lt === ll || lt.includes(ll) || ll.includes(lt) || t.split(/\s+/).length > 4) return null;
  return esc(t);
}

function fileHint(n) {
  const p = n.path?.trim();
  if (!p || p.endsWith("/") || !p.includes(".")) return null;
  const fn = p.split("/").pop()?.trim();
  if (!fn || fn.length > MAX_FILE_HINT) return null;
  return `[${esc(fn)}]`;
}

const labelFor = (n) => [esc(n.label), detailForNode(n), fileHint(n)].filter(Boolean).join("<br/>");

function renderNode(n) {
  const label = labelFor(n);
  const shape = n.shape ?? "box";
  const id = nodeMid(n.id);
  switch (shape) {
    case "database": return `${id}[("${label}")]`;
    case "circle":   return `${id}(("${label}"))`;
    case "hexagon":  return `${id}{{"${label}"}}`;
    default:         return `${id}["${label}"]`;
  }
}

function renderEdge(e) {
  const connector = e.style === "dashed" ? "-.->" : "-->";
  const from = nodeMid(e.from), to = nodeMid(e.to);
  if (!e.label) return `${from} ${connector} ${to}`;
  return `${from} ${connector}|"${esc(e.label)}"| ${to}`;
}

const TONES = ["toneBlue", "toneAmber", "toneMint", "toneRose", "toneIndigo", "toneTeal"];
const groupOrder = new Map(graph.groups.map((g, i) => [g.id, i]));
const tone = (gid) => {
  if (!gid) return "toneNeutral";
  const i = groupOrder.get(gid);
  return i === undefined ? "toneNeutral" : TONES[i % TONES.length];
};

const githubUrl = (path) => {
  const isFile = path.includes(".") && !path.endsWith("/");
  return `https://github.com/${owner}/${repo}/${isFile ? "blob" : "tree"}/${branch}/${path}`;
};

const lines = ["flowchart TD"];
const grouped = new Set();
const classMap = new Map();

const push = (n, indent = "") => {
  lines.push(`${indent}${renderNode(n)}`);
  const cls = tone(n.groupId);
  classMap.set(cls, [...(classMap.get(cls) ?? []), n.id]);
};

for (const g of graph.groups) {
  lines.push("");
  lines.push(`subgraph ${groupMid(g.id)}["${esc(g.label)}"]`);
  for (const n of graph.nodes.filter((n) => n.groupId === g.id)) {
    push(n, "  ");
    grouped.add(n.id);
  }
  lines.push("end");
}

const ungrouped = graph.nodes.filter((n) => !grouped.has(n.id));
if (ungrouped.length) {
  lines.push("");
  for (const n of ungrouped) push(n);
}

if (graph.edges.length) {
  lines.push("");
  for (const e of graph.edges) lines.push(renderEdge(e));
}

if (clickable) {
  const linked = graph.nodes.filter((n) => n.path);
  if (linked.length) {
    lines.push("");
    for (const n of linked) lines.push(`click ${nodeMid(n.id)} "${githubUrl(n.path)}"`);
  }
}

lines.push("");
lines.push("classDef toneNeutral fill:#f8fafc,stroke:#334155,stroke-width:1.5px,color:#0f172a");
lines.push("classDef toneBlue fill:#dbeafe,stroke:#2563eb,stroke-width:1.5px,color:#172554");
lines.push("classDef toneAmber fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#78350f");
lines.push("classDef toneMint fill:#dcfce7,stroke:#16a34a,stroke-width:1.5px,color:#14532d");
lines.push("classDef toneRose fill:#ffe4e6,stroke:#e11d48,stroke-width:1.5px,color:#881337");
lines.push("classDef toneIndigo fill:#e0e7ff,stroke:#4f46e5,stroke-width:1.5px,color:#312e81");
lines.push("classDef toneTeal fill:#ccfbf1,stroke:#0f766e,stroke-width:1.5px,color:#134e4a");

for (const [cls, ids] of classMap) {
  if (!ids.length) continue;
  lines.push(`class ${ids.map(nodeMid).join(",")} ${cls}`);
}

writeFileSync(outPath, lines.join("\n").trim() + "\n");
console.log(`Wrote ${outPath}`);
