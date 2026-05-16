"use client";

import { useGLTF } from "@react-three/drei";
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

type Props = {
  url: string;
  doubleSided?: boolean;
  onCloned?: (scene: THREE.Object3D) => void;
  children?: (scene: THREE.Object3D) => React.ReactNode;
};

/**
 * Safe rigged/skinned GLB renderer.
 *
 * - Uses `SkeletonUtils.clone` so multiple instances of the same cached GLTF
 *   never share a single skeleton (which would tear the avatar apart when
 *   the original gets bound elsewhere).
 * - Clones every material so opacity / color tweaks per instance can't bleed
 *   into other components that share the same cached resource.
 * - The caller renders with `<primitive object={scene} dispose={null} />` so
 *   unmounting one instance does not dispose geometry/textures owned by the
 *   shared GLTF cache.
 */
export function SafeGLBModel({ url, doubleSided, onCloned, children }: Props) {
  const gltf = useGLTF(url);
  const scene = useMemo(() => {
    const next = cloneSkeleton(gltf.scene);
    next.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.frustumCulled = false;
      object.material = Array.isArray(object.material)
        ? object.material.map((material) => material.clone())
        : object.material.clone();

      if (!doubleSided) return;
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      for (const material of materials) {
        material.side = THREE.DoubleSide;
        material.needsUpdate = true;
      }
    });
    return next;
  }, [doubleSided, gltf.scene]);

  useEffect(() => {
    onCloned?.(scene);
  }, [onCloned, scene]);

  if (children) return <>{children(scene)}</>;
  return <primitive object={scene} dispose={null} />;
}
