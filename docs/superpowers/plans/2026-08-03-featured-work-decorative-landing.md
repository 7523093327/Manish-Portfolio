# Featured Work Decorative Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace abrupt decorative-clip appearances with a smooth scroll-scrubbed approach, overshoot, and settle.

**Architecture:** Keep the current transparent decoration assets and `initWorkCardThumbnailMotion()` orchestration. Extend each card configuration with a visible starting offset, transform origin, and overshoot values, then animate the existing `.work-card__decoration-motion` wrapper in two GSAP phases.

**Tech Stack:** Standalone HTML, CSS, GSAP 3.15, ScrollTrigger, Node acceptance tests.

## Global Constraints

- No visual redesign or new dependency.
- Preserve mobile and reduced-motion static fallbacks.
- Keep decoration assets transparent and isolated.

---

### Task 1: Smooth decorative landing

**Files:**
- Modify: `outputs/interface-workshop-hero.html`
- Modify: `tests/interface-workshop-hero.test.mjs`

**Interfaces:**
- Consumes: `.work-card__decoration-motion` and each card configuration in `initWorkCardThumbnailMotion()`.
- Produces: a two-phase GSAP decoration entrance ending at the authored transform.

- [ ] **Step 1: Write failing acceptance assertions**

Assert that the decoration begins at `autoAlpha: 0` and `scale: .86`, approaches an overshoot with `power3.out`, and settles at the authored transform with `back.out(1.15)`.

- [ ] **Step 2: Run the acceptance test and confirm failure**

Run `node tests/interface-workshop-hero.test.mjs` and expect the new decoration-motion assertion to fail.

- [ ] **Step 3: Implement the entrance choreography**

Add per-card visible offsets, origins, and overshoot values. Replace the current one-step decoration tween with an opacity/scale/travel approach followed by a restrained settle.

- [ ] **Step 4: Verify**

Run `node tests/interface-workshop-hero.test.mjs`, compile the inline script with `new Function`, and validate the decoration SVG files contain no full-frame background rectangle.
