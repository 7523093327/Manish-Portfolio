# Portfolio accessibility pass

## Goal

Make the existing portfolio usable at mobile, tablet, and desktop sizes without changing its established illustrated visual language.

## Scope

- Keep Featured Work artwork at its current visual scale and composition.
- Add compact, responsive HTML project information beneath each Featured Work card on small screens so case-study content remains readable without relying on the image artwork.
- Restore an operable mobile navigation menu and ensure all navigation destinations exist or are removed from the menu.
- Make Services switchboard controls practical touch targets on narrow screens without changing the machine layout.
- Add a visible pause/resume control for continuously moving ticker and service-cycle motion; retain reduced-motion support.
- Ensure service-panel changes expose the active title, description, and benefits as meaningful accessible text.

## Non-goals

- No visual redesign of featured cards, the switchboard, hero, or typography system.
- No new portfolio content or additional service categories.
- No changes to the desktop card composition beyond accessible supporting text where necessary.

## Responsive behavior

- Desktop and tablet preserve the artwork-led card layout.
- On mobile, each work card keeps its artwork and gains a concise title, existing short description, and its existing case-study link below it.
- Service controls maintain their visual row layout but receive a separate accessible hit area of at least 24 CSS pixels.

## Verification

- Confirm all internal navigation links resolve to page sections.
- Verify keyboard operation for navigation, cards, services, and motion controls.
- Verify that mobile card information remains readable at 320px and 390px viewport widths.
- Verify service cycling and ticker can be paused and are disabled by reduced-motion preference.
