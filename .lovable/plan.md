

## Plan: Redesign Footer + Create Terms/Privacy Pages + Update Contact Info

### 1. Redesign Footer (`src/pages/landing/FooterSection.tsx`)

Adopt the reference model's structure with COFOUND identity, using `motion/react` animated containers for scroll-in effects. Layout:

- **Top**: Large "Strategy HUB" brand text spanning full width with animated entrance
- **Bottom grid** (4 columns on desktop):
  - **Produto**: Funcionalidades, Plataforma, Integrações, Novidades
  - **Empresa**: FAQ, Sobre a COFOUND, Política de Privacidade, Termos de Uso
  - **Contato**: Email (leonardo@cofound.com.br), WhatsApp (+55 47 9634-2353)
  - **Redes Sociais**: LinkedIn, Instagram (with icons)
- **Copyright bar**: `© 2026 COFOUND. Todos os direitos reservados.`
- Dark navy background (`#071520`), Saira headings, Lexend body, staggered fade-in animations per column

### 2. Create Stub Pages

- **`src/pages/TermsOfUsePage.tsx`** — Simple page with placeholder structure for terms of use content (header + empty sections ready for content)
- **`src/pages/PrivacyPolicyPage.tsx`** — Same structure for privacy policy

### 3. Register Routes (`src/App.tsx`)

Add two new public routes:
- `/terms` → `TermsOfUsePage`
- `/privacy` → `PrivacyPolicyPage`

### 4. Update Contact Info Across Landing Page

Update all hardcoded fallback values:
- **`HeroSection.tsx`**: WhatsApp URL already correct (`554796342353`)
- **`FooterSection.tsx`**: Change email to `leonardo@cofound.com.br`, phone to `+55 47 9634-2353` with WhatsApp link (`https://wa.me/554796342353`), remove address/MapPin
- **`HeaderSection.tsx`**: Check and update any contact references

### Technical Notes
- Footer links to `/terms` and `/privacy` use `react-router-dom` `Link`
- External links (cofound.com.br, app.cofound.com.br) use regular `<a>` tags
- Motion animations use `useReducedMotion` for accessibility
- Pages are placeholder-ready for user to provide actual legal content later

