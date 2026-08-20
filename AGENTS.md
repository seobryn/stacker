# Stacker's Agent Guide

## Stack
- **Framework**: Astro 4 with TypeScript (strict mode via `astro/tsconfigs/strict`)
- **Package manager**: pnpm (not npm)
- **Build**: `astro check && astro build` (typecheck runs before build)

## Key Commands
```sh
pnpm dev          # Dev server at localhost:4321
pnpm build        # Runs astro check, then astro build → dist/
pnpm preview      # Preview production build locally
pnpm astro ...    # Run Astro CLI (add, check, etc.)
```

## Project Structure
- `src/pages/index.astro` — Game entry point, canvas setup, styles
- `src/game/experience.ts` — Core game loop (state machine, input handling, rendering)
- `src/game/utils.ts` — Random color/speed helpers
- `src/constants.ts` — Game config (box size, speeds, modes enum, audio)
- `public/sounds/` — Audio files served at `/stacker/sounds/`
- `public/favicon.svg` — Served at `/stacker/favicon.svg`

## Architecture Notes
- **Game state machine**: `BOUNCE` → `FALL` → `GAME_OVER` or back to `BOUNCE`; also `PAUSE`
- **Input**: Keyboard (`ArrowDown` to drop, `R` to restart, `Enter` to unpause, `Escape` to pause) on desktop; `pointerdown` on mobile
- **Rendering**: HTML5 Canvas 2D, `requestAnimationFrame` loop
- **Persistence**: High score in `localStorage` key `high-score`
- **Audio**: Background loop (`BG_SOUND`) + hit sound (`HIT_SOUND`), both from `/stacker/sounds/`
- **Base path**: All public assets served under `/stacker/` due to `base: "stacker"` in `astro.config.mjs`
- **Mobile**: Canvas resizes to `window.innerWidth/Height`; desktop fixed at 460×800

## Deployment
- GitHub Pages via `.github/workflows/deploy-to-gh.yml`
- On push to `main`, CI runs `pnpm install` → `astro build --site <origin> --base <base_path>`
- Output in `dist/` is uploaded as Pages artifact

## Code Style
- Prettier with `prettier-plugin-astro` (configured in `.prettierrc.mjs`)
- TypeScript strict mode enforced via `astro/tsconfigs/strict`

## Gotchas
- `INIT_BOX_Y_POS` is recalculated at init based on canvas height — don't hardcode
- Audio playback rate increases by 0.01 on each new box
- Debris falls at `ySpeed * 2` speed, despawns when off-canvas
- Background color darkens with score (black → gray gradient up to 50+ score)
