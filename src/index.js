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
const ROOT = process.cwd();

function parseArgs(argv) {
  const args = {
    agent: null,
    feature: "starter",
    help: false,
    list: false,
    force: false,
  };

  for (let i = 2; i < argv.length; i++) {
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
    console.log(`⚠️  Already exists, skipping: ${path.relative(ROOT, dest)}`);
    return false;
  }

  fs.copyFileSync(src, dest);
  console.log(`✅ Created: ${path.relative(ROOT, dest)}`);
  return true;
}

function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    return;
  }

  if (args.list) {
    printAgents();
    return;
  }

  const agentKey = args.agent || detectAgent(ROOT);
  const layout = resolvePaths(agentKey, args.feature, ROOT);

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

try {
  main();
} catch (error) {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
}
