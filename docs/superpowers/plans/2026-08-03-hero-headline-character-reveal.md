# Hero Headline Character Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reveal the existing hero headline character by character with a fast, polished 3D entrance while preserving copy, layout, accessibility, and reduced-motion behavior.

**Architecture:** Keep the portfolio as a standalone HTML document. Add a scoped `initHeroHeadlineTextEffect()` helper to the existing page script; it wraps non-whitespace text characters while preserving the existing `.underlined` span, then animates those wrappers with the existing GSAP runtime.

**Tech Stack:** HTML, CSS, plain JavaScript, GSAP 3.15.0, Node acceptance assertions

## Global Constraints

- Do not convert the standalone page to React.
- Keep the headline copy exactly: `I shape messy product ideas into interfaces people understand.`
- Preserve the existing `interfaces` underline and responsive line wrapping.
- Delay the reveal by 0.5 seconds, use 0.025 seconds of stagger, and animate each character for 0.2 seconds.
- Start at opacity 0, `y: 10`, and `rotationX: 90`; finish at opacity 1, `y: 0`, and `rotationX: 0`.
- Play once on page load and bypass animation for `prefers-reduced-motion: reduce`.

---

### Task 1: Add and verify the headline character reveal

**Files:**
- Modify: `tests/interface-workshop-hero.test.mjs`
- Modify: `outputs/interface-workshop-hero.html`

**Interfaces:**
- Consumes: existing `#hero-title`, `.underlined`, global `gsap`, and global `reducedMotion` media query
- Produces: `initHeroHeadlineTextEffect(): void` and visual `.headline-char` wrappers

- [ ] **Step 1: Write the failing acceptance checks**

Append these assertions before the existing success log in `tests/interface-workshop-hero.test.mjs`:

```js
assert.match(html, /function initHeroHeadlineTextEffect\(\)/, 'initializes the hero headline character reveal');
assert.match(html, /className = 'headline-char'/, 'wraps visible headline characters for animation');
assert.match(html, /rotationX: 90, y: 10, autoAlpha: 0/, 'starts characters below and rotated away');
assert.match(html, /rotationX: 0, y: 0, autoAlpha: 1/, 'resolves characters into their final state');
assert.match(html, /stagger: \.025/, 'uses the approved fast character stagger');
assert.match(html, /delay: \.5/, 'delays the headline reveal by half a second');
assert.match(html, /headline\.setAttribute\('aria-label', accessibleText\)/, 'retains the full accessible headline');
assert.match(html, /if \(reducedMotion\.matches \|\| typeof gsap === 'undefined'\) return/, 'keeps a static fallback for reduced motion or missing GSAP');
```

- [ ] **Step 2: Run the acceptance checks and verify they fail**

Run:

```powershell
node tests/interface-workshop-hero.test.mjs
```

Expected: failure on `initializes the hero headline character reveal`.

- [ ] **Step 3: Add the scoped character styling**

Add to an existing style block in `outputs/interface-workshop-hero.html`:

```css
.headline--text-effect{perspective:900px}
.headline-char{display:inline-block;transform-origin:50% 75%;will-change:transform,opacity}
@media(prefers-reduced-motion:reduce){.headline-char{will-change:auto}}
```

- [ ] **Step 4: Implement the plain-JavaScript text splitter and GSAP reveal**

Add this helper near the other initializer functions:

```js
function initHeroHeadlineTextEffect() {
  const headline = document.querySelector('#hero-title');
  if (!headline) return;

  const accessibleText = headline.textContent.replace(/\s+/g, ' ').trim();
  headline.setAttribute('aria-label', accessibleText);
  if (reducedMotion.matches || typeof gsap === 'undefined') return;

  const textNodes = [];
  const collectTextNodes = node => {
    node.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) textNodes.push(child);
      else collectTextNodes(child);
    });
  };
  collectTextNodes(headline);

  textNodes.forEach(textNode => {
    const fragment = document.createDocumentFragment();
    Array.from(textNode.textContent).forEach(character => {
      if (/\s/.test(character)) {
        fragment.appendChild(document.createTextNode(character));
        return;
      }
      const span = document.createElement('span');
      span.className = 'headline-char';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = character;
      fragment.appendChild(span);
    });
    textNode.replaceWith(fragment);
  });

  const characters = headline.querySelectorAll('.headline-char');
  headline.classList.add('headline--text-effect');
  gsap.set(characters, { rotationX: 90, y: 10, autoAlpha: 0 });
  gsap.to(characters, {
    rotationX: 0,
    y: 0,
    autoAlpha: 1,
    duration: .2,
    stagger: .025,
    delay: .5,
    ease: 'power2.out',
    clearProps: 'willChange'
  });
}
```

Call `initHeroHeadlineTextEffect();` alongside the existing initializer calls.

- [ ] **Step 5: Run the full acceptance checks**

Run:

```powershell
node tests/interface-workshop-hero.test.mjs
git diff --check
```

Expected: `Interface Workshop hero acceptance checks passed.` and no whitespace errors.

- [ ] **Step 6: Review the final diff**

Run:

```powershell
git diff -- outputs/interface-workshop-hero.html tests/interface-workshop-hero.test.mjs
```

Confirm the diff changes only the headline animation CSS/JavaScript, initializer call, and related acceptance assertions. Do not stage unrelated existing portfolio assets or modifications.
