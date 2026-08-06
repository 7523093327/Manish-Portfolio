# Smooth Service Knob Rotation Design

## Scope

Replace the abrupt bottom-knob image swaps in the existing Services Switchboard with smooth, inline needle rotation synchronized to the six-service module cycle. Preserve the current machine, module stack, right display, beacon, glitch effect, service order, responsive placement, and total cycle timing.

This change must not embed or play the reference GIF, crossfade duplicate knob images, add knob DOM nodes during service changes, or redesign any other part of the Services section.

## Root cause

The current implementation renders one `service-knobs` image and changes its `src` among `bottom-knobs 1.svg` through `bottom-knobs 6.svg` inside `setActive(index)`. Each source contains the complete knob housing and needles, so the browser can only replace one static frame with another. There is no transformable needle geometry and therefore no interpolation.

## Rendering architecture

Replace the knob `<img>` with one persistent inline `<svg class="service-knobs">` using the supplied assets' exact `viewBox="0 0 195 56"` geometry.

- Copy the static cream outer rings and dark inner discs from knob state 1.
- Render exactly three white needle elements above those static bodies.
- Rotate only the needles; the housings never translate, scale, fade, or rotate.
- Use these transform centers in the 195 × 56 coordinate system:
  - left: `(29.258, 27.900)`
  - middle: `(97.385, 27.900)`
  - right: `(165.512, 27.900)`
- Keep the existing responsive overlay placement: `left: 77.559%`, `top: 87.376%`, `width: 12.914%`.
- Keep one knob SVG in the DOM for the lifetime of the section.

The inline SVG is decorative and remains `aria-hidden="true"` with `pointer-events: none`.

## Knob states

The six service states map to the three needle angles below. Angles are clockwise degrees from the upright state.

| Service index | Service | Left | Middle | Right |
| --- | --- | ---: | ---: | ---: |
| 0 | Product Design | 0° | 0° | 0° |
| 1 | UX Research | −45° | 45° | 75° |
| 2 | UI Design | 60° | −30° | −45° |
| 3 | Design Systems | −120° | 45° | −105° |
| 4 | Website Design | −240° | −120° | 60° |
| 5 | Visual Design | −360° | 0° | 0° |

The unwrapped Website Design and Visual Design values preserve the reference GIF's intended direction and avoid a long-path reversal. Product Design and Visual Design are visually identical, so the sixth-to-first handoff has no visible reset.

For an arbitrary direct click, target angles are converted to the nearest equivalent revolution around each needle's currently rendered angle. This prevents a needle from spinning an unnecessary full turn.

## Motion choreography

Use the existing timing constants as the synchronization clock:

- module fill: `2350ms`
- TV-channel glitch/click catch-up: `240ms`
- remaining module-fill travel after click catch-up: `2110ms`
- beacon-off handoff hold: `160ms`

Use transform-only animation with the section's controlled mechanical personality: `cubic-bezier(0.2, 0, 0, 1)`, no bounce, overshoot, opacity change, or housing motion.

### Initial load

Set the needles to Product Design without a transition, then animate from Product Design toward UX Research during the first 2350ms module fill.

### Automatic cycle

At the start of a service state, the needles are already at that service's angles. Animate them toward the next service's angles over the 2350ms module fill. Land exactly when the fill animation completes, then hold during the 160ms beacon-off handoff. The subsequent right-screen glitch does not restart or snap the needles.

### Direct click

When the user clicks any service:

1. Cancel the active needle animation while preserving each needle's currently rendered angle.
2. Make the clicked service active immediately.
3. Rotate from the preserved angles to the clicked service's angles over the first 240ms, synchronized with the TV-channel glitch.
4. Continue from the clicked service's angles toward the next service's angles over the remaining 2110ms of that module fill.
5. Finish at the next state before the 160ms handoff.

Rapid repeated clicks restart this sequence from the angles currently visible at the moment of the newest click. No click may snap a needle back to a prior endpoint.

## State and lifecycle

Keep `activeServiceIndex` as the single service-selection state. Add a small knob controller inside `initServiceSwitchboard()` that:

- stores the current animation handles;
- reads the currently rendered rotation before cancellation;
- resolves nearest-equivalent target angles;
- creates the automatic or clicked keyframe sequence;
- commits exact final endpoint transforms when an animation finishes; and
- cancels stale completion callbacks using the same latest-transition-wins principle as the right-screen glitch.

The controller must not create additional knob SVGs or service rows.

## Reduced motion

When `prefers-reduced-motion: reduce` matches:

- cancel any running needle animations;
- set the needles directly to the selected service's angles;
- do not animate toward the next state; and
- keep click selection and all content mappings functional.

## Testing and verification

Automated tests must first fail against the current snapshot implementation and then cover:

- one inline knob SVG and exactly three needle elements;
- removal of the six-source knob preload/swap behavior;
- the six angle states and exact timing constants;
- automatic state-to-next-state animation;
- direct-click 240ms catch-up followed by 2110ms travel;
- interrupted clicks starting from the currently rendered angle;
- sixth-to-first visual continuity; and
- reduced-motion static selected-state behavior.

Browser verification must confirm desktop and narrow viewport alignment, no duplicate or ghost housings, smooth click and automatic cycling, needle landing before beacon handoff, and no movement with reduced motion. Run the focused Services tests, the full suite while documenting the known unrelated Featured Work assertion if it remains, and `git diff --check`.
