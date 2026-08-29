# FONTS.md — School CMS Demo

Curated font list for the typography tester in Studio.
Audience: students, the public, and aesthetically-minded staff (art, form, design, color).

---

## Font list (18 total)

All 18 are **self-hosted**. Geist loads via `next/font/local`; the other 17 are
served from `public/fonts/google/` and declared in `src/app/fonts-google.css`.

> **Privacy tradeoff — resolved.** These used to be fetched by the *visitor's*
> browser from `fonts.googleapis.com`/`fonts.gstatic.com`, which handed Google
> every visitor's IP address and user agent on every page load, and made Google
> a listed recipient in `/privacy`. The woff2 files are now committed and served
> from this origin, so a page load contacts no third party at all. The picker
> keeps working: declaring all 17 `@font-face` rules costs nothing, because a
> browser downloads a font file only when something actually uses that family.
>
> Refresh them with `node scripts/fetch-google-fonts.mjs` — it re-downloads the
> files and regenerates the stylesheet. Do **not** reintroduce a Google Fonts
> `<link>`; the CSP in `next.config.ts` no longer allows one, so it would fail
> silently rather than obviously.

### Current font (selectable)

| Font | Loading | Character | Best for |
|---|---|---|---|
| Geist | `next/font/local` | Modern sans-serif, technically clean — Vercel's own | Everything |

### Montserrat family (requested)

| Font | Google Fonts name | Notes |
|---|---|---|
| Montserrat | `Montserrat` | Geometric, clean, versatile — works for everything |
| Montserrat Alternates | `Montserrat+Alternates` | Distinctive alternate letterforms, more personality. **Static weights only** — see the note below. |
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

> **Montserrat Alternates has no variable weight axis.** Asking Google for a
> `100..900` range returns HTTP 400 for the *entire* request, not just that
> family. Before self-hosting, this had two live consequences: the combined
> preview URL on `/studio/style-templates` silently dropped the family (16 of 17
> loaded, and its preview rendered in a fallback face), and selecting it as the
> only typeface produced a single-family URL that 400'd — leaving the whole
> public site with no custom fonts. `scripts/fetch-google-fonts.mjs` now requests
> discrete weights for it and fails loudly on any family that errors.

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

- All `@font-face` rules live in `src/app/fonts-google.css`, imported by `globals.css`, so they are part of the one bundled stylesheet. The CSS variable determines which family displays; the browser fetches only the files that family needs. (Before self-hosting this said "all 18 always load" via a shared `<link>` — that was true of the stylesheet, never of the font files.)
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
