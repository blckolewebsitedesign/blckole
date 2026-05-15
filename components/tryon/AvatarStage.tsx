"use client";

import { GarmentLayer } from "components/tryon/GarmentLayer";
import { applyBodyMask, getCombinedBodyMask } from "lib/three/bodyMask";
import { getProductGlbUrlForAvatar } from "lib/tryon/getProductGlbUrl";
import { useTryOnStore } from "stores/useTryOnStore";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { useEffect, useMemo, useRef } from "react";
import type { AvatarGender, TryOnProduct } from "types/tryon";
import * as THREE from "three";

type Props = {
  avatar: AvatarGender;
  top: TryOnProduct | null;
  bottom: TryOnProduct | null;
  shoes: TryOnProduct | null;
  accessories: TryOnProduct[];
  rotate: boolean;
};

function avatarUrl(avatar: AvatarGender) {
  return `/models/avatar/${avatar}-avatar.glb`;
}

export function AvatarStage({
  avatar,
  top,
  bottom,
  shoes,
  accessories,
  rotate,
}: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF(avatarUrl(avatar));
  const setProductError = useTryOnStore((state) => state.setProductError);
  const clearProductError = useTryOnStore((state) => state.clearProductError);

  const avatarScene = useMemo(() => {
    const scene = clone(gltf.scene);
    scene.traverse((object) => {
      if (object instanceof THREE.SkinnedMesh || object instanceof THREE.Mesh) {
        object.frustumCulled = false;
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];

        for (const material of materials) {
          material.side = THREE.DoubleSide;
          if (material.transparent && material.opacity === 0) {
            material.opacity = 1;
          }
          material.needsUpdate = true;
        }
      }
    });
    return scene;
  }, [gltf.scene]);

  const fitTransform = useMemo(() => {
    const bounds = new THREE.Box3().setFromObject(avatarScene);
    if (bounds.isEmpty()) {
      return { scale: 1, position: [0, -1.15, 0] as [number, number, number] };
    }

    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = size.y > 0 ? 2.6 / size.y : 1;

    return {
      scale,
      position: [
        -center.x * scale,
        -1.15 - bounds.min.y * scale,
        -center.z * scale,
      ] as [number, number, number],
    };
  }, [avatarScene]);

  const garments = useMemo(
    () =>
      [top, bottom, shoes, ...accessories].filter(Boolean) as TryOnProduct[],
    [accessories, bottom, shoes, top],
  );

  const bodyMask = useMemo(() => getCombinedBodyMask(garments), [garments]);

  useEffect(() => {
    applyBodyMask(avatarScene, bodyMask);
  }, [avatarScene, bodyMask]);

  useFrame((_, delta) => {
    if (!rotate || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.55;
  });

  return (
    <group
      ref={groupRef}
      position={fitTransform.position}
      rotation={[0, Math.PI, 0]}
      scale={fitTransform.scale}
    >
      <primitive object={avatarScene} />
      {garments.map((product) => {
        const glbUrl = getProductGlbUrlForAvatar(product, avatar);
        if (!glbUrl) return null;

        return (
          <GarmentLayer
            key={`${product.id}:${glbUrl}`}
            avatarScene={avatarScene}
            product={product}
            glbUrl={glbUrl}
            onError={setProductError}
            onLoaded={clearProductError}
          />
        );
      })}
    </group>
  );
}
