# Specly Presentation Site (Local Preview)

Local static product presentation site for Specly.

> **Deployment Status:** Local preview only. This site is **not published or deployed**. The presence of local static files or the inert `.github/workflows/pages.yml` workflow is not evidence of a live site.

## Architecture & Accessibility

- **Semantic HTML5:** Full product narrative and capability inventory are present in raw HTML (`site/index.html`) without requiring JavaScript.
- **Evidence-Grounded Claims:** All capability claims are defined in `site/claims.json` and categorized into `released`, `local-preview`, `unverified`, or `draft` based on verified evidence.
- **Motion & Accessibility:**
  - `@media (prefers-reduced-motion: reduce)` disables nonessential transitions and animations.
  - Visible focus indicators (`:focus-visible`) support keyboard-only navigation.
  - Responsive layout adapts cleanly down to narrow mobile viewports (<=360px).
- **Inert Workflow:** `.github/workflows/pages.yml` is prepared for review but disabled (`if: false`). Live deployment or Pages activation requires separate explicit authorization.

## Verification

Run local checks via the Node test runner:
```bash
node --test test/site.test.js
```
