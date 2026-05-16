"use client";

import { Center, PerspectiveCamera, View } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { SafeGLBModel } from "components/tryon/SafeGLBModel";
import styles from "components/tryon/tryon.module.css";
import React, { Suspense, useRef, useState } from "react";
import type { Group } from "three";

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

  componentDidCatch(error: Error) {
    console.error("[try-on] Preview failed to load", error);
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

function RotatingPreview({ modelUrl, type }: Pick<Props, "modelUrl" | "type">) {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.26;
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[1.8, 2.4, 2.4]} intensity={1.2} />
      <directionalLight position={[-2.1, 1.8, 1.6]} intensity={0.5} />
      <directionalLight position={[0, 2, -3]} intensity={0.8} />
      <pointLight position={[0, -0.8, 1.3]} intensity={0.3} color="#ffffff" />
      <Center>
        <group
          ref={groupRef}
          scale={type === "bottomwear" ? 1.2 : 1.34}
          rotation={[0.12, 0, 0]}
        >
          <SafeGLBModel url={modelUrl} doubleSided />
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

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <PreviewErrorBoundary resetKey={modelUrl} fallback={fallback}>
      <div
        className={styles.productPreview}
        data-active={active ? "true" : "false"}
        data-type={type}
      >
        <View className="absolute inset-0 h-full w-full">
          <PerspectiveCamera makeDefault position={[0, 0.1, 2.52]} fov={34} />
          <Suspense fallback={null}>
            <RotatingPreview modelUrl={modelUrl} type={type} />
          </Suspense>
        </View>
      </div>
    </PreviewErrorBoundary>
  );
}
