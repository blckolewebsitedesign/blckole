import type { BodyMaskPart, TryOnProduct } from "types/tryon";
import * as THREE from "three";

const BODY_SECTION_NAMES: Record<BodyMaskPart, string[]> = {
  torso: ["Body_Torso"],
  arms: ["Body_Arms"],
  legs: ["Body_Legs"],
  feet: ["Body_Feet"],
};

export function getCombinedBodyMask(
  products: Array<TryOnProduct | null | undefined>,
): BodyMaskPart[] {
  return Array.from(
    new Set(products.flatMap((product) => product?.bodyMask ?? [])),
  );
}

export function applyBodyMask(
  avatarScene: THREE.Object3D,
  bodyMask: BodyMaskPart[],
) {
  const hiddenNames = new Set(
    bodyMask.flatMap((part) => BODY_SECTION_NAMES[part] ?? []),
  );
  const knownNames = new Set(Object.values(BODY_SECTION_NAMES).flat());

  avatarScene.traverse((object) => {
    if (!knownNames.has(object.name)) return;
    object.visible = !hiddenNames.has(object.name);
  });
}
