export const BRAND_COLORS = [
  { token: "brand-green-light", label: "Light Green", hex: "#e3ffe3" },
  { token: "brand-green", label: "Green", hex: "#affdaf" },
  { token: "brand-green-dark", label: "Dark Green", hex: "#4aad4a" },
  { token: "brand-yellow-light", label: "Light Yellow", hex: "#ffff99" },
  { token: "brand-yellow", label: "Yellow", hex: "#ffff50" },
  { token: "brand-yellow-dark", label: "Dark Yellow", hex: "#c8c800" },
  { token: "brand-pink-light", label: "Light Pink", hex: "#fee8fe" },
  { token: "brand-pink", label: "Pink", hex: "#fdb9fc" },
  { token: "brand-pink-dark", label: "Dark Pink", hex: "#cc7acc" },
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
