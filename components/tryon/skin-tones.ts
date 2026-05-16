import type { SkinToneId } from "types/tryon";

export const SKIN_TONES: { id: SkinToneId; label: string; color: string }[] = [
  { id: "porcelain", label: "Porcelain", color: "#f7dfd2" },
  { id: "ivory", label: "Ivory", color: "#f1d0c0" },
  { id: "fair", label: "Fair", color: "#edc7b3" },
  { id: "peach", label: "Peach", color: "#e4b69d" },
  { id: "sand", label: "Sand", color: "#d9a07d" },
  { id: "warmSand", label: "Warm Sand", color: "#c99272" },
];

export function getSkinToneColor(id: SkinToneId) {
  return (
    SKIN_TONES.find((tone) => tone.id === id)?.color ?? SKIN_TONES[1]!.color
  );
}
