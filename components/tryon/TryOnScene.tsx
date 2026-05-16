"use client";

import { ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { GarmentTransitionLayer } from "components/tryon/GarmentTransitionLayer";
import { getSkinToneColor } from "components/tryon/skin-tones";
import { type TryOnUiProduct } from "components/tryon/tryon-products";
import styles from "components/tryon/tryon.module.css";
import { applyBodyMask } from "lib/three/bodyMask";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTryOnStore } from "stores/useTryOnStore";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { AvatarGender, BodyMaskPart } from "types/tryon";

type Props = {
  avatar: AvatarGender;
  topwear: TryOnUiProduct | null;
  bottomwear: TryOnUiProduct | null;
  onWornProductClick: (product: TryOnUiProduct) => void;
  onTopwearReady?: (product: TryOnUiProduct) => void;
  onBottomwearReady?: (product: TryOnUiProduct) => void;
  onWebGLError?: (message: string) => void;
};

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

const LOCKED_POLAR_ANGLE = Math.acos(
  (1.08 - 0.48) / Math.hypot(1.08 - 0.48, 5.78),
);

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
      minPolarAngle={LOCKED_POLAR_ANGLE}
      maxPolarAngle={LOCKED_POLAR_ANGLE}
      autoRotate
      autoRotateSpeed={1.5}
    />
  );
}

function AvatarRoot({
  avatar,
  topwear,
  bottomwear,
  onWornProductClick,
  onTopwearReady,
  onBottomwearReady,
}: Props) {
  const gltf = useGLTF(avatarUrl(avatar));
  const selectedSkinTone = useTryOnStore((state) => state.selectedSkinTone);

  const avatarScene = useMemo(() => {
    const scene = cloneSkeleton(gltf.scene);
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
        -0.5 - bounds.min.y * scale,
        -center.z * scale,
      ] as [number, number, number],
    };
  }, [avatarScene]);

  // Two stable refs hold the products that are currently rendered (in any
  // phase) for each category. Per-frame we mask the avatar body to match
  // the union — this keeps the avatar visible no matter how fast the user
  // queues up swaps, because we never end up with a "hidden body part with
  // no garment covering it" state.
  const topwearLiveRef = useRef<TryOnUiProduct[]>([]);
  const bottomwearLiveRef = useRef<TryOnUiProduct[]>([]);
  const lastMaskSignatureRef = useRef<string | null>(null);

  const handleTopwearLiveChange = useCallback((products: TryOnUiProduct[]) => {
    topwearLiveRef.current = products;
    lastMaskSignatureRef.current = null;
  }, []);

  const handleBottomwearLiveChange = useCallback(
    (products: TryOnUiProduct[]) => {
      bottomwearLiveRef.current = products;
      lastMaskSignatureRef.current = null;
    },
    [],
  );

  useFrame(() => {
    const parts = new Set<BodyMaskPart>();
    for (const product of topwearLiveRef.current) {
      for (const part of product.bodyMask) parts.add(part);
    }
    for (const product of bottomwearLiveRef.current) {
      for (const part of product.bodyMask) parts.add(part);
    }

    const signature = Array.from(parts).sort().join(",");
    if (signature === lastMaskSignatureRef.current) return;
    lastMaskSignatureRef.current = signature;
    applyBodyMask(avatarScene, Array.from(parts));
  });

  useEffect(() => {
    tintAvatar(avatarScene, getSkinToneColor(selectedSkinTone));
  }, [avatarScene, selectedSkinTone]);

  return (
    <group
      position={fitTransform.position}
      rotation={[0, Math.PI, 0]}
      scale={fitTransform.scale}
    >
      <primitive object={avatarScene} dispose={null} />
      <GarmentTransitionLayer
        avatar={avatar}
        avatarScene={avatarScene}
        product={topwear}
        onWornProductClick={onWornProductClick}
        onReadyForCategory={onTopwearReady}
        onActiveProductsChange={handleTopwearLiveChange}
      />
      <GarmentTransitionLayer
        avatar={avatar}
        avatarScene={avatarScene}
        product={bottomwear}
        onWornProductClick={onWornProductClick}
        onReadyForCategory={onBottomwearReady}
        onActiveProductsChange={handleBottomwearLiveChange}
      />
    </group>
  );
}

function SceneContent(props: Props) {
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
      <AvatarRoot {...props} />
      <ContactShadows
        position={[0, -0.5, 0]}
        opacity={10}
        scale={8}
        blur={6}
        far={2.4}
        resolution={512}
        color="#000000"
      />
      <CameraRig />
    </>
  );
}

export function TryOnScene(props: Props) {
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    useGLTF.preload("/models/avatar/female-avatar.glb");
    useGLTF.preload("/models/avatar/male-avatar.glb");
  }, []);

  return (
    <div className={styles.sceneWrap}>
      {contextLost ? (
        <div className={styles.canvasContextLost} role="alert">
          <p>3D view paused — graphics context was lost.</p>
          <button
            type="button"
            className={styles.sceneErrorButton}
            onClick={() => {
              setContextLost(false);
              if (typeof window !== "undefined") window.location.reload();
            }}
          >
            Reload scene
          </button>
        </div>
      ) : null}
      <Canvas
        camera={{ position: [0, 1.08, 5.78], fov: 34 }}
        dpr={1}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            "webglcontextlost",
            (event) => {
              event.preventDefault();
              console.warn("[try-on] WebGL context lost");
              setContextLost(true);
              props.onWebGLError?.("WebGL context lost");
            },
            false,
          );
          gl.domElement.addEventListener(
            "webglcontextrestored",
            () => {
              console.info("[try-on] WebGL context restored");
              setContextLost(false);
            },
            false,
          );
        }}
      >
        <Suspense fallback={null}>
          <SceneContent {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
