const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const GUIDE_NAME = "how-to-use.md";
const PACKAGE_GUIDE = path.join(__dirname, "..", GUIDE_NAME);

function deployHowToUse(destPath, force = false) {
  if (!fs.existsSync(PACKAGE_GUIDE)) {
    throw new Error(`Guide not found: ${PACKAGE_GUIDE}`);
  }

  if (fs.existsSync(destPath) && !force) {
    return { created: false, path: destPath };
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(PACKAGE_GUIDE, destPath);
  return { created: true, path: destPath };
}

function openInIde(filePath) {
  if (process.env.SDD_NO_OPEN) return false;

  const abs = path.resolve(filePath);
  const commands = [];

  if (process.env.CURSOR_TRACE_ID || process.env.CURSOR_SESSION_ID) {
    commands.push(["cursor", "-r", abs]);
  }
  if (process.env.VSCODE_IPC_HOOK || process.env.TERM_PROGRAM === "vscode") {
    commands.push(["code", "-r", abs]);
  }
  if (process.env.TERM_PROGRAM === "windsurf") {
    commands.push(["windsurf", "-r", abs]);
  }

  for (const cmd of ["cursor", "code", "windsurf", "codium"]) {
    commands.push([cmd, "-r", abs]);
  }

  const seen = new Set();
  for (const [cmd, ...args] of commands) {
    if (seen.has(cmd)) continue;
    seen.add(cmd);

    const result = spawnSync(cmd, args, { stdio: "ignore" });
    if (result.error?.code === "ENOENT") continue;
    if (result.status === 0) return true;
  }

  return false;
}

function deployAndOpen(destPath, force = false) {
  const { created, path: guidePath } = deployHowToUse(destPath, force);
  openInIde(guidePath);
  return { created, path: guidePath };
}

module.exports = {
  GUIDE_NAME,
  PACKAGE_GUIDE,
  deployHowToUse,
  openInIde,
  deployAndOpen,
};
