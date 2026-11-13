# Signal Room — Creative Workbench

A local-first prototype inspired by the user's workflow reference images. It turns a user-entered brand brief and manual observations about a public ad into:

- seven labeled research notes (only when the user supplies them),
- three distinct original creative angles,
- a 30-second short-form video script with a fact-check placeholder,
- five original vertical-video generation prompts, and
- a caption draft plus local save, copy, and Markdown export.

## Open it

Open `index.html` in a modern browser. The sample brief is fictional and can be loaded with the button in the input panel.

## Boundaries

- The app does not scrape or fetch public links. It never downloads reference ads.
- It creates text concepts only. Video generation, AI model calls, analytics, and social publishing are not connected.
- Saved briefs use this browser's `localStorage`. They are not uploaded to a server, but other people using the same browser profile could see them.
- The script leaves a proof placeholder so users do not accidentally publish invented product claims.
- Do not reproduce third-party footage, characters, music, logos, or a real person's likeness without appropriate rights.

## Design direction

The interface uses a graphite-blue working rail, cool field-gray canvas, sea-glass action color, and a signal-gold seal. Georgia display type contrasts with a plain system sans-serif. The large editorial heading and three-angle board make the brief-to-script transformation the main visual event; inputs remain compact and left aligned. Layout collapses to one column, then a bottom navigation rail on narrow screens. Keyboard focus and reduced-motion preferences are supported.

## Next integrations

1. Add an optional AI provider for richer ad-note analysis and script variants, with explicit user configuration and a review step.
2. Add source retrieval only through permitted public APIs or a user-supplied transcript; keep source content separate from generated copy.
3. Connect an approved video-generation provider to render original scenes.
4. Keep publishing as a separate human-reviewed action with per-account licensing and draft checks.

