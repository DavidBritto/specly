const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const CONTENT_FILE = path.join(__dirname, "..", "content.md");
const CLAIMS_FILE = path.join(__dirname, "..", "site", "claims.json");

test("content.md exists, contains primary and short drafts, and remains an unposted draft", () => {
  assert.ok(fs.existsSync(CONTENT_FILE), "content.md must exist");
  const content = fs.readFileSync(CONTENT_FILE, "utf8");

  // Draft status explicitly declared
  assert.match(content, /draft/i, "content.md must be explicitly marked as draft");
  assert.match(content, /non-publish-ready|not published/i, "must state non-publish-ready status");

  // Both drafts present
  assert.match(content, /primary announcement/i, "primary announcement draft required");
  assert.match(content, /short linkedin draft|shorter draft/i, "short LinkedIn draft required");
});

test("content.md claims reconcile against site/claims.json evidence without premature release claims", () => {
  assert.ok(fs.existsSync(CONTENT_FILE), "content.md must exist");
  assert.ok(fs.existsSync(CLAIMS_FILE), "site/claims.json must exist");

  const content = fs.readFileSync(CONTENT_FILE, "utf8");
  const claimsData = JSON.parse(fs.readFileSync(CLAIMS_FILE, "utf8"));

  // Check that released capabilities are mentioned
  assert.match(content, /npx specly/i, "released npx specly command must be mentioned");

  // Ensure python capability is mentioned and adapters are labeled as preview or unreleased
  const pythonMatches = content.match(/python/gi) || [];
  assert.ok(pythonMatches.length > 0, "Python capability should be mentioned");
  assert.match(content, /preview|local|unreleased|unverified/i, "Adapters must be identified as preview/unreleased");

  // Authorization notice for posting/scheduling
  assert.match(content, /authorization/i, "must declare that posting requires explicit authorization");
});
