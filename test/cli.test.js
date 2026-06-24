const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const CLI = path.join(__dirname, "..", "src", "index.js");

function runSdd(cwd, args = "") {
  execSync(`node "${CLI}" ${args}`, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, SDD_NO_OPEN: "1" },
  });
}

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sdd-test-"));
}

test("generic: creates 4 spec files in specs/", () => {
  const dir = tempDir();
  runSdd(dir, "--agent generic");

  const specs = path.join(dir, "specs");
  assert.ok(fs.existsSync(path.join(specs, "requirements.md")));
  assert.ok(fs.existsSync(path.join(specs, "design.md")));
  assert.ok(fs.existsSync(path.join(specs, "tasks.md")));
  assert.ok(fs.existsSync(path.join(specs, "steering.md")));
  assert.ok(fs.existsSync(path.join(specs, "how-to-use.md")));
});

test("cursor: creates specs in .cursor/specs/<feature>/", () => {
  const dir = tempDir();
  fs.mkdirSync(path.join(dir, ".cursor"));
  runSdd(dir, "--agent cursor --feature auth");

  const featureDir = path.join(dir, ".cursor", "specs", "auth");
  assert.ok(fs.existsSync(path.join(featureDir, "requirements.md")));
  assert.ok(fs.existsSync(path.join(dir, ".cursor", "steering.md")));
  assert.ok(fs.existsSync(path.join(dir, ".cursor", "how-to-use.md")));
});

test("does not overwrite existing files", () => {
  const dir = tempDir();
  const specs = path.join(dir, "specs");
  fs.mkdirSync(specs, { recursive: true });
  const req = path.join(specs, "requirements.md");
  fs.writeFileSync(req, "original content");

  runSdd(dir, "--agent generic");

  assert.equal(fs.readFileSync(req, "utf8"), "original content");
});

test("kiro: auto-detects .kiro folder", () => {
  const dir = tempDir();
  fs.mkdirSync(path.join(dir, ".kiro"));
  runSdd(dir);

  assert.ok(
    fs.existsSync(
      path.join(dir, ".kiro", "specs", "starter", "requirements.md")
    )
  );
  assert.ok(fs.existsSync(path.join(dir, ".kiro", "steering.md")));
  assert.ok(fs.existsSync(path.join(dir, ".kiro", "how-to-use.md")));
});
