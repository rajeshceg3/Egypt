# Giza: light on limestone

An original Three.js spatial illustration of the Giza plateau, with four subject viewpoints: the plateau, Khufu, Khafre and Menkaure. This is not a surveyed reconstruction or a navigation/weather service.

## Controls and accessibility
- Drag the canvas, or focus it and use arrow keys, to look around.
- Reset restores the selected subject's canonical angle and clears the drag state.
- Pause stops ambient dust movement and uses demand rendering. Reduced-motion users start paused.
- Sound is off until explicitly enabled. It is synthesized wind/rumble, not a field recording. Mute suspends the audio context; replay resumes it.
- About contains the historical sources. Main labels are at least16px; controls at least44px.

## Historical references
- https://egymonuments.gov.eg/en/archaeological-sites/giza-plateau
- https://egymonuments.gov.eg/en/monuments/the-great-pyramid
- https://egymonuments.gov.eg/en/monuments/pyramid-complex-of-menkaure

The illustration uses three pyramid forms, Khafre's pale upper casing and a granite lower quarter on Menkaure. Geometry, setting and stone treatment are illustrative.

## Development and proof
```
npm ci --ignore-scripts
npm run lint
npm run build
npm run verify:scenes
```
The Chromium gate checks each viewpoint after a real pointer drag, arrow-key input and Reset, at320/390/1440 widths in reduced and normal motion. It checks silent startup, reduced-motion defaults, pause idleness, control/label floors, overflow and the About dialog. CI uploads its actual screenshots.

`scripts/glyph-capture.mjs` captures original, hidden-ink, black-ink and white-ink screenshots. `scripts/glyph-contrast.py` measures the worst solid glyph-core pixel against its exact backdrop, not a median scene color. The committed104 samples measure at least9.465:1 in the local production build.

Actual application output was captured for12seconds after opt-in: mean-28.7dB, peak-15.6dB, no digital clipping in that sample. Subjective listening quality remains unverified and is not a completed test.

`verification/` contains executed result data, not screenshots reconstructed from source. Live deployment must be checked separately after merge.
