

## Plan: Landing Page Design System Standardization

### Problems Identified

After auditing all 10+ sections, here are the inconsistencies:

**1. Container width chaos**
- HeroSection: `container mx-auto px-4` (1400px max via Tailwind config)
- ValueProposition: `container mx-auto` + inner `max-w-6xl` (1152px)
- SystemDemo: `container mx-auto` (1400px)
- PlatformFeatures: `container mx-auto` + inner `max-w-6xl`
- AtlasHighlight: `container mx-auto` + inner `max-w-6xl`
- FAQ: `container mx-auto max-w-6xl`
- Authority: wrapper `max-w-6xl`, outer `container mx-auto max-w-6xl`
- Footer: `container mx-auto px-4`
- **Result**: Content widths jump between 1152px and 1400px randomly

**2. Vertical padding chaos**
- Hero: `pt-36 pb-0`
- ClientLogos: `py-14`
- ValueProposition: `py-28`
- SystemDemo: `py-24`
- HowItWorks: `py-28`
- PlatformFeatures: `py-20`
- AtlasHighlight: `py-20`
- Authority: `py-24`
- FAQ: `pt-8 pb-24`
- Footer: `py-16 lg:py-20`
- **Result**: Sections have inconsistent breathing room

**3. Heading sizes inconsistent**
- ValueProposition: `text-3xl md:text-5xl lg:text-[3.25rem]`
- SystemDemo: `text-3xl md:text-5xl`
- HowItWorks: `text-3xl md:text-5xl`
- PlatformFeatures: `text-3xl md:text-4xl`
- AtlasHighlight: `text-3xl md:text-4xl`
- Authority: `text-3xl md:text-5xl`
- FAQ: `text-3xl md:text-5xl`

**4. Transparent/invisible icons** — Floating shapes use `bg-cofound-green/[0.03]` and `border-cofound-green/10` making them nearly invisible

**5. Subtitle text sizes mixed** — `text-base`, `text-lg`, `text-base md:text-lg` inconsistently

**6. Button border-radius** — Header uses `rounded-xl`, Hero uses `rounded-full`, CTA card uses `rounded-full`

**7. Section badge/label styles different per section** — Each section has its own badge variant

**8. Mobile responsive issues** — HowItWorks timeline 4-column layout breaks on mobile, SystemDemo grid doesn't stack properly, FAQ grid doesn't collapse well

---

### Standardization Rules (Design Tokens)

```text
LAYOUT
├── All sections: max-w-6xl mx-auto px-6 (consistent 1152px content width)
├── Vertical rhythm: py-24 for all major sections (consistent)
├── Small divider sections (logos): py-12

TYPOGRAPHY (Section Headers)
├── Label/badge: text-xs font-sans font-semibold tracking-widest uppercase text-cofound-green
├── H2: text-3xl md:text-4xl font-display font-bold
├── Subtitle: text-base text-{color}/50 font-sans max-w-xl mx-auto

BUTTONS
├── All CTAs: rounded-full (unify)
├── Primary: bg-cofound-green text-cofound-blue-dark font-bold
├── Secondary: border-white/20 bg-white/5 text-white

FLOATING SHAPES
├── Increase opacity: border-cofound-green/20 bg-cofound-green/[0.08]
├── Make them actually visible without being distracting

RESPONSIVE
├── HowItWorks: 2x2 grid on mobile instead of 4-col timeline
├── SystemDemo: stack vertically, full-width carousel
├── FAQ: single column on mobile
```

### Changes Per File

1. **HeroSection.tsx** — Standardize inner container to `max-w-6xl`, unify button radius to `rounded-full` (already done), fix floating shape opacity
2. **ClientLogosSection.tsx** — Use `max-w-6xl mx-auto px-6`, reduce padding to `py-12`
3. **ValuePropositionSection.tsx** — Use `max-w-6xl mx-auto px-6`, `py-24`, heading to `text-3xl md:text-4xl`
4. **SystemDemoSection.tsx** — Use `max-w-6xl mx-auto px-6`, `py-24`, heading to `text-3xl md:text-4xl`, fix mobile grid
5. **HowItWorksSection.tsx** — Use `max-w-5xl` inside `max-w-6xl`, `py-24`, heading to `text-3xl md:text-4xl`, make timeline responsive (stack on mobile)
6. **PlatformFeaturesSection.tsx** — Use `max-w-6xl mx-auto px-6`, `py-24` (already `py-20`)
7. **AtlasHighlightSection.tsx** — Use `max-w-6xl mx-auto px-6`, `py-24`
8. **AuthoritySection.tsx** — Heading to `text-3xl md:text-4xl`, keep `max-w-6xl`
9. **FAQSection.tsx** — Use `py-24`, heading to `text-3xl md:text-4xl`
10. **FooterSection.tsx** — Use `max-w-6xl mx-auto px-6`
11. **DarkSectionsBackground.tsx** — Increase floating shape visibility
12. **HeaderSection.tsx** — Unify button radius to `rounded-full`
13. **LandingPageBase.tsx** — Remove redundant wrapper `container mx-auto max-w-6xl` from AuthoritySection

All changes are class-level adjustments — no structural rewrites needed.

