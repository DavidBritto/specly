const path = require("path");
const { detectAgent, resolvePaths } = require("./agents");
const { deployAndOpen } = require("./ide");

const root = process.env.INIT_CWD;
if (!root) {
  process.exit(0);
}

const agentKey = detectAgent(root);
const layout = resolvePaths(agentKey, "starter", root);

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SDD — Spec-Driven Development");
console.log("  by davidops");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

const guide = deployAndOpen(layout.howToUsePath);
console.log(`\n📖 Guide saved to: ${layout.relativeHowToUse}`);
console.log("   Opened in your IDE when available.\n");
console.log("  Quick start:  npx specly");
console.log("  List agents:  npx specly --list");
console.log(
  `  With agent:   npx specly --agent ${layout.agent} --feature my-feature\n`
);
