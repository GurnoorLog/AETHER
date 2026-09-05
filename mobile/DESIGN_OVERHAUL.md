# Design Overhaul — Launch + Account Creation

Superdesign project: `07964390-277d-4057-858d-adc65ca36613`
Draft (Account Creation): `bec91928-70b3-4a47-8ce5-56be18194d96` — "Aether AI Tutor - Account Creation"

## Goal
Full design overhaul of the mobile auth entry flow. Functionality stays identical — only visuals change.

## Screens
1. **Launch (`app/index.tsx`)** — already built. Changes:
   - Swap background to the new photo (`launchpageback.jpeg` → `assets/design/bg.jpg`). ✅ done
   - CTA "Let's start learning, my fella koala" → `router.push('/auth')` (slide-up, not login).
2. **Account Creation (`app/auth.tsx`)** — full visual rewrite to match the draft. Same logic as today:
   - `signUp()` → Supabase `auth.signUp` + `ensureUserData` → `/onboarding`
   - Google OAuth via `supabase.auth.signInWithOAuth`
   - "Already have an account? Log in" → `/login`

## Design tokens (from draft)
- Background: `assets/design/bg.jpg`, cover, centered
- Status bar mockup: `9:41` + signal/wifi/battery icons
- Brand header: `logo.png` (48px) + **AETHER** (Outfit 700, 18px, #2D2D2D, letterSpacing 2) + `AI TUTOR` (9px, #6B8E61, tracking 1.5, uppercase)
- Heading: "Welcome back! 👋" (Outfit 800, ~36px, #333333) + subtitle "Continue your learning journey with **Aether**." (#666666)
- Koala breathing space: `min-height: 140px` between header and card
- Card: bg `#FDFBF7`, top radius 40, shadow `0 -20px 40px rgba(0,0,0,0.05)`
  - "Create your account" (Outfit 700, 22px, #333333) + "Let's get you started!" (#999999)
  - Google button: white, border #EAEAEA, radius 16, h 56
  - Divider: `─── or ───` (#EEEEEE lines, #BBBBBB text)
  - Inputs: white, border #EAEAEA, radius 16, h 56, icons (#BBBBBB), focus border `#6B8E61` + glow ring
  - "Forgot password?" → #6B8E61, right-aligned
  - Primary CTA: `#6B8E61`, h 70, radius 35, white text + 52px white circle with `#6B8E61` arrow-right
  - "Already have an account? **Log in**" (#888888 / #6B8E61)
  - Home indicator (128×5, black 10%)

## Motion
- `_layout.tsx`: `Stack.Screen name="auth"` → `animation: 'slide_from_bottom'` (route slides up like the design's card).

## Icons
- `lucide-react-native`: `Mail`, `Lock`, `Eye`/`EyeOff`, `ArrowRight`, `Wifi`, `BatteryFull`, `SignalHigh`
- Google: inline SVG "G" mark (react-native-svg), since lucide has no brand icon.

## Files touched
- `mobile/app/index.tsx` (bg swap ✅, CTA target)
- `mobile/app/auth.tsx` (rewrite visuals, keep logic)
- `mobile/app/_layout.tsx` (slide-from-bottom on auth)
- `mobile/assets/design/bg.jpg` (new photo ✅)