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

function readState(root, feature, taskId) {
  const rel = stateRelative(feature, taskId);
  let file;
  try { file = checkAncestors(root, rel, { targetMayExist: true, allowMissing: false, allowReserved: true }); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
  let state;
  try { state = JSON.parse(fs.readFileSync(file, "utf8")); } catch (error) { throw new Error(`Run state is unreadable; refusing to proceed: ${error.message}`); }
  if (state.schemaVersion !== STATE_VERSION || state.feature !== feature || state.taskId !== taskId || !Array.isArray(state.attempts)) throw new Error("Run state has an unsupported or invalid schema; refusing to proceed.");
  return state;
}

function makeDirs(root, relativePath) {
  const parts = relativePath.split("/");
  let current = root;
  for (const part of parts) {
    current = path.join(current, part);
    try {
      const stat = fs.lstatSync(current);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`Unsafe workflow directory: ${current}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      fs.mkdirSync(current, { mode: 0o700 });
    }
  }
}

function atomicJson(root, relativePath, value) {
  const parent = path.posix.dirname(relativePath);
  makeDirs(root, parent);
  const target = path.join(root, ...relativePath.split("/"));
  checkAncestors(root, relativePath, { targetMayExist: true, allowMissing: true, allowReserved: true });
  const temp = `${target}.${process.pid}.${crypto.randomBytes(8).toString("hex")}.tmp`;
  const fd = fs.openSync(temp, "wx", 0o600);
  try {
    fs.writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    fs.fsyncSync(fd);
  } finally { fs.closeSync(fd); }
  try { fs.renameSync(temp, target); } catch (error) { try { fs.unlinkSync(temp); } catch {} throw error; }
}

function atomicCreateFile(root, op) {
  const parentRel = path.posix.dirname(op.targetRelative);
  if (parentRel !== ".") makeDirs(root, parentRel);
  checkAncestors(root, op.targetRelative, { targetMayExist: false, allowMissing: true });
  const temp = path.join(path.dirname(op.target), `.${path.basename(op.target)}.${process.pid}.${crypto.randomBytes(8).toString("hex")}.tmp`);
  const fd = fs.openSync(temp, "wx", 0o644);
  try {
    fs.writeFileSync(fd, op.action.content, "utf8");
    fs.fsyncSync(fd);
  } finally { fs.closeSync(fd); }
  try {
    fs.linkSync(temp, op.target);
    fs.unlinkSync(temp);
  } catch (error) { try { fs.unlinkSync(temp); } catch {} throw error; }
}

function runTask(feature, taskId, approvedDigest, rootArg) {
  const root = projectRoot(rootArg);
  const op = loadAction(root, feature, taskId);
  if (typeof approvedDigest !== "string" || approvedDigest !== op.approvalDigest) throw new Error(`Approval digest mismatch. Review the plan and approve its exact digest: ${op.approvalDigest}`);

  const statePath = stateRelative(feature, taskId);
  const lockPath = lockRelative(feature, taskId);
  const state = readState(root, feature, taskId) || { schemaVersion: STATE_VERSION, feature, taskId, attempts: [] };
  if (state.latestStatus === "running") throw new Error(`Task ${taskId} has an unresolved prior run. Inspect with: specly recover ${feature} --task ${taskId}`);
  makeDirs(root, `.specly/runs/${feature}`);
  const lockAbs = path.join(root, ...lockPath.split("/"));
  let lockFd;
  try { lockFd = fs.openSync(lockAbs, "wx", 0o600); } catch (error) { if (error.code === "EEXIST") throw new Error(`Task ${taskId} already has an active or interrupted run. Inspect with: specly recover ${feature} --task ${taskId}`); throw error; }
  fs.writeFileSync(lockFd, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
  fs.fsyncSync(lockFd);
  fs.closeSync(lockFd);

  const attempt = { approvalDigest: op.approvalDigest, action: "write-file", target: op.targetRelative, contentSha256: op.contentDigest, status: "running", startedAt: new Date().toISOString() };
  state.attempts.push(attempt);
  state.latestStatus = "running";
  state.lastUpdatedAt = attempt.startedAt;
  try { atomicJson(root, statePath, state); } catch (error) { try { fs.unlinkSync(lockAbs); } catch {} throw error; }

  try {
    atomicCreateFile(root, op);
    attempt.status = "completed";
    attempt.finishedAt = new Date().toISOString();
    attempt.evidence = { targetExists: true, contentSha256: sha256(fs.readFileSync(op.target)) };
    state.latestStatus = "completed";
    state.lastUpdatedAt = attempt.finishedAt;
    atomicJson(root, statePath, state);
    console.log(`Completed task ${taskId}: created ${op.targetRelative}`);
    console.log(`Evidence: SHA-256 ${attempt.evidence.contentSha256}`);
  } catch (error) {
    attempt.status = "failed";
    attempt.finishedAt = new Date().toISOString();
    attempt.error = error.message;
    state.latestStatus = "failed";
    state.lastUpdatedAt = attempt.finishedAt;
    atomicJson(root, statePath, state);
    throw error;
  } finally {
    try { fs.unlinkSync(lockAbs); } catch {}
  }
}

function printRecovery(feature, taskId, rootArg, confirmStopped = false) {
  const root = projectRoot(rootArg);
  const op = loadAction(root, feature, taskId, { targetMayExist: true });
  const state = readState(root, feature, taskId);
  const lockRel = lockRelative(feature, taskId);
  const lockAbs = checkAncestors(root, lockRel, { targetMayExist: true, allowMissing: true, allowReserved: true });
  let lock = null;
  try { lock = JSON.parse(fs.readFileSync(lockAbs, "utf8")); } catch (error) { if (error.code !== "ENOENT") throw new Error(`Run lock is unreadable: ${error.message}`); }
  if (!state || !state.attempts.length) {
    console.log(`No durable run state found for ${feature} task ${taskId}.`);
    return;
  }
  const last = state.attempts[state.attempts.length - 1];
  const target = checkAncestors(root, op.targetRelative, { targetMayExist: true, allowMissing: true });
  let actualDigest = null;
  try { actualDigest = sha256(fs.readFileSync(target)); } catch (error) { if (error.code !== "ENOENT") throw error; }
  console.log(`Run state: ${state.latestStatus}`);
  console.log(`Attempt started: ${last.startedAt}`);
  console.log(`Target: ${op.targetRelative}`);
  console.log(`Target evidence: ${actualDigest ? `present, SHA-256 ${actualDigest}` : "absent"}`);
  if (lock) console.log(`Lock owner PID: ${lock.pid}`);

  if (state.latestStatus !== "running") {
    console.log("No interrupted attempt requires reconciliation.");
    return;
  }
  if (!confirmStopped) {
    console.log(`Possible interruption: no automatic retry. After confirming process ${lock ? lock.pid : "unknown"} has stopped, rerun with --confirm-stopped.`);
    return;
  }
  if (lock && Number.isInteger(lock.pid)) {
    try { process.kill(lock.pid, 0); throw new Error(`Process ${lock.pid} is still running; refusing reconciliation.`); }
    catch (error) { if (error.code !== "ESRCH") throw error; }
  }
  if (last.approvalDigest !== op.approvalDigest || last.target !== op.targetRelative || last.contentSha256 !== op.contentDigest) {
    throw new Error("The action or tasks changed since the interrupted attempt; refusing reconciliation.");
  }
  if (actualDigest && actualDigest !== op.contentDigest) throw new Error("Target exists with different content; inspect it manually. Nothing changed.");
  last.status = actualDigest ? "completed" : "interrupted";
  last.finishedAt = new Date().toISOString();
  last.evidence = actualDigest ? { targetExists: true, contentSha256: actualDigest, reconciled: true } : { targetExists: false, retryRequiresFreshRunApproval: true };
  state.latestStatus = last.status;
  state.lastUpdatedAt = last.finishedAt;
  atomicJson(root, stateRelative(feature, taskId), state);
  try { fs.unlinkSync(lockAbs); } catch (error) { if (error.code !== "ENOENT") throw error; }
  console.log(`Reconciled state as ${last.status}. ${actualDigest ? "No additional target write occurred during recovery." : "A new explicit plan and run approval are required to retry."}`);
}

module.exports = { printTaskPlan, runTask, printRecovery };
