import type { SkinToneId } from "types/tryon";

export const SKIN_TONES: { id: SkinToneId; label: string; color: string }[] = [
  { id: "porcelain", label: "Porcelain", color: "#f4d9ca" },
  { id: "fair", label: "Fair", color: "#e7bfa7" },
  { id: "sand", label: "Sand", color: "#c99272" },
  { id: "tan", label: "Tan", color: "#a87353" },
  { id: "umber", label: "Umber", color: "#795039" },
  { id: "deep", label: "Deep", color: "#50311f" },
];

export function getSkinToneColor(id: SkinToneId) {
  return (
    SKIN_TONES.find((tone) => tone.id === id)?.color ?? SKIN_TONES[1]!.color
  );
}
