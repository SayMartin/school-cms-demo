// Hexvärdena speglar --color-brand-* i globals.css och måste hållas i synk —
// NavHubCard och BrandColorPicker sätter dem som inline-stilar, inte som
// Tailwind-klasser. Etiketterna visas för redaktörer i Studios färgväljare och
// namnger färgen som den faktiskt ser ut, inte tokenets historiska namn.
export const BRAND_COLORS = [
  { token: "brand-green-light", label: "Light Sky", hex: "#e3f1f9" },
  { token: "brand-green", label: "Sky", hex: "#a6cfe6" },
  { token: "brand-green-dark", label: "Deep Sky", hex: "#1f5a78" },
  { token: "brand-yellow-light", label: "Light Sunset", hex: "#fce7ce" },
  { token: "brand-yellow", label: "Sunset", hex: "#f6c68f" },
  { token: "brand-yellow-dark", label: "Dark Sunset", hex: "#8e4a16" },
  { token: "brand-pink-light", label: "Light Coral", hex: "#fce0da" },
  { token: "brand-pink", label: "Coral", hex: "#f5c2b8" },
  { token: "brand-pink-dark", label: "Dark Coral", hex: "#9c4436" },
  { token: "brand-blue-light", label: "Light Blue", hex: "#dceeff" },
  { token: "brand-blue", label: "Blue", hex: "#a0d4ff" },
  { token: "brand-blue-dark", label: "Dark Blue", hex: "#3a82c8" },
  { token: "brand-purple-light", label: "Light Purple", hex: "#e8e8ff" },
  { token: "brand-purple", label: "Purple", hex: "#cbcbff" },
  { token: "brand-purple-dark", label: "Dark Purple", hex: "#9898cc" },
  { token: "brand-parchment-light", label: "Light Parchment", hex: "#EDE5CE" },
  { token: "brand-parchment", label: "Parchment", hex: "#DCCDAA" },
  { token: "brand-parchment-dark", label: "Dark Parchment", hex: "#C4B080" },
] as const;

export type BrandColorToken = (typeof BRAND_COLORS)[number]["token"];

export function getColorHex(token: string): string {
  return BRAND_COLORS.find((c) => c.token === token)?.hex ?? "#cbcbff";
}
