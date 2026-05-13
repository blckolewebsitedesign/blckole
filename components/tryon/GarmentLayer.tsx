"use client";

import { bindGarmentToAvatar } from "lib/three/bindGarmentToAvatar";
import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { TryOnProduct } from "types/tryon";
import * as THREE from "three";

type Props = {
  avatarScene: THREE.Object3D;
  product: TryOnProduct;
  onError?: (productId: string, message: string) => void;
  onLoaded?: (productId: string) => void;
};

type ErrorBoundaryProps = {
  product: TryOnProduct;
  onError?: (productId: string, message: string) => void;
  children: React.ReactNode;
};

class GarmentErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(
      this.props.product.id,
      error.message || "Unable to load this 3D garment",
    );
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.product.id !== this.props.product.id && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function setSceneOpacity(scene: THREE.Object3D, opacity: number) {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    for (const material of materials) {
      material.transparent = opacity < 1;
      material.opacity = opacity;
      material.needsUpdate = true;
    }
  });
}

function cloneMaterials(scene: THREE.Object3D) {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.material = Array.isArray(object.material)
      ? object.material.map((material) => material.clone())
      : object.material.clone();
  });
}

function InnerGarmentLayer({ avatarScene, product, onLoaded }: Props) {
  const gltf = useGLTF(product.glbUrl);
  const opacityRef = useRef(0);

  const scene = useMemo(() => {
    const garmentScene = clone(gltf.scene);
    cloneMaterials(garmentScene);

    // Garments should be exported against the same rig as the avatar. If they
    // are not, keep them visible as a static fallback so one bad asset never
    // breaks the entire try-on experience.
    bindGarmentToAvatar(garmentScene, avatarScene);
    setSceneOpacity(garmentScene, 0);
    return garmentScene;
  }, [avatarScene, gltf.scene]);

  useEffect(() => {
    onLoaded?.(product.id);
  }, [onLoaded, product.id]);

  useFrame((_, delta) => {
    if (opacityRef.current >= 1) return;
    opacityRef.current = Math.min(1, opacityRef.current + delta * 3.2);
    setSceneOpacity(scene, opacityRef.current);
  });

  return <primitive object={scene} />;
}

export function GarmentLayer(props: Props) {
  return (
    <GarmentErrorBoundary product={props.product} onError={props.onError}>
      <InnerGarmentLayer {...props} />
    </GarmentErrorBoundary>
  );
}
