"use client";

import { getSkinToneColor } from "components/tryon/skin-tones";
import {
  resolveWearableModelUrl,
  type TryOnUiProduct,
} from "components/tryon/tryon-products";
import styles from "components/tryon/tryon.module.css";
import { bindGarmentToAvatar } from "lib/three/bindGarmentToAvatar";
import { applyBodyMask } from "lib/three/bodyMask";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import React, { Suspense, useEffect, useMemo, useRef } from "react";
import { useTryOnStore } from "stores/useTryOnStore";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { AvatarGender } from "types/tryon";
import * as THREE from "three";

type Props = {
  avatar: AvatarGender;
  topwear: TryOnUiProduct | null;
  bottomwear: TryOnUiProduct | null;
  onWornProductClick: (product: TryOnUiProduct) => void;
};

type BoundaryProps = {
  resetKey: string;
  children: React.ReactNode;
};

class SceneErrorBoundary extends React.Component<
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
    if (this.state.hasError) {
      return (
        <Html center className={styles.canvasMessage}>
          Avatar unavailable
        </Html>
      );
    }

    return this.props.children;
  }
}

function avatarUrl(avatar: AvatarGender) {
  return `/models/avatar/${avatar}-avatar.glb`;
}

function cloneSceneMaterials(scene: THREE.Object3D) {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.frustumCulled = false;
    object.material = Array.isArray(object.material)
      ? object.material.map((material) => material.clone())
      : object.material.clone();
  });
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

function tintAvatar(scene: THREE.Object3D, tone: string) {
  const toneColor = new THREE.Color(tone);

  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    for (const material of materials) {
      material.side = THREE.DoubleSide;
      if ("color" in material && material.color instanceof THREE.Color) {
        material.color.copy(toneColor);
      }
      if ("emissive" in material && material.emissive instanceof THREE.Color) {
        material.emissive.copy(toneColor).multiplyScalar(0.34);
      }
      material.needsUpdate = true;
    }
  });
}

function CameraRig() {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 1.08, 5.78);
    camera.lookAt(0, 0.48, 0);
    controlsRef.current?.update();
  }, [camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={false}
      enableDamping
      dampingFactor={0.08}
      target={[0, 0.48, 0]}
    />
  );
}

class WearableErrorBoundary extends React.Component<
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
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function WornProductLayer({
  avatar,
  avatarScene,
  product,
  onProductClick,
}: {
  avatar: AvatarGender;
  avatarScene: THREE.Object3D;
  product: TryOnUiProduct;
  onProductClick: (product: TryOnUiProduct) => void;
}) {
  const glbUrl = resolveWearableModelUrl(product, avatar);
  const gltf = useGLTF(glbUrl);
  const opacityRef = useRef(0);
  const scene = useMemo(() => {
    const garmentScene = clone(gltf.scene);
    cloneSceneMaterials(garmentScene);
    bindGarmentToAvatar(garmentScene, avatarScene);
    setSceneOpacity(garmentScene, 0);
    return garmentScene;
  }, [avatarScene, gltf.scene]);

  useFrame((_, delta) => {
    if (opacityRef.current >= 1) return;
    opacityRef.current = Math.min(1, opacityRef.current + delta * 3.2);
    setSceneOpacity(scene, opacityRef.current);
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onProductClick(product);
  };

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    document.body.style.cursor = "";
  };

  return (
    <primitive
      object={scene}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    />
  );
}

function AvatarModel({
  avatar,
  products,
  onWornProductClick,
}: {
  avatar: AvatarGender;
  products: TryOnUiProduct[];
  onWornProductClick: (product: TryOnUiProduct) => void;
}) {
  const gltf = useGLTF(avatarUrl(avatar));
  const selectedSkinTone = useTryOnStore((state) => state.selectedSkinTone);
  const avatarScene = useMemo(() => {
    const scene = clone(gltf.scene);
    cloneSceneMaterials(scene);
    return scene;
  }, [gltf.scene]);

  const fitTransform = useMemo(() => {
    const bounds = new THREE.Box3().setFromObject(avatarScene);
    if (bounds.isEmpty()) {
      return { scale: 1, position: [0, -1.15, 0] as [number, number, number] };
    }

    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = size.y > 0 ? 1.82 / size.y : 1;

    return {
      scale,
      position: [
        -center.x * scale,
        -1.02 - bounds.min.y * scale,
        -center.z * scale,
      ] as [number, number, number],
    };
  }, [avatarScene]);

  useEffect(() => {
    applyBodyMask(
      avatarScene,
      Array.from(new Set(products.flatMap((product) => product.bodyMask))),
    );
  }, [avatarScene, products]);

  useEffect(() => {
    tintAvatar(avatarScene, getSkinToneColor(selectedSkinTone));
  }, [avatarScene, selectedSkinTone]);

  return (
    <group
      position={fitTransform.position}
      rotation={[0, Math.PI, 0]}
      scale={fitTransform.scale}
    >
      <primitive object={avatarScene} />
      {products.map((product) => {
        const glbUrl = resolveWearableModelUrl(product, avatar);

        return (
          <WearableErrorBoundary
            key={`${product.id}:${glbUrl}`}
            resetKey={glbUrl}
          >
            <Suspense fallback={null}>
              <WornProductLayer
                avatar={avatar}
                avatarScene={avatarScene}
                product={product}
                onProductClick={onWornProductClick}
              />
            </Suspense>
          </WearableErrorBoundary>
        );
      })}
    </group>
  );
}

function SceneContent({
  avatar,
  topwear,
  bottomwear,
  onWornProductClick,
}: Props) {
  const wornProducts = useMemo(
    () => [topwear, bottomwear].filter(Boolean) as TryOnUiProduct[],
    [bottomwear, topwear],
  );

  return (
    <>
      <hemisphereLight args={["#ffffff", "#65070f", 1.8]} />
      <ambientLight intensity={1.24} />
      <directionalLight position={[0, 4, 4]} intensity={4.3} />
      <directionalLight
        position={[-3, 2, 1.8]}
        intensity={1.2}
        color="#ffccd1"
      />
      <directionalLight
        position={[3, 1.8, -2]}
        intensity={1.8}
        color="#d71928"
      />
      <spotLight
        position={[0, 4.2, 2.8]}
        angle={0.34}
        penumbra={0.86}
        intensity={6.2}
        color="#ffffff"
      />
      <SceneErrorBoundary resetKey={avatar}>
        <AvatarModel
          avatar={avatar}
          products={wornProducts}
          onWornProductClick={onWornProductClick}
        />
      </SceneErrorBoundary>
      <CameraRig />
    </>
  );
}

export function TryOnScene({
  avatar,
  topwear,
  bottomwear,
  onWornProductClick,
}: Props) {
  useEffect(() => {
    useGLTF.preload("/models/avatar/female-avatar.glb");
    useGLTF.preload("/models/avatar/male-avatar.glb");
  }, []);

  return (
    <div className={styles.sceneWrap}>
      <Canvas
        camera={{ position: [0, 1.08, 5.78], fov: 34 }}
        dpr={1}
        gl={{ antialias: false, alpha: true }}
      >
        <Suspense
          fallback={
            <Html center className={styles.canvasMessage}>
              Loading avatar
            </Html>
          }
        >
          <SceneContent
            avatar={avatar}
            topwear={topwear}
            bottomwear={bottomwear}
            onWornProductClick={onWornProductClick}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
