#!/usr/bin/env node
// Walks a local repo and produces the input bundle the prompts need:
//   { repo_owner, repo_name, branch, file_tree, readme, manifest, framework }
// file_tree is a newline-separated list of tracked files + directories,
// filtered to architecturally-relevant paths. Matches the shape gitdiagram's
// validator expects (one trimmed path per line).

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, basename, dirname, join } from "node:path";

const repoRoot = resolve(process.argv[2] ?? process.cwd());
if (!existsSync(repoRoot)) {
  console.error(`error: repo path does not exist: ${repoRoot}`);
  process.exit(2);
}

const sh = (cmd) => execSync(cmd, { cwd: repoRoot, encoding: "utf8" }).trim();

let tracked;
try {
  tracked = sh("git ls-files").split("\n").filter(Boolean);
} catch {
  console.error(`error: not a git repo: ${repoRoot}`);
  process.exit(2);
}

// Exclusions — drop paths that don't contribute to architecture.
// Each entry is matched against the full repo-relative path.
const EXCLUDE_PATTERNS = [
  /^\./,                           // dotfiles / dotdirs at root
  /(^|\/)\.[^/]+\//,               // any nested .dir/
  /^(node_modules|vendor|target|dist|build|out|coverage|tmp|cache)\//,
  /^(ios|android|web|macos|windows|linux)\//,            // mobile/desktop platform shells
  /^(assets|public|static|images|img|fonts|icons)\//,
  /\.(png|jpg|jpeg|gif|svg|webp|ico|pdf|woff2?|ttf|eot|mp4|mov|mp3|wav)$/i,
  /\.(lock|sum)$/i,                                      // *.lock, go.sum
  /(^|\/)(package-lock|yarn|bun|pnpm|composer|Gemfile)\.lock$/i,
  /(^|\/)(test|tests|__tests__|spec|specs|e2e)\//,
  /[._-](test|spec)\.[^/]+$/i,                           // foo.test.ts, foo_test.go, foo-spec.rb
  /(^|\/)test_[^/]+\.[^/]+$/,                            // test_foo.py
  /\.(g|freezed|gen|generated)\.[^/]+$/,                 // *.g.dart, *.freezed.dart, *.gen.ts
  /(^|\/)firebase_options\.dart$/,
  /(^|\/)(CHANGELOG|LICENSE|LICENCE|NOTICE|CONTRIBUTING|CODE_OF_CONDUCT)(\.[^/]+)?$/i,
];

const isIncluded = (path) => !EXCLUDE_PATTERNS.some((re) => re.test(path));
const files = tracked.filter(isIncluded);

// Derive directory entries so the LLM can reference paths like "lib/widgets"
// (which is what the validator's buildFileTreeLookup uses for exact match).
const dirs = new Set();
for (const f of files) {
  const parts = f.split("/");
  for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join("/"));
}

const fileTreeLines = [...new Set([...files, ...dirs])].sort();

// README — try common names.
const readmeName = ["README.md", "README.MD", "Readme.md", "README", "README.rst", "README.txt"]
  .find((n) => existsSync(join(repoRoot, n)));
const readme = readmeName ? readFileSync(join(repoRoot, readmeName), "utf8") : "";

// Manifest detection — picks the first match. Framework names are deliberately
// loose; they're a hint to the LLM, not a routing decision.
const MANIFESTS = [
  { file: "pubspec.yaml",     framework: "flutter" },
  { file: "package.json",     framework: "node" },
  { file: "pyproject.toml",   framework: "python" },
  { file: "requirements.txt", framework: "python" },
  { file: "Cargo.toml",       framework: "rust" },
  { file: "go.mod",           framework: "go" },
  { file: "build.gradle.kts", framework: "kotlin" },
  { file: "build.gradle",     framework: "gradle" },
  { file: "pom.xml",          framework: "maven" },
  { file: "Gemfile",          framework: "ruby" },
  { file: "composer.json",    framework: "php" },
  { file: "mix.exs",          framework: "elixir" },
];
let manifest = null;
let framework = null;
for (const m of MANIFESTS) {
  const p = join(repoRoot, m.file);
  if (existsSync(p)) {
    manifest = { filename: m.file, content: readFileSync(p, "utf8") };
    framework = m.framework;
    break;
  }
}

// Repo identity — try git remote first, fall back to directory basename.
let repoOwner = "local";
let repoName = basename(repoRoot);
try {
  const remote = sh("git remote get-url origin");
  // matches git@github.com:owner/repo.git OR https://github.com/owner/repo(.git)
  const match = remote.match(/[:/]([^/:]+)\/([^/]+?)(?:\.git)?$/);
  if (match) {
    repoOwner = match[1];
    repoName = match[2];
  }
} catch {
  // no remote — that's fine, click links will just point to a fake URL
}

let branch = "main";
try {
  branch = sh("git rev-parse --abbrev-ref HEAD") || "main";
} catch {}

process.stdout.write(JSON.stringify({
  repo_owner: repoOwner,
  repo_name: repoName,
  branch,
  framework,
  file_tree: fileTreeLines.join("\n"),
  readme,
  manifest,
  stats: {
    tracked_files: tracked.length,
    included_files: files.length,
    tree_lines: fileTreeLines.length,
  },
}, null, 2));
