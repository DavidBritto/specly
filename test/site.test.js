const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE_DIR = path.join(ROOT, "site");
const CLAIMS_FILE = path.join(SITE_DIR, "claims.json");
const HTML_FILE = path.join(SITE_DIR, "index.html");
const CSS_FILE = path.join(SITE_DIR, "styles.css");

test("site/claims.json exists and validates release evidence status", () => {
  assert.ok(fs.existsSync(CLAIMS_FILE), "site/claims.json must exist");
  const data = JSON.parse(fs.readFileSync(CLAIMS_FILE, "utf8"));
  assert.ok(Array.isArray(data.claims), "claims array required");

  const allowedStates = new Set(["released", "local-preview", "planned", "unverified", "draft"]);
  for (const claim of data.claims) {
    assert.ok(claim.id, "claim id required");
    assert.ok(allowedStates.has(claim.state), `Invalid state ${claim.state} in claim ${claim.id}`);
    assert.ok(claim.evidence_locator, `evidence_locator required for claim ${claim.id}`);

    // If state is released, it must point to observed registry evidence (npm specly@1.1.0)
    if (claim.state === "released") {
      assert.match(
        claim.evidence_locator,
        /npm|registry/,
        `Released claim ${claim.id} must be backed by observed registry evidence`
      );
      assert.doesNotMatch(claim.id, /python|strands|ax/, "Python/Strands/AX must not be marked released");
    }
  }
});

test("site/index.html provides semantic, accessible terminal narrative without JS", () => {
  assert.ok(fs.existsSync(HTML_FILE), "site/index.html must exist");
  const html = fs.readFileSync(HTML_FILE, "utf8");

  // Viewport and semantics
  assert.match(html, /<meta\s+name=["']viewport["']\s+content=["'][^"']*width=device-width/i);
  assert.match(html, /<main>/i);
  assert.match(html, /<h1>/i);

  // Terminal narrative present before JS
  assert.match(html, /class=["'][^"']*terminal/i);
  assert.match(html, /npx specly/i);

  // Clear release distinction
  assert.match(html, /preview|local|unreleased/i);
});

test("site/styles.css supports responsive layout, focus visibility, and reduced motion", () => {
  assert.ok(fs.existsSync(CSS_FILE), "site/styles.css must exist");
  const css = fs.readFileSync(CSS_FILE, "utf8");

  // Reduced motion
  assert.match(css, /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i);

  // Keyboard focus visibility
  assert.match(css, /:focus(-visible)?/i);

  // Responsive container rules
  assert.match(css, /max-width/i);
  assert.match(css, /box-sizing\s*:\s*border-box/i);
});

test("GitHub Pages workflow remains inert and unactivated", () => {
  const workflowFile = path.join(ROOT, ".github", "workflows", "pages.yml");
  if (fs.existsSync(workflowFile)) {
    const content = fs.readFileSync(workflowFile, "utf8");
    // Must be disabled or explicitly marked inert
    assert.match(content, /inert|disabled|manual/i);
  }
});
