const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");
const CLI = path.join(__dirname, "..", "src", "index.js");
const { main } = require(CLI);

function runSdd(cwd, args = [], extraEnv = {}) {
  const previousCwd = process.cwd();
  const previousEnv = { ...process.env };
  const output = [];
  const originalLog = console.log;
  try {
    process.chdir(cwd);
    Object.assign(process.env, { SDD_NO_OPEN: "1" }, extraEnv);
    console.log = (...values) => output.push(values.join(" "));
    main([process.execPath, CLI, ...args], cwd);
    return output.join("\n");
  } finally {
    console.log = originalLog;
    process.chdir(previousCwd);
    for (const key of Object.keys(process.env)) {
      if (!(key in previousEnv)) delete process.env[key];
    }
    Object.assign(process.env, previousEnv);
  }
}

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sdd-test-"));
}

test("generic: creates 5 spec files in specs/", () => {
  const dir = tempDir();
  runSdd(dir, ["--agent", "generic"]);

  const specs = path.join(dir, "specs");
  assert.ok(fs.existsSync(path.join(specs, "requirements.md")));
  assert.ok(fs.existsSync(path.join(specs, "design.md")));
  assert.ok(fs.existsSync(path.join(specs, "tasks.md")));
  assert.ok(fs.existsSync(path.join(specs, "verification.md")));
  assert.ok(fs.existsSync(path.join(specs, "steering.md")));
  assert.ok(fs.existsSync(path.join(specs, "how-to-use.md")));
});

test("cursor: creates specs in .cursor/specs/<feature>/", () => {
  const dir = tempDir();
  fs.mkdirSync(path.join(dir, ".cursor"));
  runSdd(dir, ["--agent", "cursor", "--feature", "auth"]);

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

  runSdd(dir, ["--agent", "generic"]);

  assert.equal(fs.readFileSync(req, "utf8"), "original content");
});

test("--force overwrites existing files", () => {
  const dir = tempDir();
  const specs = path.join(dir, "specs");
  fs.mkdirSync(specs, { recursive: true });
  const req = path.join(specs, "requirements.md");
  fs.writeFileSync(req, "original content");

  runSdd(dir, ["--agent", "generic", "--force"]);

  assert.notEqual(fs.readFileSync(req, "utf8"), "original content");
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

test("explicit init works in a Python project without package.json", () => {
  const dir = tempDir();
  fs.writeFileSync(path.join(dir, "pyproject.toml"), "[project]\nname = 'example'\n");

  const output = runSdd(dir, ["init", "--agent", "generic", "--feature", "python-app"]);

  assert.match(output, /SDD initialized/);
  assert.ok(fs.existsSync(path.join(dir, "specs", "requirements.md")));
  assert.ok(fs.existsSync(path.join(dir, "specs", "steering.md")));
  assert.ok(fs.existsSync(path.join(dir, "specs", "how-to-use.md")));
  assert.equal(fs.existsSync(path.join(dir, "package.json")), false);
});

test("doctor reports readiness without changing files or opening an IDE", () => {
  const dir = tempDir();
  const fakeBin = path.join(dir, "bin");
  const target = path.join(dir, "python-project");
  const marker = path.join(dir, "ide-opened");
  fs.mkdirSync(fakeBin, { recursive: true });
  fs.mkdirSync(target);
  fs.mkdirSync(path.join(target, ".cursor"));
  fs.writeFileSync(path.join(target, "pyproject.toml"), "[project]\nname = 'example'\n");
  fs.writeFileSync(path.join(fakeBin, "cursor"), `#!/bin/sh\nprintf opened > "${marker}"\n`);
  fs.chmodSync(path.join(fakeBin, "cursor"), 0o755);

  const before = fs.readdirSync(target).sort();
  const output = runSdd(target, ["doctor"], {
    PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`,
    CURSOR_SESSION_ID: "doctor-test",
    SDD_NO_OPEN: "",
  });

  assert.match(output, /Runtime:\s+ready/);
  assert.match(output, /Agent:\s+ready \(cursor detected\)/);
  assert.match(output, /Templates:\s+ready/);
  assert.deepEqual(fs.readdirSync(target).sort(), before);
  assert.equal(fs.existsSync(marker), false);
});
