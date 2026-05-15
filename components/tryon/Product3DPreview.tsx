"use client";

import styles from "components/tryon/tryon.module.css";
import { Center, Html, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import React, { Suspense, useMemo, useRef, useState } from "react";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";

type Props = {
  modelUrl: string;
  thumbnail: string;
  name: string;
  active?: boolean;
  type: "topwear" | "bottomwear";
};

type BoundaryProps = {
  resetKey: string;
  fallback: React.ReactNode;
  children: React.ReactNode;
};

class PreviewErrorBoundary extends React.Component<
  BoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: BoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function PreviewFallback({
  thumbnail,
  name,
  type,
}: Pick<Props, "thumbnail" | "name" | "type">) {
  const [showImage, setShowImage] = useState(Boolean(thumbnail));

  return (
    <div className={styles.previewFallback} data-type={type}>
      {showImage ? (
        <img
          src={thumbnail}
          alt=""
          aria-hidden="true"
          onError={() => setShowImage(false)}
        />
      ) : null}
      <span>{name}</span>
    </div>
  );
}

function PreviewModel({ modelUrl, type }: Pick<Props, "modelUrl" | "type">) {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF(modelUrl);
  const scene = useMemo(() => {
    const nextScene = clone(gltf.scene);
    nextScene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.frustumCulled = false;
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];

      for (const material of materials) {
        material.side = THREE.DoubleSide;
        material.needsUpdate = true;
      }
    });
    return nextScene;
  }, [gltf.scene]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.26;
  });

  return (
    <>
      <ambientLight intensity={2.15} />
      <directionalLight position={[1.8, 2.4, 2.4]} intensity={3.2} />
      <directionalLight position={[-2.1, 1.8, 1.6]} intensity={1.6} />
      <directionalLight
        position={[-2.4, 1.1, -2]}
        intensity={1.05}
        color="#d71928"
      />
      <pointLight position={[0, -0.8, 1.3]} intensity={0.95} color="#ffffff" />
      <pointLight position={[1.2, 0.4, -1.5]} intensity={0.6} color="#ff2638" />
      <Center>
        <group
          ref={groupRef}
          scale={type === "bottomwear" ? 1.56 : 1.34}
          rotation={[0.12, 0, 0]}
        >
          <primitive object={scene} />
        </group>
      </Center>
    </>
  );
}

export function Product3DPreview({
  modelUrl,
  thumbnail,
  name,
  active,
  type,
}: Props) {
  const fallback = (
    <PreviewFallback thumbnail={thumbnail} name={name} type={type} />
  );

  return (
    <PreviewErrorBoundary resetKey={modelUrl} fallback={fallback}>
      <div
        className={styles.productPreview}
        data-active={active ? "true" : "false"}
        data-type={type}
      >
        <Canvas
          camera={{ position: [0, 0.1, 2.52], fov: 34 }}
          dpr={1}
          gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
        >
          <Suspense
            fallback={
              <Html center className={styles.previewLoading}>
                Loading
              </Html>
            }
          >
            <PreviewModel modelUrl={modelUrl} type={type} />
          </Suspense>
        </Canvas>
      </div>
    </PreviewErrorBoundary>
  );
}
