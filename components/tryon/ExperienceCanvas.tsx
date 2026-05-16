"use client";

import { AvatarStage } from "components/tryon/AvatarStage";
import styles from "components/tryon/tryon.module.css";
import { getProductGlbUrlForAvatar } from "lib/tryon/getProductGlbUrl";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useTryOnStore } from "stores/useTryOnStore";
import type { TryOnProduct } from "types/tryon";

type Props = {
  products: TryOnProduct[];
};

type SceneErrorBoundaryProps = {
  resetKey: string;
  children: React.ReactNode;
};

class SceneErrorBoundary extends React.Component<
  SceneErrorBoundaryProps,
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(prevProps: SceneErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <Html center className={styles.canvasMessage}>
          Avatar asset unavailable
        </Html>
      );
    }

    return this.props.children;
  }
}

function CameraControls({
  rotate,
  resetSignal,
  zoomSignal,
}: {
  rotate: boolean;
  resetSignal: number;
  zoomSignal: number;
}) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    controlsRef.current?.reset();
    camera.position.set(0, 1.1, 4.6);
    camera.lookAt(0, 0.4, 0);
  }, [camera, resetSignal]);

  useEffect(() => {
    camera.position.set(0, 0.85, 3.1);
    camera.lookAt(0, 0.45, 0);
    controlsRef.current?.update();
  }, [camera, zoomSignal]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={2.6}
      maxDistance={6}
      target={[0, 0.45, 0]}
      autoRotate={rotate}
      autoRotateSpeed={1.2}
    />
  );
}

function TryOnScene({ rotate }: { rotate: boolean }) {
  const selectedAvatar = useTryOnStore((state) => state.selectedAvatar);
  const selectedTop = useTryOnStore((state) => state.selectedTop);
  const selectedBottom = useTryOnStore((state) => state.selectedBottom);
  const selectedShoes = useTryOnStore((state) => state.selectedShoes);
  const selectedAccessories = useTryOnStore(
    (state) => state.selectedAccessories,
  );

  return (
    <>
      <hemisphereLight args={["#ffffff", "#6f0711", 1.9]} />
      <ambientLight intensity={1.45} />
      <directionalLight position={[0, 4, 4]} intensity={3.9} />
      <directionalLight
        position={[-3, 2, 1.5]}
        intensity={1.5}
        color="#ffccd1"
      />
      <directionalLight position={[3, 2, -2]} intensity={1.6} color="#b81f30" />
      <spotLight
        position={[0, 4, 2.8]}
        angle={0.36}
        penumbra={0.8}
        intensity={6}
        color="#ffffff"
      />
      <SceneErrorBoundary resetKey={selectedAvatar}>
        <AvatarStage
          avatar={selectedAvatar}
          top={selectedTop}
          bottom={selectedBottom}
          shoes={selectedShoes}
          accessories={selectedAccessories}
          rotate={rotate}
        />
      </SceneErrorBoundary>
    </>
  );
}

export function ExperienceCanvas({ products }: Props) {
  const [rotate, setRotate] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [zoomSignal, setZoomSignal] = useState(0);
  const [webglError, setWebglError] = useState<string | null>(null);
  const selectedAvatar = useTryOnStore((state) => state.selectedAvatar);

  const preloadUrls = useMemo(() => {
    const categories = ["top", "bottom", "shoes", "accessory"] as const;
    return categories.flatMap((category) =>
      products
        .filter((product) => product.category === category)
        .slice(0, 3)
        .map((product) => getProductGlbUrlForAvatar(product, selectedAvatar))
        .filter((url): url is string => Boolean(url)),
    );
  }, [products, selectedAvatar]);

  useEffect(() => {
    useGLTF.preload("/models/avatar/male-avatar.glb");
    useGLTF.preload("/models/avatar/female-avatar.glb");
    preloadUrls.forEach((url) => useGLTF.preload(url));
  }, [preloadUrls]);

  return (
    <div className={styles.canvasWrap}>
      {webglError ? (
        <div className={styles.canvasFallback}>{webglError}</div>
      ) : (
        <Canvas
          camera={{ position: [0, 1.1, 4.6], fov: 35 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener(
              "webglcontextlost",
              (event) => {
                event.preventDefault();
                setWebglError("WebGL context lost. Reload the page.");
              },
              false,
            );
          }}
          onError={(error) => {
            console.error("[try-on] WebGL canvas error", error);
            setWebglError(
              "WebGL could not start. Enable hardware acceleration.",
            );
          }}
        >
          <color attach="background" args={["#020202"]} />
          <Suspense
            fallback={
              <Html center className={styles.canvasMessage}>
                Loading avatar
              </Html>
            }
          >
            <TryOnScene rotate={rotate} />
            <CameraControls
              rotate={rotate}
              resetSignal={resetSignal}
              zoomSignal={zoomSignal}
            />
          </Suspense>
        </Canvas>
      )}

      <div className={styles.stageControls} aria-label="3D view controls">
        <button
          type="button"
          className={styles.stageControl}
          onClick={() => setRotate((value) => !value)}
          aria-pressed={rotate}
        >
          View in 3D
        </button>
        <button
          type="button"
          className={styles.stageControl}
          onClick={() => setZoomSignal((value) => value + 1)}
        >
          Zoom
        </button>
        <button
          type="button"
          className={styles.stageControl}
          onClick={() => setResetSignal((value) => value + 1)}
        >
          Reset view
        </button>
      </div>
    </div>
  );
}
