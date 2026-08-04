# Featured Work Header Design

## Goal

Replace the current text-only Featured Work heading with the supplied `featured-work-header-1.svg` artwork and give its blue icon a slow, seamless rotation matching the reference GIF.

## Visual treatment

- Use `featured-work-header-1.svg` as the visible header artwork so the exported typography, icon, proportions, and spacing remain exact.
- Keep the header in its existing sticky position above the scrolling project cards.
- Remove the current HTML heading underline treatment from the visible presentation because the supplied SVG defines the final appearance.
- Size the artwork at its authored 392:60 aspect ratio while allowing it to scale down on narrow screens without cropping.

## Motion

- Rotate only the blue icon; the title remains static.
- Use a continuous 360-degree clockwise rotation over 8 seconds.
- Use linear easing so the loop has no visible acceleration, pause, or reset jump.
- Keep the rotation ambient and independent of card scroll animations.
- Disable the rotation when `prefers-reduced-motion: reduce` is active.

## Accessibility

- Retain an `h2` with the accessible text `Featured work`.
- Hide the decorative SVG image from assistive technology to avoid duplicate announcements.

## Implementation boundary

- Modify only `featured-work-header-1.svg`, the Featured Work header markup and its scoped CSS in `outputs/interface-workshop-hero.html`, and the related acceptance checks.
- Do not alter the work cards, sticky mask, section spacing, progress indicator, or existing card animations.

## Verification

- Confirm the HTML references `../featured-work-header-1.svg`.
- Confirm the SVG icon uses an 8-second linear infinite rotation and the reduced-motion media query disables it.
- Confirm the static semantic heading remains available.
- Run the complete interface acceptance checks and whitespace validation.
