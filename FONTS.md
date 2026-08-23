# FONTS.md — School CMS Demo

Curated font list for the typography tester in Studio.
Audience: students, the public, and aesthetically-minded staff (art, form, design, color).

---

## Font list (18 total)

Geist loads via `next/font/google` (already in the project). The others load from Google Fonts.

> **Privacy tradeoff (unresolved).** The others are fetched by the *visitor's*
> browser from `fonts.googleapis.com`/`fonts.gstatic.com`, so Google receives every
> visitor's IP address and user agent on every page load. This is disclosed in
> `/privacy` as a recipient. Self-hosting the woff2 files would remove that request
> entirely, but it also removes the point of the picker — an editor choosing any
> Google Font at runtime. Revisit if the demo ever gets real visitors whose data
> matters, or narrow the list to a self-hosted handful.

### Current font (selectable)

| Font | Loading | Character | Best for |
|---|---|---|---|
| Geist | `next/font/google` | Modern sans-serif, technically clean — Vercel's own | Everything |

### Montserrat family (requested)

| Font | Google Fonts name | Notes |
|---|---|---|
| Montserrat | `Montserrat` | Geometric, clean, versatile — works for everything |
| Montserrat Alternates | `Montserrat+Alternates` | Distinctive alternate letterforms, more personality |
| Montserrat Underline | `Montserrat+Underline` | Decorative variant — **headers only**, not body text |

### Curated additions

| Font | Google Fonts name | Character | Best for |
|---|---|---|---|
| Playfair Display | `Playfair+Display` | Elegant editorial serif, high stroke contrast | H1, H2 |
| Cormorant Garamond | `Cormorant+Garamond` | Ultra-light, artistic, luxurious — gallery feel | H1 on large areas |
| Josefin Sans | `Josefin+Sans` | Art Deco-inspired geometric sans, 1920s feel | H1, H2, H3 |
| Raleway | `Raleway` | Thin, elegant sans with a distinctive W shape | Headings |
| Space Grotesk | `Space+Grotesk` | Modern, slightly angular geometric — "design school" feel | Everything |
| Lora | `Lora` | Balanced serif, excellent body-text readability | Body text |
| Nunito | `Nunito` | Round, warm, approachable — soft and inviting | Body text, H3 |
| Libre Baskerville | `Libre+Baskerville` | Classic, robust serif, highly readable | Body text |

### Display & script fonts (additions)

| Font | Google Fonts name | Character | Best for | Note |
|---|---|---|---|---|
| Germania One | `Germania+One` | Gothic/medieval style, heavy and distinctive | H1, logo-like headings | **Headings only** |
| Concert One | `Concert+One` | Rounded display, festive and playful | H1, event headings | **Headings only** |
| Merriweather | `Merriweather` | Traditional, highly readable serif — newspaper feel | Body text, H2, H3 | Works as body text |
| Courgette | `Courgette` | Cursive script font, personal and flowing | H1, quotes | **Headings only** |
| Parisienne | `Parisienne` | Elegant script font with French charm | H1, decorative headings | **Headings only** |
| Lugrasimo | `Lugrasimo` | Handwriting-inspired, relaxed and personal | H1, decorative touches | **Headings only** |

---

## Pairing tips

Four ready-made combinations to start with in Studio:

### 1. Editorial — magazine and newspaper feel
- **H1:** Playfair Display
- **H2/H3:** Lora
- **Body text:** Lora

### 2. Art gallery — light, airy, luxurious
- **H1:** Cormorant Garamond
- **H2:** Raleway
- **H3:** Raleway
- **Body text:** Nunito

### 3. Modern design school
- **H1:** Josefin Sans
- **H2/H3:** Space Grotesk
- **Body text:** Space Grotesk

### 4. Classic folk education
- **H1/H2/H3:** Montserrat Alternates
- **Body text:** Libre Baskerville

---

## Technical notes

- All fonts load via a shared Google Fonts `<link>` tag in the root layout — all 18 always load, and the CSS variable determines which one displays. This eliminates FOUC on switch.
- CSS variables control the choice: `--font-h1`, `--font-h2`, `--font-h3`, `--font-body` are set in a `<style>` tag injected from the root layout based on D1 data.
- `globals.css` declares: `h1 { font-family: var(--font-h1, 'Montserrat', sans-serif); }` and so on.
- **Montserrat Underline**, **Germania One**, **Concert One**, **Courgette**, **Parisienne**, and **Lugrasimo** are marked as "Headings only" (`headingOnly: true`) in the Studio interface and appear only in the heading pickers, not in the body-text picker.

---

## Lock feature in Studio

| State | Who can change it | UI behavior |
|---|---|---|
| `locked = true` | No one | Read-only mode, "Unlock" button visible to admin |
| `locked = false` | Admin + staff | Edit mode with Save + Lock button |

Prod and dev have separate D1 databases — the lock applies per environment. Typical flow:
1. Experiment freely in dev (`locked = false`)
2. Decide on a combination, apply it manually in prod via Studio
3. Lock prod (`locked = true`)
