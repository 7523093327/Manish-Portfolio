# Interface Workshop Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished responsive hero-page deliverable for Manish Gaud's Interface Workshop portfolio direction.

**Architecture:** Use a self-contained HTML page with a project-local generated illustration, semantic navigation, CSS custom properties, and CSS-only progressive animation. A Node assertion script verifies that the shipped page retains the required copy, semantic regions, illustration, CTA actions, and reduced-motion rule.

**Tech Stack:** HTML5, CSS3, Node.js built-in `node:assert`.

## Global Constraints

- Use the approved copy verbatim.
- Use the original conveyor-belt illustration in the project deliverable.
- Preserve warm off-white, dark ink, cobalt, tangerine, and lime visual language.
- Support desktop, tablet, mobile, and `prefers-reduced-motion`.
- Do not fabricate testimonial content.

---

### Task 1: Add an executable hero acceptance test

**Files:**
- Create: `tests/interface-workshop-hero.test.mjs`
- Test: `tests/interface-workshop-hero.test.mjs`

**Interfaces:**
- Consumes: `outputs/interface-workshop-hero.html`
- Produces: a zero-exit assertion suite used to validate the deliverable.

- [ ] **Step 1: Write the failing test**

```js
assert.match(html, /I shape messy product ideas into interfaces people understand\./);
assert.match(html, /<nav[\s>]/);
assert.match(html, /View Selected Work/);
assert.match(html, /prefers-reduced-motion: reduce/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/interface-workshop-hero.test.mjs`

Expected: FAIL because `outputs/interface-workshop-hero.html` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create the output page only after the test has failed.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/interface-workshop-hero.test.mjs`

Expected: PASS with a success message.

### Task 2: Create and verify the visual deliverable

**Files:**
- Create: `outputs/interface-workshop-hero.html`
- Create: `outputs/interface-workshop-process.png`

**Interfaces:**
- Consumes: the approved Illustration Workshop process image.
- Produces: a browser-ready one-page hero that references `interface-workshop-process.png` with relative URL `./interface-workshop-process.png`.

- [ ] **Step 1: Implement the semantic hero**

Use `<header>`, `<nav>`, `<main>`, and `<section aria-labelledby="hero-title">`. Use the approved headings, copy, actions, trust line, and section-anchor navigation.

- [ ] **Step 2: Implement responsive art direction**

Keep the illustration at a wide desktop aspect, constrain it with `max-width`, and reduce navigation complexity below 760px. Use a warm paper background and CSS grain.

- [ ] **Step 3: Implement restrained motion**

Animate the image reveal and supporting UI accents on load. Add hover movement only to decorative elements. Use a complete `prefers-reduced-motion: reduce` override.

- [ ] **Step 4: Run automated test and render a desktop screenshot**

Run: `node tests/interface-workshop-hero.test.mjs`

Run a headless-browser screenshot at 1440x1100, then inspect the PNG for clipping, legibility, and visual hierarchy.
