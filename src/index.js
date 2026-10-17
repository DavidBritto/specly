#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  detectAgent,
  resolvePaths,
  listAgents,
  getAgent,
  SPEC_FILES,
  STEERING_FILE,
} = require("./agents");
const { deployAndOpen } = require("./ide");
const { printTaskPlan, printTaskVerify, runTask, printRecovery } = require("./workflow");

const TEMPLATE_DIR = path.join(__dirname, "templates");

function parseArgs(argv, startIndex = 2) {
  const args = {
    agent: null,
    feature: "starter",
    help: false,
    list: false,
    force: false,
  };

  for (let i = startIndex; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--list" || arg === "-l") args.list = true;
    else if (arg === "--force" || arg === "-f") args.force = true;
    else if (arg === "--agent" || arg === "-a") args.agent = argv[++i];
    else if (arg === "--feature" || arg === "--name" || arg === "-n")
      args.feature = argv[++i];
    else if (!arg.startsWith("-") && !args.agent) args.agent = arg;
  }

  return args;
}

function printHelp() {
  const agents = listAgents().join(", ");
  console.log(`
specly — Spec-Driven Development scaffolding
by davidops — https://www.npmjs.com/~davidops

Usage:
  npx specly [options]
  npx specly init [options]
  npx specly doctor
  npx specly plan <feature>
  npx specly plan <feature> --task <id>
  npx specly run <feature> --task <id> --approve <digest>
  npx specly recover <feature> --task <id>
  npx specly verify <feature>

Commands:
  init                    Create the SDD files (default; legacy syntax remains supported)
  doctor                  Check runtime, agent, and template readiness without changing files
  plan <feature>          Show proposed local writes and effects without executing them
  run <feature>           Apply one approved write-file action from .specly/actions/<feature>.json
  recover <feature>       Diagnose or reconcile an interrupted write action
  verify <feature>        Inspect local artifacts and report observed workflow evidence

Options:
  -a, --agent <name>      Target agent (${agents})
  -n, --feature <name>    Feature name (default: starter)
  -f, --force             Overwrite existing files
  -l, --list              List supported agents
  -h, --help              Show this help

Examples:
  npx specly
  npx specly --agent cursor --feature auth
  npx specly --agent kiro -n payments
  npx specly --agent generic
`);
}

function parseWorkflowArgs(argv) {
  let feature = null;
  let taskId = null;
  let approval = null;
  let confirmStopped = false;
  for (let i = 3; i < argv.length; i++) {
    if (argv[i] === "--feature" || argv[i] === "--name" || argv[i] === "-n") {
      feature = argv[++i];
    } else if (argv[i] === "--task") {
      taskId = argv[++i];
    } else if (argv[i] === "--approve") {
      approval = argv[++i];
    } else if (argv[i] === "--confirm-stopped") {
      confirmStopped = true;
    } else if (!argv[i].startsWith("-") && !feature) feature = argv[i];
    else throw new Error(`Unexpected argument: ${argv[i]}`);
  }
  if (!feature || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(feature)) {
    throw new Error("Usage: specly <plan|verify> <feature> (feature names may contain letters, numbers, dots, underscores, and hyphens)");
  }
  return { feature, taskId, approval, confirmStopped };
}

function printPlan(feature, root) {
  const agent = detectAgent(root);
  const layout = resolvePaths(agent, feature, root);
  const files = [
    ...SPEC_FILES.map((name) => [name, path.join(layout.specsDir, name)]),
    [STEERING_FILE, layout.steeringPath],
    ["how-to-use.md", layout.howToUsePath],
  ];

  console.log(`Specly plan — ${feature} (read-only; nothing is executed)\n`);
  console.log(`Agent: ${layout.label} (${agent})`);
  console.log(`Feature specs: ${layout.relativeSpecsDir}/\n`);
  console.log("Proposed local file writes:");
  for (const [name, file] of files) {
    const state = fs.existsSync(file) ? "preserve existing file" : "create if init is separately approved";
    console.log(`  ${state}: ${path.relative(root, file)} (${name})`);
  }
  console.log("\nDependency changes: none.");
  console.log("External commands: none.");
  console.log("Permissions: this plan reads local paths only; a later init would need write access to the listed missing paths.");
  console.log("Network, credentials, and IDE launch: none.");
}

function readCheck(root, relativePath) {
  try {
    const content = fs.readFileSync(path.join(root, relativePath), "utf8");
    return { status: "passed", content };
  } catch (error) {
    return { status: error.code === "ENOENT" ? "failed" : "unavailable", content: "" };
  }
}

function checkboxState(content) {
  const boxes = [...content.matchAll(/^\s*- \[([ xX])\]/gm)];
  if (boxes.length === 0) return "unavailable";
  return boxes.every((box) => box[1].toLowerCase() === "x") ? "passed" : "failed";
}

function printVerify(feature, root) {
  const agent = detectAgent(root);
  const layout = resolvePaths(agent, feature, root);
  const checks = [];
  let tasks = "";
  let verification = "";
  for (const name of SPEC_FILES) {
    const relativePath = path.relative(root, path.join(layout.specsDir, name));
    const result = readCheck(root, relativePath);
    checks.push({ label: `${name} exists and is readable`, status: result.status });
    if (name === "tasks.md") tasks = result.content;
    if (name === "verification.md") verification = result.content;
  }
  for (const [name, file] of [[STEERING_FILE, layout.steeringPath], ["how-to-use.md", layout.howToUsePath]]) {
    const relativePath = path.relative(root, file);
    checks.push({ label: `${name} exists and is readable`, status: readCheck(root, relativePath).status });
  }
  checks.push({ label: "tasks.md checklist is complete", status: tasks ? checkboxState(tasks) : "unavailable" });
  checks.push({ label: "verification.md checklist is complete", status: verification ? checkboxState(verification) : "unavailable" });
  checks.push({ label: "requirements/design acceptance evidence", status: "unavailable" });
  checks.push({ label: "External test commands", status: "skipped" });

  const counts = Object.fromEntries(["passed", "failed", "skipped", "unavailable"].map((status) => [status, checks.filter((check) => check.status === status).length]));
  console.log(`Specly verify — ${feature} (read-only; no commands run)\n`);
  console.log(`Agent: ${layout.label} (${agent})`);
  for (const check of checks) console.log(`  ${check.status.toUpperCase().padEnd(11)} ${check.label}`);
  console.log(`\nSummary: ${counts.passed} passed, ${counts.failed} failed, ${counts.skipped} skipped, ${counts.unavailable} unavailable.`);
  console.log("Progress is read from durable tasks.md checkboxes. This report is not persisted; acceptance evidence requires project-specific checks.");
}

function printDoctor(root = process.cwd()) {
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  const agent = detectAgent(root);
  const templates = [...SPEC_FILES, STEERING_FILE];
  const missing = templates.filter(
    (file) => !fs.existsSync(path.join(TEMPLATE_DIR, file))
  );
  const guideReady = fs.existsSync(path.join(__dirname, "..", "how-to-use.md"));
  const runtimeReady = nodeMajor >= 18;
  const agentReady = listAgents().includes(agent);
  const templateReady = missing.length === 0 && guideReady;

  console.log("Specly doctor — read-only readiness check\n");
  console.log(
    `Runtime:   ${runtimeReady ? "ready" : "unsupported"} (Node.js ${process.versions.node}; requires >=18)`
  );
  console.log(
    `Agent:     ${agentReady ? "ready" : "unsupported"} (${agent}${agent === "generic" ? " fallback" : " detected"})`
  );
  console.log(
    `Templates: ${templateReady ? "ready" : "incomplete"} (${templates.length} spec/steering templates${guideReady ? " and guide" : "; guide missing"})`
  );
  if (missing.length > 0) console.log(`Missing:   ${missing.join(", ")}`);
  if (!runtimeReady || !agentReady || !templateReady) process.exitCode = 1;
}

function printAgents() {
  console.log("\nSupported agents:\n");
  for (const key of listAgents()) {
    const agent = getAgent(key);
    console.log(`  ${key.padEnd(14)} ${agent.label}`);
  }
  console.log(
    "\nWithout --agent, the CLI auto-detects from project folders."
  );
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  }
  return false;
}

function copyTemplate(fileName, dest, force) {
  const src = path.join(TEMPLATE_DIR, fileName);

  if (!fs.existsSync(src)) {
    throw new Error(`Template not found: ${src}`);
  }

  if (fs.existsSync(dest) && !force) {
    console.log(`⚠️  Already exists, skipping: ${path.relative(process.cwd(), dest)}`);
    return false;
  }

  fs.copyFileSync(src, dest);
  console.log(`✅ Created: ${path.relative(process.cwd(), dest)}`);
  return true;
}

function main(argv = process.argv, root = process.cwd()) {
  const explicitCommand = ["init", "doctor", "plan", "run", "recover", "verify"].includes(argv[2]);
  const command = explicitCommand ? argv[2] : "init";
  if (["plan", "run", "recover", "verify"].includes(command)) {
    const args = parseWorkflowArgs(argv);
    if (command === "plan") {
      if (args.approval || args.confirmStopped) throw new Error("plan accepts only an optional --task <id>.");
      if (args.taskId) printTaskPlan(args.feature, args.taskId, root);
      else printPlan(args.feature, root);
    } else if (command === "run") {
      if (!args.taskId || !args.approval || args.confirmStopped) throw new Error("Usage: specly run <feature> --task <id> --approve <digest>");
      runTask(args.feature, args.taskId, args.approval, root);
    } else if (command === "recover") {
      if (!args.taskId || args.approval) throw new Error("Usage: specly recover <feature> --task <id> [--confirm-stopped]");
      printRecovery(args.feature, args.taskId, root, args.confirmStopped);
    } else {
      if (args.approval || args.confirmStopped) throw new Error("verify accepts a feature name and optional --task <id>.");
      if (args.taskId) printTaskVerify(args.feature, args.taskId, root);
      else printVerify(args.feature, root);
    }
    return;
  }
  const args = parseArgs(argv, explicitCommand ? 3 : 2);

  if (command === "doctor") {
    if (args.help) {
      console.log("Usage: npx specly doctor\n\nChecks runtime, agent, and template readiness without writing files or opening an IDE.");
      return;
    }
    printDoctor(root);
    return;
  }

  if (args.help) {
    printHelp();
    return;
  }

  if (args.list) {
    printAgents();
    return;
  }

  const agentKey = args.agent || detectAgent(root);
  const layout = resolvePaths(agentKey, args.feature, root);

  console.log(`\n🤖 Agent:  ${layout.label} (${layout.agent})`);
  console.log(`📂 Feature: ${layout.feature}`);
  console.log(`📁 Specs:   ${layout.relativeSpecsDir}/\n`);

  const createdDir = ensureDir(layout.specsDir);
  if (createdDir) {
    console.log(`📁 Folder created: ${layout.relativeSpecsDir}/`);
  }

  let created = 0;

  for (const file of SPEC_FILES) {
    const dest = path.join(layout.specsDir, file);
    if (copyTemplate(file, dest, args.force)) created++;
  }

  const steeringDest = layout.steeringPath;
  ensureDir(path.dirname(steeringDest));
  if (copyTemplate(STEERING_FILE, steeringDest, args.force)) created++;

  const guide = deployAndOpen(layout.howToUsePath, args.force);
  if (guide.created) {
    console.log(`✅ Created: ${layout.relativeHowToUse}`);
    created++;
  } else {
    console.log(`📖 Guide: ${layout.relativeHowToUse}`);
  }

  console.log("\n🚀 SDD initialized.");
  console.log(`   Start with: ${layout.relativeSpecsDir}/requirements.md`);
  if (!layout.steeringInSpecs) {
    console.log(`   Context:    ${layout.relativeSteering}`);
  }
  console.log(`   Guide:      ${layout.relativeHowToUse} (opened in your IDE)`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { main, parseArgs };
