# Service Screen UI Alignment and Channel-Switch Glitch Design

## Scope

Correct the UI Design content alignment inside the existing Services switchboard and replace the current fade/drop content change with a brief television-channel-switch glitch. Do not redesign the switchboard, alter the six-service order, create additional module rows, or change the beacon, knob, module-fill, heading, or auto-cycle timing.

## Root cause and alignment correction

All six right-screen SVG assets share a height of 476 SVG units and are rendered into a content box that is 91.89% of the service-screen height. Five services calculate their CSS width from that common rendered height and the asset's intrinsic aspect ratio. UI Design is the exception:

- UI Design canvas: `462 × 476`.
- Correct normalized content width: approximately `67.02%` of the service screen.
- Current configured width: `80.84%`.

Because an external SVG preserves its intrinsic aspect ratio, the oversized image box introduces horizontal letterboxing and centers UI Design farther right than the other services. Change only UI Design's service-data width from `80.84%` to `67.02%`. Retain the common `6.97%` left position, `3.67%` top position, and `91.89%` height used by every service. Do not edit the UI Design SVG artwork.

## Motion intent

The transition should feel like the illustrated machine is changing television channels: quick, mechanical, and slightly imperfect, while keeping the incoming service readable immediately after the switch.

- Motion personality: energetic mechanical micro-interaction.
- Total duration: 240ms.
- Amplitude: no more than 3px of horizontal content movement.
- No bounce, large displacement, RGB color separation, persistent static, or screen-wide flashing.
- Apply the effect only when the active service changes. Do not run it continuously.

## Channel-switch sequence

Use the existing `.service-screen` and `.service-screen__content` elements. Add transient state classes; do not add or duplicate service content nodes.

1. At 0ms, update the selected module, beacon, and knob state immediately and start the glitch.
2. From 0–120ms, move the outgoing content horizontally by 2–3px in discrete steps while lowering its opacity.
3. At 120ms, when content opacity is near zero, replace the image `src` and `alt` with the selected service.
4. From 120–240ms, reveal the incoming content with one smaller stepped correction back to its resting position.
5. At 240ms, remove all transient classes and inline animation state so the content is fully opaque and untransformed.

The current 220ms fade/drop transition is removed. The service auto-cycle remains 2.35 seconds per module, and clicking a module still selects it immediately before the normal cycle continues.

## Screen signal overlay

Use `.service-screen::after` as one transient signal layer above the service content. The existing `.service-screen::before` reflection remains below the content.

- Reflection: `z-index: 1`.
- Service content: `z-index: 2`.
- Signal overlay: `z-index: 3`.
- The overlay contains two thin horizontal luminance bands plus faint scanlines made from CSS gradients.
- Animate only overlay opacity and transform with stepped timing.
- Peak overlay opacity must remain at or below `0.42` and disappear completely at the end.
- Keep the screen's existing rounded clipping so no signal band escapes the display.

The effect uses discrete `steps()` timing to produce the electronic snap while relying primarily on compositor-friendly opacity and transform changes. Reference behavior: [MDN `steps()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/easing-function/steps) and [web.dev animation performance](https://web.dev/articles/animations-guide).

## State and interruption handling

- Keep one `activeServiceIndex` and the existing data-driven six-service mapping.
- Reuse timer variables for the midpoint swap and final cleanup.
- Before starting a new transition, clear any pending swap/cleanup timers and remove the previous transient classes.
- If the user clicks during a transition, the latest selection wins and starts a fresh 240ms transition from a clean state.
- Selecting the already-active module does not create a duplicate transition or DOM node.
- Continue using the existing image `alt` pattern: `<Service Name> service details`.

## Reduced motion

When `prefers-reduced-motion: reduce` is active:

- Swap `src`, `alt`, and content width immediately.
- Do not apply content jitter, signal bands, scanlines, fades, or transient screen classes.
- Keep all existing static service content, active-module, beacon, and knob fallbacks intact.

## Verification

- Confirm UI Design's title, description, illustration, and checklist align with the same screen origin as the other five services.
- Confirm UI Design uses `67.02%` width and the other five widths remain unchanged.
- Confirm each click and auto-cycle transition swaps the image once at the 120ms midpoint.
- Confirm the glitch ends at 240ms with opacity `1`, no transform, and no lingering overlay.
- Confirm rapid clicks leave only the latest selected service visible.
- Confirm exactly six service modules remain and no content images or module rows are duplicated.
- Confirm the reflection stays behind content and the transient signal overlay stays above content without obscuring readability after the transition.
- Confirm reduced motion performs an immediate, animation-free swap.
- Confirm existing module, beacon, knob, heading-handoff, and Services layout tests remain green.

