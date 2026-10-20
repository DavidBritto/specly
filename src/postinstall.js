const path = require("path");
const { detectAgent, resolvePaths } = require("./agents");
const { deployHowToUse } = require("./ide");

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

const guide = deployHowToUse(layout.howToUsePath);
console.log(`\n📖 Guide saved to: ${layout.relativeHowToUse}\n`);
console.log("  Quick start:  npx specly");
console.log("  List agents:  npx specly --list");
console.log(
  `  With agent:   npx specly --agent ${layout.agent} --feature my-feature\n`
);
