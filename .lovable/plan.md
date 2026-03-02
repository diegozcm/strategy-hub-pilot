

## Plan: Revamp Hero Section

### Changes to `src/pages/landing/HeroSection.tsx`

1. **Shorten the title** — Replace the long phrase with something concise like "Planejamento Estratégico Inteligente" (title) + "para o seu negócio" (green line).

2. **Remove stats section** — Delete the `stats` array and the inline stats block entirely.

3. **Add floating elements** — Add animated floating decorative elements (geometric shapes like circles, squares, hexagons) using `motion.div` with infinite float/pulse animations positioned absolutely around the hero.

4. **Add background grid** — The RetroGrid is already present but may not be visible (the `animate-grid` keyframe is missing from tailwind config). Will ensure the grid renders properly by using inline animation or adding the keyframe.

5. **Replace screenshot with ContainerScroll animation** — Wrap the `ScreenshotImage` in a new `ContainerScroll` component that applies a 3D perspective rotation that flattens as the user scrolls down.

### New file: `src/components/ui/container-scroll-animation.tsx`

Create the `ContainerScroll` component adapted from the provided code:
- Replace `framer-motion` imports with `motion/react` (already installed as `motion` package).
- Remove Next.js-specific code.
- Accepts `titleComponent` and `children`, applies scroll-driven rotate/scale transforms.

### Summary of visual changes
- Shorter, punchier hero title
- No stats row below buttons
- Floating geometric shapes with subtle animations
- RetroGrid background with visible animation
- Dashboard screenshot with scroll-driven 3D perspective animation

