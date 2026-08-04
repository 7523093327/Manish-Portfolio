# Featured Work Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the visible Featured Work heading with the supplied SVG and rotate only its blue icon in a seamless eight-second loop.

**Architecture:** The existing semantic `h2` remains in the sticky header but becomes visually hidden. The supplied SVG is rendered as a decorative image, while its internal stylesheet owns the icon-only rotation and reduced-motion fallback.

**Tech Stack:** Standalone HTML, CSS, SVG animation, Node acceptance assertions

## Global Constraints

- Preserve the sticky header mask, cards, section spacing, scroll progress, and existing animations.
- Use `featured-work-header-1.svg` at its authored 392:60 ratio.
- Rotate only `#featured-work-icon` clockwise through 360 degrees over 8 seconds with linear easing.
- Disable icon rotation for `prefers-reduced-motion: reduce`.
- Keep `Featured work` as the accessible `h2` text and hide the decorative image from assistive technology.

---

### Task 1: Replace and animate the Featured Work header

**Files:**
- Modify: `tests/interface-workshop-hero.test.mjs`
- Modify: `outputs/interface-workshop-hero.html`
- Modify: `featured-work-header-1.svg`

**Interfaces:**
- Consumes: `.featured-work-header`, `#featured-work-title`, and `#featured-work-icon`
- Produces: `.featured-work-header__art` and the `featured-work-icon-spin` SVG animation

- [ ] Add failing assertions for the SVG image, semantic hidden heading, eight-second loop, 360-degree rotation, and reduced-motion fallback.
- [ ] Run `node tests/interface-workshop-hero.test.mjs` and confirm failure because the new header is absent.
- [ ] Replace the visible heading markup with the semantic hidden heading plus decorative SVG image.
- [ ] Update the scoped header CSS for responsive artwork sizing and remove the old visible underline styling.
- [ ] Replace the SVG stop-and-jump keyframes with a continuous 360-degree eight-second rotation and reduced-motion rule.
- [ ] Run `node tests/interface-workshop-hero.test.mjs` and `git diff --check`.
- [ ] Inspect the focused diff to confirm no card or section animation changed.
