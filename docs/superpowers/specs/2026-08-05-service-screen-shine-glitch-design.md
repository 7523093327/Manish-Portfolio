# Service Screen Shine and Glitch Design

## Scope

Add the missing slow screen-shine animation and synchronize a screen flicker with the existing 240ms Services channel change. Preserve the current machine geometry, screen bounds, service content sizing, module cycle, knob animation, beacon animation, service order, and click behavior.

Do not redraw the supplied screen assets, change right-panel content, introduce a new service, or redesign the switchboard.

## Root cause

The current Services screen does not render the supplied screen-base or reflection assets. A generated `::before` gradient attempts to act as a reflection, but its animation moves only from `translateX(-7%)` to `translateX(7%)`, so it never travels across the display. The existing 240ms channel switch uses content jitter and scanlines only; it does not render a dark screen frame.

## Corrected asset mapping

The filenames are visually reversed. Use them according to their appearance and the user's correction:

- Normal light-blue screen: `Service animation/Screen dark apprearn only at glitch.svg`
- Dark glitch-only screen: `Service animation/Normal screen.svg`
- Moving reflection: `Service animation/Screen reflection.svg`

Keep the filenames unchanged on disk. The mapping is intentional and must be documented in markup comments or descriptive class names so a future cleanup does not reverse it again.

## Layer architecture

Render persistent child layers inside the existing `.service-screen` element in this order:

1. `.service-screen__base` at `z-index: 0`: the light-blue normal-screen asset, always visible.
2. `.service-screen__glitch-base` at `z-index: 1`: the dark screen asset, normally transparent and visible only during the channel-switch flicker.
3. `.service-screen__shine-track` at `z-index: 2`: a clipped movement wrapper that crosses the display diagonally.
4. `.service-screen__reflection` inside the track: the supplied reflection asset at a restrained `0.16` maximum opacity.
5. `.service-screen__content` at `z-index: 3`: the selected service content, preserving all current per-service widths and alignment.
6. `.service-screen::after` at `z-index: 4`: the existing scanline/signal overlay during switching.

All decorative image layers use empty alt text, `aria-hidden="true"`, and `pointer-events: none`. The `.service-screen` remains the clipping boundary, so the machine outline and knobs are unaffected.

## Ambient shine motion

The shine track moves continuously for `12s` using `cubic-bezier(0.4, 0, 0.2, 1)` and loops infinitely.

- Start: `translate3d(-105%, 8%, 0)` with reflection opacity `0`.
- Fade in by 12% of the timeline to opacity `0.16`.
- Cross the screen diagonally from lower-left toward upper-right.
- Reach `translate3d(105%, -8%, 0)` by 88% of the timeline.
- Fade back to opacity `0` at 100% so the loop reset is invisible.

The supplied diagonal line geometry provides the reflection shape; CSS only moves and fades the existing asset. Do not add a second generated gradient or animate the service content itself for ambient shine.

## Channel-switch flicker

Reuse the existing `.service-screen.is-switching` state and `240ms` duration. The JavaScript timing remains unchanged.

During `.is-switching`:

- The dark glitch screen pulses in three short, stepped flashes behind the content.
- The reflection's opacity flickers between approximately `0.05` and `0.24` while the shine track continues moving without restarting.
- The existing content jitter, 120ms midpoint source swap, and scanline overlay remain active.
- At 240ms, the dark layer and reflection return to their normal states when `is-switching` is removed.

The movement and opacity responsibilities are separated: the track owns `transform`, while its child reflection image owns ambient/flicker `opacity`. This prevents the channel flicker from resetting or snapping the 12-second diagonal sweep.

Rapid service clicks keep the existing latest-selection-wins behavior because `clearGlitch()` removes and reapplies the same class and clears the existing timers.

## Reduced motion

When `prefers-reduced-motion: reduce` matches:

- stop the 12-second shine-track movement;
- keep the reflection static at a restrained `0.10` opacity;
- keep the dark glitch screen hidden;
- disable reflection and dark-screen flicker; and
- preserve the existing immediate service-content swap.

## Responsive behavior

All screen layers use `position: absolute; inset: 0; width: 100%; height: 100%` inside the existing 689 × 518 screen ratio. No desktop or mobile-specific coordinates are introduced. The effect must remain aligned at the existing desktop width and at the `700px` breakpoint.

## Testing and verification

Automated tests must first fail against the current pseudo-element-only implementation and then cover:

- the corrected normal and glitch asset mapping;
- exactly one normal base, one glitch base, and one reflection layer;
- the required z-index order beneath content and scanlines;
- a 12-second diagonal shine sweep from negative to positive X with Y change;
- three stepped dark-screen flashes during `.is-switching`;
- reflection flicker that does not replace the shine-track transform animation;
- unchanged 240ms glitch duration and 120ms content midpoint swap;
- reduced-motion static reflection and hidden dark layer; and
- no changes to the six-service mapping, knob controller, or beacon handoff.

Browser verification must sample the shine-track transform at multiple times to prove continuous left-to-right movement, click a service to confirm the dark/reflection flicker, check content readability and layer alignment at desktop and narrow widths, confirm no console errors, and run `git diff --check`. The known unrelated Featured Work assertion and missing `sharp` dependency should be reported accurately if they remain in the full suite.
