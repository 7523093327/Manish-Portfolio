# Hero Headline Character Reveal

## Goal

Add a polished character-by-character entrance to the existing hero headline without converting the standalone portfolio page to React or changing its typography, copy, layout, or underline styling.

## Motion design

- Begin the headline reveal 0.5 seconds after the page initializes.
- Animate each non-whitespace character independently.
- Start each character at opacity 0, 10 pixels below its final position, and 90 degrees of X-axis rotation.
- Resolve each character to opacity 1, zero vertical offset, and zero X rotation over 0.2 seconds with a decelerating ease.
- Stagger characters by 0.025 seconds so the long headline completes promptly.
- Preserve the existing `interfaces` wrapper and animate its blue underline into view as that word resolves.
- Play once on page load; do not tie this effect to scrolling.

## Implementation

The page remains plain HTML, CSS, and JavaScript. A small initializer will traverse text nodes inside `#hero-title`, wrap visible characters in animation spans, and use the existing GSAP runtime for the reveal. Whitespace remains intact so browser line wrapping continues to work naturally. The existing `.underlined` element remains in place.

## Accessibility and resilience

- Keep the complete headline as the accessible name of the `h1`.
- Treat generated character spans as visual presentation only.
- If `prefers-reduced-motion: reduce` is active, do not split or animate the headline.
- If GSAP is unavailable, immediately show the original static headline.
- Do not interfere with text selection, responsive type sizing, or the page progress indicator.

## Verification

- Acceptance checks confirm the initializer, timing, transform values, accessibility label, and reduced-motion branch exist.
- Existing portfolio acceptance checks must continue to pass.
- Verify that the headline copy remains unchanged and the `interfaces` underline is still present.
