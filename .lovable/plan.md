

## Problem

The tablet/screenshot 3D scroll animation feels choppy. The `useScroll` + `useTransform` setup lacks smoothing — values jump frame-by-frame with raw scroll position.

## Solution

Add `spring`-based smoothing to the motion values using `useSpring` to interpolate the raw `useTransform` outputs, making rotation, scale, and translate transitions buttery smooth.

### Changes in `src/components/ui/container-scroll-animation.tsx`:

1. Import `useSpring` from `motion/react`
2. Wrap `rotate`, `scale`, and `translate` transforms with `useSpring` using a config like `{ stiffness: 80, damping: 30, mass: 0.5 }` for smooth easing
3. Reduce the initial rotation from `20` to `12` degrees for a subtler effect
4. Add `offset: ["start end", "end start"]` to `useScroll` for a wider scroll range, preventing abrupt start/stop

