/**
 * AI agent profiles and standard SDD artifact paths.
 *
 * specs: requirements.md, design.md, tasks.md (per feature)
 * steering: persistent project context (outside specs for most agents)
 */

const fs = require("fs");
const path = require("path");

const SPEC_FILES = ["requirements.md", "design.md", "tasks.md"];
const STEERING_FILE = "steering.md";
const HOW_TO_USE_FILE = "how-to-use.md";

function exists(fullPath) {
  return fs.existsSync(fullPath);
}

const AGENTS = {
  generic: {
    label: "Generic",
    detect: () => false,
    paths: (feature) => ({
      specsDir: "specs",
      agentDir: "specs",
      steeringInSpecs: true,
    }),
  },

  cursor: {
    label: "Cursor",
    detect: (root) => exists(path.join(root, ".cursor")),
    paths: (feature) => ({
      specsDir: `.cursor/specs/${feature}`,
      agentDir: ".cursor",
      steeringInSpecs: false,
    }),
  },

  kiro: {
    label: "Kiro",
    detect: (root) => exists(path.join(root, ".kiro")),
    paths: (feature) => ({
      specsDir: `.kiro/specs/${feature}`,
      agentDir: ".kiro",
      steeringInSpecs: false,
    }),
  },

  vscode: {
    label: "VS Code / Copilot",
    detect: (root) =>
      exists(path.join(root, ".vscode")) ||
      exists(path.join(root, ".github/copilot-instructions.md")),
    paths: (feature) => ({
      specsDir: `.vscode/specs/${feature}`,
      agentDir: ".vscode",
      steeringInSpecs: false,
    }),
  },

  antigravity: {
    label: "Antigravity",
    detect: (root) =>
      exists(path.join(root, ".agent")) ||
      exists(path.join(root, ".antigravity")),
    paths: (feature) => ({
      specsDir: `.agent/specs/${feature}`,
      agentDir: ".agent",
      steeringInSpecs: false,
    }),
  },

  windsurf: {
    label: "Windsurf",
    detect: (root) => exists(path.join(root, ".windsurf")),
    paths: (feature) => ({
      specsDir: `.windsurf/specs/${feature}`,
      agentDir: ".windsurf",
      steeringInSpecs: false,
    }),
  },

  claude: {
    label: "Claude Code",
    detect: (root) =>
      exists(path.join(root, "CLAUDE.md")) ||
      exists(path.join(root, ".claude")),
    paths: (feature) => ({
      specsDir: `.claude/specs/${feature}`,
      agentDir: ".claude",
      steeringInSpecs: false,
    }),
  },
};

function listAgents() {
  return Object.keys(AGENTS);
}

function getAgent(name) {
  const key = (name || "generic").toLowerCase();
  if (!AGENTS[key]) {
    const available = listAgents().join(", ");
    throw new Error(`Unknown agent: "${name}". Available: ${available}`);
  }
  return { key, ...AGENTS[key] };
}

function detectAgent(root) {
  const cwd = root || process.cwd();

  const detected = Object.entries(AGENTS)
    .filter(([key]) => key !== "generic")
    .filter(([, agent]) => agent.detect(cwd))
    .map(([key]) => key);

  if (detected.length === 1) return detected[0];
  if (detected.length > 1) {
    const priority = [
      "kiro",
      "cursor",
      "antigravity",
      "windsurf",
      "claude",
      "vscode",
    ];
    for (const p of priority) {
      if (detected.includes(p)) return p;
    }
    return detected[0];
  }
  return "generic";
}

function resolvePaths(agentKey, feature, root) {
  const agent = getAgent(agentKey);
  const layout = agent.paths(feature || "starter");
  const base = root || process.cwd();
  const agentDir = layout.agentDir;

  return {
    agent: agentKey,
    label: agent.label,
    feature: feature || "starter",
    specsDir: path.join(base, layout.specsDir),
    steeringPath: path.join(
      base,
      layout.steeringInSpecs ? layout.specsDir : agentDir,
      STEERING_FILE
    ),
    howToUsePath: path.join(base, agentDir, HOW_TO_USE_FILE),
    steeringInSpecs: layout.steeringInSpecs,
    specFiles: SPEC_FILES,
    steeringFile: STEERING_FILE,
    howToUseFile: HOW_TO_USE_FILE,
    relativeSpecsDir: layout.specsDir,
    relativeSteering: layout.steeringInSpecs
      ? `${layout.specsDir}/${STEERING_FILE}`
      : `${agentDir}/${STEERING_FILE}`,
    relativeHowToUse: `${agentDir}/${HOW_TO_USE_FILE}`,
  };
}

module.exports = {
  AGENTS,
  SPEC_FILES,
  STEERING_FILE,
  HOW_TO_USE_FILE,
  listAgents,
  getAgent,
  detectAgent,
  resolvePaths,
};
