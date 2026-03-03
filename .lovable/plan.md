

## Plan: Standardize All Dark Backgrounds with Grid + Floating Elements

### Current State

The landing page has **5 distinct dark background styles** — each one different:

| Section | Current Background | Grid? | Floating Shapes? |
|---|---|---|---|
| **Hero** | `bg-cofound-blue-dark` | ✅ RetroGrid | ✅ 14 shapes |
| **DarkSectionsBackground** (SystemDemo + HowItWorks) | `bg-cofound-blue-dark` | ✅ RetroGrid (separate copy) | ✅ 8 shapes (separate copy) |
| **AtlasHighlight** | `gradient from-cofound-blue-dark via-[#112B45]` | ❌ | ❌ |
| **FAQ CTA Card** | `gradient from-cofound-blue-dark via-[#112B45]` | ❌ | ❌ |
| **Footer** | `bg-[#071520]` (different navy!) | ❌ | ❌ |

There are **3 separate implementations** of RetroGrid and FloatingShapes (Hero, DarkSectionsBackground, and index.css animation). This is duplicated and inconsistent.

### Solution

**1. Create a single reusable `DarkBackground` component** (`src/pages/landing/DarkBackground.tsx`)
- Extracts the shared RetroGrid + FloatingShapes into one component
- Accepts props: `className`, `children`, `as` (section/footer/div)
- Always renders: `bg-cofound-blue-dark` + RetroGrid + animated floating shapes
- Reduces the floating shapes to a balanced set (~8-10) that works everywhere

**2. Apply `DarkBackground` to all dark sections:**

- **HeroSection** — Replace inline RetroGrid/FloatingShapes with `<DarkBackground>`
- **DarkSectionsBackground** — Delete this file entirely, replace usage in LandingPageBase with `<DarkBackground>`
- **AtlasHighlightSection** — Replace the gradient bg with `<DarkBackground>`
- **FAQ CTA Card** — Wrap the CTA card interior with the grid+shapes pattern (or keep as card with subtle version)
- **FooterSection** — Replace `bg-[#071520]` with `<DarkBackground as="footer">`

**3. Update LandingPageBase** — Remove `DarkSectionsBackground` import, use new `DarkBackground` wrapper

### Files Changed

| File | Action |
|---|---|
| `src/pages/landing/DarkBackground.tsx` | **CREATE** — Reusable component with RetroGrid + FloatingShapes |
| `src/pages/landing/HeroSection.tsx` | **EDIT** — Remove inline RetroGrid/FloatingShapes (~50 lines), use `DarkBackground` |
| `src/pages/landing/DarkSectionsBackground.tsx` | **DELETE** — Replaced by DarkBackground |
| `src/pages/landing/AtlasHighlightSection.tsx` | **EDIT** — Replace gradient bg with `DarkBackground` |
| `src/pages/landing/FooterSection.tsx` | **EDIT** — Replace `bg-[#071520]` with `DarkBackground` |
| `src/pages/landing/FAQSection.tsx` | **EDIT** — Add grid+shapes to the CTA card |
| `src/pages/landing/LandingPageBase.tsx` | **EDIT** — Swap DarkSectionsBackground → DarkBackground |

This eliminates ~100 lines of duplicated code and ensures every dark section has the same visual treatment as the hero.

