const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const CLI = path.join(__dirname, "..", "src", "index.js");
const { main } = require(CLI);
const CONTRACT = require("../contracts/artifact-contract-v1.json");
const { listAgents, resolvePaths } = require("../src/agents");

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

function actionProject(actionPath = "new/hello.txt", actionContent = "hello\n") {
  const dir = tempDir();
  runSdd(dir, ["init", "--agent", "generic", "--feature", "auth"]);
  fs.writeFileSync(path.join(dir, "specs", "tasks.md"), "# Tasks\n\n- [ ] 1.1 Create a greeting file\n");
  fs.mkdirSync(path.join(dir, ".specly", "actions"), { recursive: true });
  fs.writeFileSync(path.join(dir, ".specly", "actions", "auth.json"), JSON.stringify({
    schemaVersion: 1,
    feature: "auth",
    actions: [{ taskId: "1.1", type: "write-file", path: actionPath, content: actionContent }],
  }));
  return dir;
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

test("agents: creates specs in .agents/specs/<feature>/", () => {
  const dir = tempDir();
  fs.mkdirSync(path.join(dir, ".agents"));
  runSdd(dir, ["--agent", "agents", "--feature", "auth"]);

  const featureDir = path.join(dir, ".agents", "specs", "auth");
  assert.ok(fs.existsSync(path.join(featureDir, "requirements.md")));
  assert.ok(fs.existsSync(path.join(dir, ".agents", "steering.md")));
  assert.ok(fs.existsSync(path.join(dir, ".agents", "how-to-use.md")));
});

test("agents: auto-detects .agents folder and AGENTS.md", () => {
  const dir1 = tempDir();
  fs.mkdirSync(path.join(dir1, ".agents"));
  runSdd(dir1);
  assert.ok(fs.existsSync(path.join(dir1, ".agents", "specs", "starter", "requirements.md")));

  const dir2 = tempDir();
  fs.writeFileSync(path.join(dir2, "AGENTS.md"), "# Agents\n");
  runSdd(dir2);
  assert.ok(fs.existsSync(path.join(dir2, ".agents", "specs", "starter", "requirements.md")));
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

test("init creates spec files without spawning an IDE or cursor", () => {
  const dir = tempDir();
  const fakeBin = path.join(dir, "bin");
  const target = path.join(dir, "clean-project");
  const marker = path.join(dir, "ide-opened");
  fs.mkdirSync(fakeBin, { recursive: true });
  fs.mkdirSync(target);
  fs.writeFileSync(path.join(fakeBin, "cursor"), `#!/bin/sh\nprintf opened > "${marker}"\n`);
  fs.chmodSync(path.join(fakeBin, "cursor"), 0o755);

  const output = runSdd(target, ["init", "--agent", "cursor", "--feature", "test-init"], {
    PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`,
    CURSOR_SESSION_ID: "init-test",
    SDD_NO_OPEN: "",
  });

  assert.match(output, /SDD initialized/);
  assert.equal(fs.existsSync(path.join(target, ".cursor", "specs", "test-init", "requirements.md")), true);
  assert.equal(fs.existsSync(marker), false);
  assert.doesNotMatch(output, /opened in your IDE/);
});

test("plan enumerates effects without writing to the target project", () => {
  const dir = tempDir();
  fs.mkdirSync(path.join(dir, "specs"));
  fs.writeFileSync(path.join(dir, "specs", "requirements.md"), "keep me");
  const before = fs.readdirSync(path.join(dir, "specs")).sort();

  const output = runSdd(dir, ["plan", "auth"]);

  assert.match(output, /read-only; nothing is executed/);
  assert.match(output, /preserve existing file: specs\/requirements\.md/);
  assert.match(output, /create if init is separately approved: specs\/design\.md/);
  assert.match(output, /Dependency changes: none/);
  assert.match(output, /External commands: none/);
  assert.match(output, /Network, credentials, and IDE launch: none/);
  assert.deepEqual(fs.readdirSync(path.join(dir, "specs")).sort(), before);
  assert.equal(fs.existsSync(path.join(dir, "specs", "auth")), false);
});

test("verify reports only observable artifact and checklist evidence without writes", () => {
  const dir = tempDir();
  runSdd(dir, ["init", "--agent", "generic", "--feature", "auth"]);
  const before = fs.readdirSync(dir).sort();

  const output = runSdd(dir, ["verify", "auth"]);

  assert.match(output, /PASSED\s+requirements\.md exists and is readable/);
  assert.match(output, /FAILED\s+tasks\.md checklist is complete/);
  assert.match(output, /FAILED\s+verification\.md checklist is complete/);
  assert.match(output, /UNAVAILABLE\s+requirements\/design acceptance evidence/);
  assert.match(output, /SKIPPED\s+External test commands/);
  assert.match(output, /This report is not persisted/);
  assert.deepEqual(fs.readdirSync(dir).sort(), before);
});

test("plan and verify reject unsafe feature path tokens", () => {
  const dir = tempDir();
  assert.throws(() => runSdd(dir, ["plan", "../outside"]), /Usage: specly/);
  assert.throws(() => runSdd(dir, ["verify", "auth/../../outside"]), /Usage: specly/);
});

test("task plan hashes the exact declared write and stays read-only", () => {
  const dir = actionProject();
  const before = fs.readdirSync(dir, { recursive: true }).sort();
  const output = runSdd(dir, ["plan", "auth", "--task", "1.1"]);
  assert.match(output, /Action: write-file/);
  assert.match(output, /Target: new\/hello\.txt/);
  assert.match(output, /Content: 6 UTF-8 bytes; SHA-256/);
  assert.match(output, /Directories to create: new/);
  assert.match(output, /Durable state: \.specly\/runs\/auth\/1\.1\.json/);
  assert.match(output, /transient lock: \.specly\/runs\/auth\/1\.1\.lock/);
  const digest = output.match(/Approval digest: ([a-f0-9]{64})/)[1];
  assert.deepEqual(fs.readdirSync(dir, { recursive: true }).sort(), before);
  assert.equal(fs.existsSync(path.join(dir, "new", "hello.txt")), false);
});

test("run requires matching approval and creates exactly one declared file", () => {
  const dir = actionProject();
  const output = runSdd(dir, ["plan", "auth", "--task", "1.1"]);
  const digest = output.match(/Approval digest: ([a-f0-9]{64})/)[1];
  assert.throws(() => runSdd(dir, ["run", "auth", "--task", "1.1", "--approve", "0".repeat(64)]), /Approval digest mismatch/);
  assert.equal(fs.existsSync(path.join(dir, "new", "hello.txt")), false);
  assert.equal(fs.existsSync(path.join(dir, ".specly", "runs")), false);

  const runOutput = runSdd(dir, ["run", "auth", "--task", "1.1", "--approve", digest]);
  assert.match(runOutput, /Completed task 1\.1: created new\/hello\.txt/);
  assert.equal(fs.readFileSync(path.join(dir, "new", "hello.txt"), "utf8"), "hello\n");
  const state = JSON.parse(fs.readFileSync(path.join(dir, ".specly", "runs", "auth", "1.1.json"), "utf8"));
  assert.equal(state.latestStatus, "completed");
  assert.equal(state.attempts[0].evidence.contentSha256, require("crypto").createHash("sha256").update("hello\n").digest("hex"));
  assert.match(fs.readFileSync(path.join(dir, "specs", "tasks.md"), "utf8"), /- \[ \] 1\.1/);

  assert.throws(() => runSdd(dir, ["run", "auth", "--task", "1.1", "--approve", digest]), /already exists/);
});

test("task verify passes only when the target and completed ledger match, without writes", () => {
  const dir = actionProject();
  const plan = runSdd(dir, ["plan", "auth", "--task", "1.1"]);
  const digest = plan.match(/Approval digest: ([a-f0-9]{64})/)[1];
  runSdd(dir, ["run", "auth", "--task", "1.1", "--approve", digest]);
  const files = (root) => Object.fromEntries(fs.readdirSync(root, { recursive: true }).sort().map((name) => {
    const file = path.join(root, name);
    return [name, fs.statSync(file).isFile() ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") : "directory"];
  }));
  const before = files(dir);
  const output = runSdd(dir, ["verify", "auth", "--task", "1.1"]);
  assert.match(output, /PASSED\s+declared action and task ID are valid/);
  assert.match(output, /PASSED\s+target new\/hello\.txt SHA-256/);
  assert.match(output, /PASSED\s+completed run ledger matches current manifest, task, and approval/);
  assert.match(output, /SKIPPED\s+external test commands/);
  assert.match(output, /UNAVAILABLE\s+requirements\/design acceptance/);
  assert.match(output, /No task checkbox or run ledger was changed/);
  assert.deepEqual(files(dir), before);
});

test("matching target without a completed ledger is not reported as a completed run", () => {
  const dir = actionProject();
  fs.mkdirSync(path.join(dir, "new"));
  fs.writeFileSync(path.join(dir, "new", "hello.txt"), "hello\n");
  const before = fs.readdirSync(dir, { recursive: true }).sort();
  const output = runSdd(dir, ["verify", "auth", "--task", "1.1"]);
  assert.match(output, /PASSED\s+target new\/hello\.txt SHA-256/);
  assert.match(output, /UNAVAILABLE\s+durable run ledger: no completed run evidence; target bytes alone do not prove an approved run/);
  assert.doesNotMatch(output, /PASSED\s+completed run ledger/);
  assert.deepEqual(fs.readdirSync(dir, { recursive: true }).sort(), before);
});

test("task verify fails when a completed ledger target is missing or changed", () => {
  const dir = actionProject();
  const plan = runSdd(dir, ["plan", "auth", "--task", "1.1"]);
  const digest = plan.match(/Approval digest: ([a-f0-9]{64})/)[1];
  runSdd(dir, ["run", "auth", "--task", "1.1", "--approve", digest]);
  fs.writeFileSync(path.join(dir, "new", "hello.txt"), "changed\n");
  let output = runSdd(dir, ["verify", "auth", "--task", "1.1"]);
  assert.match(output, /FAILED\s+target new\/hello\.txt SHA-256/);
  assert.match(output, /FAILED\s+completed run ledger matches current manifest, task, and approval/);
  fs.unlinkSync(path.join(dir, "new", "hello.txt"));
  output = runSdd(dir, ["verify", "auth", "--task", "1.1"]);
  assert.match(output, /FAILED\s+target new\/hello\.txt \(missing\)/);
  assert.match(output, /FAILED\s+completed run ledger matches current manifest, task, and approval/);
});

test("task verify reports unavailable when the declared action cannot be read", () => {
  const dir = actionProject();
  fs.unlinkSync(path.join(dir, ".specly", "actions", "auth.json"));
  const before = fs.readdirSync(dir, { recursive: true }).sort();
  const output = runSdd(dir, ["verify", "auth", "--task", "1.1"]);
  assert.match(output, /UNAVAILABLE\s+declared action and task ID \(ENOENT:/);
  assert.match(output, /UNAVAILABLE\s+durable run ledger: no completed run evidence/);
  assert.deepEqual(fs.readdirSync(dir, { recursive: true }).sort(), before);
});

test("run rejects unknown task IDs and path traversal in action manifest", () => {
  const missingTask = actionProject();
  assert.throws(() => runSdd(missingTask, ["plan", "auth", "--task", "9.9"]), /not present in .*tasks\.md/);
  const traversal = actionProject("../outside.txt");
  assert.throws(() => runSdd(traversal, ["plan", "auth", "--task", "1.1"]), /parent path segments/);
});

test("action planner rejects existing targets and symlink ancestors", () => {
  const existing = actionProject();
  fs.mkdirSync(path.join(existing, "new"));
  fs.writeFileSync(path.join(existing, "new", "hello.txt"), "preserve");
  assert.throws(() => runSdd(existing, ["plan", "auth", "--task", "1.1"]), /target already exists/);
  assert.equal(fs.readFileSync(path.join(existing, "new", "hello.txt"), "utf8"), "preserve");

  const symlinked = actionProject("outside/new.txt");
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "specly-outside-"));
  fs.symlinkSync(outside, path.join(symlinked, "outside"), "dir");
  assert.throws(() => runSdd(symlinked, ["plan", "auth", "--task", "1.1"]), /Symbolic links are not allowed/);
  assert.equal(fs.existsSync(path.join(outside, "new.txt")), false);
});

test("recovery diagnoses interruption and requires explicit reconciliation before retry", () => {
  const dir = actionProject();
  const output = runSdd(dir, ["plan", "auth", "--task", "1.1"]);
  const digest = output.match(/Approval digest: ([a-f0-9]{64})/)[1];
  const runs = path.join(dir, ".specly", "runs", "auth");
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, "1.1.json"), JSON.stringify({
    schemaVersion: 1, feature: "auth", taskId: "1.1", latestStatus: "running",
    attempts: [{ approvalDigest: digest, action: "write-file", target: "new/hello.txt", contentSha256: require("crypto").createHash("sha256").update("hello\n").digest("hex"), status: "running", startedAt: "2026-01-01T00:00:00.000Z" }],
  }));
  fs.writeFileSync(path.join(runs, "1.1.lock"), JSON.stringify({ pid: 99999999, startedAt: "2026-01-01T00:00:00.000Z" }));

  assert.match(runSdd(dir, ["recover", "auth", "--task", "1.1"]), /Possible interruption: no automatic retry/);
  assert.equal(fs.existsSync(path.join(dir, "new", "hello.txt")), false);
  assert.match(runSdd(dir, ["recover", "auth", "--task", "1.1", "--confirm-stopped"]), /Reconciled state as interrupted/);
  assert.equal(fs.existsSync(path.join(dir, ".specly", "runs", "auth", "1.1.lock")), false);

  runSdd(dir, ["run", "auth", "--task", "1.1", "--approve", digest]);
  assert.equal(fs.readFileSync(path.join(dir, "new", "hello.txt"), "utf8"), "hello\n");
});

test("artifact contract fixture matches every Node template and agent layout", () => {
  assert.equal(CONTRACT.contract, "specly-generated-artifacts");
  assert.equal(CONTRACT.schemaVersion, 1);
  assert.equal(CONTRACT.contractVersion, "1.0.0");
  assert.deepEqual(Object.keys(CONTRACT.layouts).sort(), listAgents().sort());

  for (const artifact of CONTRACT.artifacts) {
    const template = path.join(__dirname, "..", artifact.template);
    const digest = crypto
      .createHash("sha256")
      .update(fs.readFileSync(template))
      .digest("hex");
    assert.equal(digest, artifact.sha256, `${artifact.id} template fingerprint`);
  }

  for (const [agent, expected] of Object.entries(CONTRACT.layouts)) {
    const resolved = resolvePaths(agent, "contract-check", "/project");
    assert.equal(
      path.relative("/project", resolved.specsDir).split(path.sep).join("/"),
      expected.specsDir.replace("{feature}", "contract-check"),
      `${agent} specs path`
    );
    assert.equal(
      path.relative("/project", path.dirname(resolved.steeringPath)).split(path.sep).join("/"),
      expected.steeringDir,
      `${agent} steering path`
    );
    assert.equal(
      path.relative("/project", path.dirname(resolved.howToUsePath)).split(path.sep).join("/"),
      expected.agentDir,
      `${agent} guide path`
    );
  }
});

test("fresh Node output conforms to the shared artifact contract", () => {
  for (const agent of ["generic", "agents", "cursor"]) {
    const dir = tempDir();
    if (agent === "agents") fs.mkdirSync(path.join(dir, ".agents"));
    if (agent === "cursor") fs.mkdirSync(path.join(dir, ".cursor"));
    const feature = "contract-check";
    runSdd(dir, ["init", "--agent", agent, "--feature", feature]);

    const layout = CONTRACT.layouts[agent];
    for (const artifact of CONTRACT.artifacts) {
      const directory = layout[artifact.directory].replace("{feature}", feature);
      const generated = fs.readFileSync(
        path.join(dir, directory, artifact.file)
      );
      const digest = crypto.createHash("sha256").update(generated).digest("hex");
      assert.equal(digest, artifact.sha256, `${agent} ${artifact.id} output`);
    }
  }
});

test("Node CLI commands remain compatible in projects coexisting with python packaging", () => {
  const dir = tempDir();
  // Simulate coexistence with python package layout
  fs.mkdirSync(path.join(dir, "python"), { recursive: true });
  fs.writeFileSync(path.join(dir, "pyproject.toml"), "[project]\nname = 'sample'\n");
  const output = runSdd(dir, ["doctor"]);
  assert.match(output, /Specly doctor — read-only readiness check/);
  assert.match(output, /Runtime:\s+ready/);

  const initOut = runSdd(dir, ["init", "--agent", "generic", "--feature", "coexist"]);
  assert.match(initOut, /SDD initialized/);
  assert.equal(fs.existsSync(path.join(dir, "specs", "requirements.md")), true);
  assert.equal(fs.existsSync(path.join(dir, "package.json")), false);
});
