// Query fragment (after "family=") for each selectable Google Font, keyed by display name.
// "Geist" is excluded — it's a local font, not loaded from Google Fonts.
export const GOOGLE_FONT_QUERY: Record<string, string> = {
  "Montserrat": "Montserrat:ital,wght@0,100..900;1,100..900",
  "Montserrat Alternates": "Montserrat+Alternates:ital,wght@0,100..900;1,100..900",
  "Montserrat Underline": "Montserrat+Underline:ital,wght@0,100..900;1,100..900",
  "Playfair Display": "Playfair+Display:ital,wght@0,400..900;1,400..900",
  "Cormorant Garamond": "Cormorant+Garamond:ital,wght@0,300..700;1,300..700",
  "Josefin Sans": "Josefin+Sans:ital,wght@0,100..700;1,100..700",
  "Raleway": "Raleway:ital,wght@0,100..900;1,100..900",
  "Space Grotesk": "Space+Grotesk:wght@300..700",
  "Lora": "Lora:ital,wght@0,400..700;1,400..700",
  "Nunito": "Nunito:ital,wght@0,200..1000;1,200..1000",
  "Libre Baskerville": "Libre+Baskerville:ital,wght@0,400;0,700;1,400",
  "Germania One": "Germania+One",
  "Concert One": "Concert+One",
  "Merriweather": "Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900",
  "Courgette": "Courgette",
  "Parisienne": "Parisienne",
  "Lugrasimo": "Lugrasimo",
};

/** Builds a fonts.googleapis.com CSS URL for the given font names, deduped. Returns null if none apply (e.g. only "Geist"). */
export function buildGoogleFontsUrl(names: string[]): string | null {
  const families = [...new Set(names)]
    .map((name) => GOOGLE_FONT_QUERY[name])
    .filter((query): query is string => Boolean(query));

  if (families.length === 0) return null;

  return (
    "https://fonts.googleapis.com/css2?" +
    families.map((f) => `family=${f}`).join("&") +
    "&display=swap"
  );
}

export const ALL_GOOGLE_FONTS_URL = buildGoogleFontsUrl(Object.keys(GOOGLE_FONT_QUERY))!;
