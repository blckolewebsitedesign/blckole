import * as THREE from "three";

export function findAvatarBones(avatarScene: THREE.Object3D) {
  const bones = new Map<string, THREE.Bone>();

  avatarScene.traverse((object) => {
    if (object instanceof THREE.Bone) {
      bones.set(object.name, object);
    }
  });

  return bones;
}
