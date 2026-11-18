# Project Agent Guidelines

## CSS Organization
- [src/index.css](src/index.css) is the style entry point and imports modular stylesheets from `src/styles/`.
- Edit the relevant module in `src/styles/` directly rather than putting everything back into `src/index.css`:
  - `base.css`: CSS tokens (`:root`), base reset, scrollbars
  - `controls.css`: icon buttons, circular checkboxes, form controls, toggle switches
  - `rolling-number.css`: rolling counter animations
  - `subject-tabs.css`: app shell/layout, subject selector tabs, subject switch transitions
  - `random-range.css`: random range pills inside active tab
  - `question-card.css`: accuracy bar, question card frame, scroll corners, option list, copy animations
  - `edit-source.css`: edit images toggle, collapsible drawers, source image slots, edited indicators
  - `edit-morph.css`: edit mode answer checkboxes, question/option morph inputs & labels
  - `navigation.css`: bottom navigation buttons and morph tracks
  - `history.css`: history list, cards, chevrons, skeleton placeholders
  - `utilities.css`: `prefers-reduced-motion` overrides and dark-theme utility overrides

## Browser / Screenshot Verification
- Do **not** run Chrome DevTools (`chrome-devtools-cli`) or browser screenshot verification by default.
- Rely on `npm test`, `npm run lint`, and `npm run build` for routine verification.
- Use browser screenshot verification **only when really needed** (e.g., complex layout, visual rendering, or browser-only interaction issues that cannot be verified from code/build/tests), and **ask the user beforehand** before launching browser verification.
