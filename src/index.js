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

Commands:
  init                    Create the SDD files (default; legacy syntax remains supported)
  doctor                  Check runtime, agent, and template readiness without changing files

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
  const explicitCommand = ["init", "doctor"].includes(argv[2]);
  const command = explicitCommand ? argv[2] : "init";
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
