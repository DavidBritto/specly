const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { detectAgent, resolvePaths } = require("./agents");

const ACTION_VERSION = 1;
const STATE_VERSION = 1;
const FEATURE_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const TASK_RE = /^\d+(?:\.\d+)*$/;

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return JSON.stringify(value);
}

function projectRoot(root) {
  return fs.realpathSync(path.resolve(root));
}

function ensureRelative(root, relativePath, allowReserved = false) {
  if (typeof relativePath !== "string" || relativePath.length === 0 || relativePath.includes("\\") || relativePath.includes("\0") || path.isAbsolute(relativePath) || path.win32.isAbsolute(relativePath)) {
    throw new Error("Action path must be a non-empty relative POSIX path.");
  }
  const parts = relativePath.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) {
    throw new Error("Action path cannot contain empty, current, or parent path segments.");
  }
  if (!allowReserved && [".git", ".specly"].includes(parts[0].toLowerCase())) {
    throw new Error(`Action path cannot write inside reserved ${parts[0]} directory.`);
  }
  const absolute = path.resolve(root, ...parts);
  const back = path.relative(root, absolute);
  if (!back || back.startsWith(`..${path.sep}`) || back === ".." || path.isAbsolute(back)) {
    throw new Error("Action path must remain inside the project root.");
  }
  return { absolute, parts };
}

function checkAncestors(root, relativePath, { targetMayExist = false, allowMissing = true, allowReserved = false } = {}) {
  const { absolute, parts } = ensureRelative(root, relativePath, allowReserved);
  let current = root;
  for (let i = 0; i < parts.length; i++) {
    current = path.join(current, parts[i]);
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch (error) {
      if (error.code === "ENOENT" && allowMissing) continue;
      throw error;
    }
    if (stat.isSymbolicLink()) throw new Error(`Symbolic links are not allowed in action paths: ${relativePath}`);
    const isTarget = i === parts.length - 1;
    if (isTarget && !targetMayExist) throw new Error(`Action target already exists: ${relativePath}`);
    if (!isTarget && !stat.isDirectory()) throw new Error(`Action parent is not a directory: ${current}`);
  }
  return absolute;
}

function readRequired(root, relativePath, label) {
  const safe = checkAncestors(root, relativePath, { targetMayExist: true, allowMissing: false, allowReserved: label === "action manifest" });
  try {
    return fs.readFileSync(safe, "utf8");
  } catch (error) {
    throw new Error(`Cannot read ${label}: ${error.message}`);
  }
}

function taskFile(root, feature) {
  const paths = resolvePaths(detectAgent(root), feature, root);
  return path.relative(root, path.join(paths.specsDir, "tasks.md")).split(path.sep).join("/");
}

function parseTasks(content) {
  const tasks = new Map();
  for (const match of content.matchAll(/^\s*-\s+\[([ xX])\]\s+(\d+(?:\.\d+)*)(?:\.)?(?:\s+(.*))?$/gm)) {
    const id = match[2];
    if (tasks.has(id)) throw new Error(`Duplicate task ID in tasks.md: ${id}`);
    tasks.set(id, { checked: match[1].toLowerCase() === "x", description: (match[3] || "").trim() });
  }
  return tasks;
}

function manifestPath(feature) {
  return `.specly/actions/${feature}.json`;
}

function loadAction(root, feature, taskId, { targetMayExist = false } = {}) {
  if (!FEATURE_RE.test(feature)) throw new Error("Invalid feature name.");
  if (!TASK_RE.test(taskId || "")) throw new Error("Task ID must be numeric, such as 1.1.");
  const tasksPath = taskFile(root, feature);
  const tasks = parseTasks(readRequired(root, tasksPath, "tasks.md"));
  if (!tasks.has(taskId)) throw new Error(`Task ID ${taskId} is not present in ${tasksPath}.`);

  const manifestText = readRequired(root, manifestPath(feature), "action manifest");
  let manifest;
  try { manifest = JSON.parse(manifestText); } catch (error) { throw new Error(`Action manifest is not valid JSON: ${error.message}`); }
  if (!manifest || manifest.schemaVersion !== ACTION_VERSION || manifest.feature !== feature || !Array.isArray(manifest.actions)) {
    throw new Error(`Action manifest must use schemaVersion ${ACTION_VERSION}, match feature ${feature}, and contain actions[].`);
  }
  if (Object.keys(manifest).some((key) => !["schemaVersion", "feature", "actions"].includes(key))) throw new Error("Action manifest contains unsupported top-level fields.");
  const seen = new Set();
  for (const action of manifest.actions) {
    if (!action || typeof action !== "object" || Array.isArray(action) || Object.keys(action).some((key) => !["taskId", "type", "path", "content"].includes(key))) throw new Error("Action contains unsupported fields.");
    if (!TASK_RE.test(action.taskId || "") || seen.has(action.taskId)) throw new Error("Action task IDs must be unique numeric IDs.");
    seen.add(action.taskId);
    if (action.type !== "write-file" || typeof action.path !== "string" || typeof action.content !== "string") throw new Error(`Task ${action.taskId} must declare exactly one write-file action with string path and content.`);
  }
  const matches = manifest.actions.filter((action) => action.taskId === taskId);
  if (matches.length !== 1) throw new Error(`Action manifest must declare exactly one action for task ${taskId}.`);
  const action = matches[0];
  const target = ensureRelative(root, action.path);
  checkAncestors(root, action.path, { targetMayExist, allowMissing: true });
  const tasksText = fs.readFileSync(path.join(root, tasksPath), "utf8");
  const manifestDigest = sha256(manifestText);
  const contentDigest = sha256(Buffer.from(action.content, "utf8"));
  const targetRelative = path.relative(root, target.absolute).split(path.sep).join("/");
  const digestInput = {
    schemaVersion: ACTION_VERSION,
    projectRoot: root,
    feature,
    taskId,
    tasksSha256: sha256(tasksText),
    manifestSha256: manifestDigest,
    action: { type: action.type, path: targetRelative, contentSha256: contentDigest },
  };
  const approvalDigest = sha256(stableJson(digestInput));
  const dirs = [];
  let parent = path.dirname(target.absolute);
  while (parent !== root && parent.startsWith(`${root}${path.sep}`)) {
    try { fs.lstatSync(parent); } catch (error) { if (error.code === "ENOENT") dirs.unshift(path.relative(root, parent).split(path.sep).join("/")); else throw error; }
    parent = path.dirname(parent);
  }
  return { feature, taskId, action, task: tasks.get(taskId), tasksPath, target: target.absolute, targetRelative, contentDigest, manifestDigest, approvalDigest, dirs, digestInput };
}

function printTaskPlan(feature, taskId, root) {
  root = projectRoot(root);
  const op = loadAction(root, feature, taskId);
  const runDir = `.specly/runs/${feature}`;
  checkAncestors(root, `${runDir}/.path-check`, { targetMayExist: true, allowMissing: true, allowReserved: true });
  const stateDirs = [];
  for (const part of [".specly", ".specly/runs", runDir]) {
    try {
      const stat = fs.lstatSync(path.join(root, ...part.split("/")));
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`Unsafe workflow directory: ${part}`);
    } catch (error) {
      if (error.code === "ENOENT") stateDirs.push(part);
      else throw error;
    }
  }
  console.log(`Specly task plan — ${feature} / ${taskId} (read-only)`);
  console.log(`Task: ${op.task.description || "(no description)"}${op.task.checked ? " [already checked]" : ""}`);
  console.log(`Action: write-file`);
  console.log(`Target: ${op.targetRelative}`);
  console.log(`Content: ${Buffer.byteLength(op.action.content, "utf8")} UTF-8 bytes; SHA-256 ${op.contentDigest}`);
  console.log(`Directories to create: ${op.dirs.length ? op.dirs.join(", ") : "none"}`);
  console.log(`Durable state: ${stateRelative(feature, taskId)}; transient lock: ${lockRelative(feature, taskId)} (removed after a normal run).`);
  console.log(`Workflow directories to create: ${stateDirs.length ? stateDirs.join(", ") : "none"}`);
  console.log("Effects: create one new target file and update one separate workflow state file; no overwrite, dependency change, external command, network, credential, or IDE access.");
  console.log("Permission required: write access to the target, its missing parents, and the listed workflow state directory.");
  console.log(`Approval digest: ${op.approvalDigest}`);
}

function stateRelative(feature, taskId) { return `.specly/runs/${feature}/${taskId}.json`; }
function lockRelative(feature, taskId) { return `.specly/runs/${feature}/${taskId}.lock`; }

module.exports = { printTaskPlan };
