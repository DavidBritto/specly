const fs = require("fs");
const path = require("path");

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

function openInIde(_filePath) {
  // No-op: automatic IDE opening removed per CLI hygiene
  return false;
}

function deployAndOpen(destPath, force = false) {
  return deployHowToUse(destPath, force);
}

module.exports = {
  GUIDE_NAME,
  PACKAGE_GUIDE,
  deployHowToUse,
  openInIde,
  deployAndOpen,
};
