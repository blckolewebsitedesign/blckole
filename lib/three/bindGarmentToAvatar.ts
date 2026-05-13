import { findAvatarBones } from "lib/three/findAvatarBones";
import * as THREE from "three";

type BindResult = {
  boundMeshes: number;
  skippedMeshes: number;
};

function getSkinnedMeshes(scene: THREE.Object3D) {
  const meshes: THREE.SkinnedMesh[] = [];

  scene.traverse((object) => {
    if (object instanceof THREE.SkinnedMesh) {
      meshes.push(object);
    }
  });

  return meshes;
}

export function bindGarmentToAvatar(
  garmentScene: THREE.Object3D,
  avatarScene: THREE.Object3D,
): BindResult {
  const avatarBones = findAvatarBones(avatarScene);
  const garmentMeshes = getSkinnedMeshes(garmentScene);
  const result: BindResult = { boundMeshes: 0, skippedMeshes: 0 };

  if (garmentMeshes.length === 0) {
    console.warn(
      "[try-on] Garment has no SkinnedMesh. Rendering as a static fallback; realistic top/bottom try-on requires garments rigged to the avatar skeleton.",
    );
    return result;
  }

  for (const mesh of garmentMeshes) {
    const garmentBones = mesh.skeleton.bones;
    const matchedBones = garmentBones.map((bone) => avatarBones.get(bone.name));

    if (matchedBones.some((bone) => !bone)) {
      result.skippedMeshes += 1;
      console.warn(
        `[try-on] Could not bind garment mesh "${mesh.name}" because one or more bones are missing on the avatar.`,
      );
      mesh.frustumCulled = false;
      continue;
    }

    const skeleton = new THREE.Skeleton(
      matchedBones as THREE.Bone[],
      mesh.skeleton.boneInverses,
    );

    mesh.bind(skeleton, mesh.bindMatrix);
    mesh.frustumCulled = false;
    result.boundMeshes += 1;
  }

  return result;
}
