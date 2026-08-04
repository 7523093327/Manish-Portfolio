# Featured Work Decorative Landing Design

## Goal

Make each non-Zacks card's colored decorative clip enter smoothly as its card reaches the viewport, without the current sudden appearance at the artwork crop boundary.

## Motion design

- Keep each decoration as its existing transparent SVG layer; do not redraw or recolor it.
- Start the decoration inside the artwork's visible runway at opacity `0`, scale `0.86`, and a card-specific positional and rotational offset.
- During the first portion of the card's scroll build, fade and travel to a small overshoot using `power3.out`.
- Settle from the overshoot to the authored position and scale using `back.out(1.15)`.
- Match the existing card choreography: decoration begins first, thumbnail follows, and text resolves at timeline offset `.3`.
- Preserve the complete static master SVG on mobile and for `prefers-reduced-motion`.

## Constraints

- No new animation dependency.
- No layout, typography, color, copy, or route changes.
- Do not animate the whole card beyond the existing shared scale behavior.
- Decorations must remain transparent layers without cream background fills.

## Verification

- Acceptance tests assert the initial state, approach, overshoot, and settle.
- Compile the inline JavaScript.
- Validate every decoration SVG is transparent and well formed.
