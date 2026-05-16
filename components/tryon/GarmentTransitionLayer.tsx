"use client";

import {
  resolveWearableModelUrl,
  type TryOnUiProduct,
} from "components/tryon/tryon-products";
import { useGLTF } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { bindGarmentToAvatar } from "lib/three/bindGarmentToAvatar";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { AvatarGender } from "types/tryon";

type SlotPhase = "incoming" | "stable" | "outgoing";

type Slot = {
  key: string;
  product: TryOnUiProduct;
  phase: SlotPhase;
};

type Props = {
  avatar: AvatarGender;
  avatarScene: THREE.Object3D | null;
  product: TryOnUiProduct | null;
  onWornProductClick: (product: TryOnUiProduct) => void;
  onReadyForCategory?: (product: TryOnUiProduct) => void;
  onActiveProductsChange?: (products: TryOnUiProduct[]) => void;
};

const FADE_IN_DURATION_MS = 360;
const FADE_OUT_DURATION_MS = 260;

function makeSlotKey(product: TryOnUiProduct, avatar: AvatarGender) {
  return `${product.id}:${resolveWearableModelUrl(product, avatar)}`;
}

function setSceneOpacity(scene: THREE.Object3D, opacity: number) {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    for (const material of materials) {
      material.transparent = opacity < 0.999;
      material.opacity = opacity;
      // Disable depthWrite while semi-transparent so the garment doesn't
      // punch a hole into the avatar; re-enable once fully opaque.
      material.depthWrite = opacity >= 0.95;
      material.needsUpdate = true;
    }
  });
}

class GarmentErrorBoundary extends React.Component<
  { product: TryOnUiProduct; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(
      "[try-on] Garment failed to load",
      this.props.product.id,
      this.props.product.modelUrl,
      error,
    );
  }

  componentDidUpdate(prevProps: { product: TryOnUiProduct }) {
    if (prevProps.product.id !== this.props.product.id && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function SingleGarmentSlot({
  slot,
  avatar,
  avatarScene,
  onPhaseSettled,
  onProductClick,
}: {
  slot: Slot;
  avatar: AvatarGender;
  avatarScene: THREE.Object3D;
  onPhaseSettled: (slotKey: string, phase: SlotPhase) => void;
  onProductClick: (product: TryOnUiProduct) => void;
}) {
  const url = resolveWearableModelUrl(slot.product, avatar);
  const gltf = useGLTF(url);

  const garmentScene = useMemo(() => {
    const cloned = cloneSkeleton(gltf.scene);
    cloned.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.frustumCulled = false;
      object.material = Array.isArray(object.material)
        ? object.material.map((material) => material.clone())
        : object.material.clone();
    });
    bindGarmentToAvatar(cloned, avatarScene);
    setSceneOpacity(cloned, 0);
    return cloned;
  }, [avatarScene, gltf.scene]);

  // Each slot owns its own opacity track so fades can overlap (cross-fade).
  const opacityRef = useRef(0);
  // Stash the latest phase target so the useFrame loop can react without
  // re-subscribing.
  const phaseRef = useRef<SlotPhase>(slot.phase);
  phaseRef.current = slot.phase;
  const settledRef = useRef<Record<SlotPhase, boolean>>({
    incoming: false,
    stable: false,
    outgoing: false,
  });

  useFrame((_, delta) => {
    const phase = phaseRef.current;

    if (phase === "incoming") {
      const inSpeed = 1 / (FADE_IN_DURATION_MS / 1000);
      opacityRef.current = Math.min(1, opacityRef.current + delta * inSpeed);
      setSceneOpacity(garmentScene, opacityRef.current);
      if (!settledRef.current.incoming && opacityRef.current >= 0.92) {
        settledRef.current.incoming = true;
        onPhaseSettled(slot.key, "incoming");
      }
    } else if (phase === "outgoing") {
      const outSpeed = 1 / (FADE_OUT_DURATION_MS / 1000);
      opacityRef.current = Math.max(0, opacityRef.current - delta * outSpeed);
      setSceneOpacity(garmentScene, opacityRef.current);
      if (!settledRef.current.outgoing && opacityRef.current <= 0.01) {
        settledRef.current.outgoing = true;
        onPhaseSettled(slot.key, "outgoing");
      }
    }
  });

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      onProductClick(slot.product);
    },
    [onProductClick, slot.product],
  );

  const handlePointerOver = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (typeof document !== "undefined") {
      document.body.style.cursor = "pointer";
    }
  }, []);

  const handlePointerOut = useCallback(() => {
    if (typeof document !== "undefined") {
      document.body.style.cursor = "";
    }
  }, []);

  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.cursor = "";
      }
    };
  }, []);

  return (
    <primitive
      object={garmentScene}
      dispose={null}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    />
  );
}

export function GarmentTransitionLayer({
  avatar,
  avatarScene,
  product,
  onWornProductClick,
  onReadyForCategory,
  onActiveProductsChange,
}: Props) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const slotsRef = useRef<Slot[]>(slots);
  slotsRef.current = slots;

  // Sync the slot list with the selected product. We never tear down a slot
  // synchronously — instead we mark older slots as "outgoing" so the next
  // garment can fade in while the previous garment fades out, killing the
  // single-frame "no clothes, no body part" flash that caused the avatar
  // to look like it disappeared.
  useEffect(() => {
    setSlots((prev) => {
      if (!product) {
        if (prev.length === 0) return prev;
        const next = prev.map((slot) =>
          slot.phase === "outgoing"
            ? slot
            : { ...slot, phase: "outgoing" as const },
        );
        return next;
      }

      const key = makeSlotKey(product, avatar);
      const existingIndex = prev.findIndex((slot) => slot.key === key);

      if (existingIndex >= 0 && prev[existingIndex]!.phase !== "outgoing") {
        // Already showing this product — make sure older slots are leaving.
        return prev.map((slot, index) =>
          index === existingIndex
            ? slot
            : slot.phase === "outgoing"
              ? slot
              : { ...slot, phase: "outgoing" as const },
        );
      }

      const next: Slot[] = prev.map((slot) =>
        slot.phase === "outgoing"
          ? slot
          : { ...slot, phase: "outgoing" as const },
      );
      next.push({ key, product, phase: "incoming" });
      return next;
    });
  }, [avatar, product]);

  // Publish the active product list (anything that is still visible in any
  // form). The avatar uses this to keep its body mask in lockstep with the
  // garments that are actually rendered, even mid-cross-fade.
  useEffect(() => {
    onActiveProductsChange?.(slots.map((slot) => slot.product));
  }, [onActiveProductsChange, slots]);

  const handlePhaseSettled = useCallback(
    (slotKey: string, phase: SlotPhase) => {
      if (phase === "incoming") {
        const slot = slotsRef.current.find((s) => s.key === slotKey);
        if (slot) onReadyForCategory?.(slot.product);

        setSlots((prev) =>
          prev.map((s) =>
            s.key === slotKey && s.phase === "incoming"
              ? { ...s, phase: "stable" }
              : s,
          ),
        );
      } else if (phase === "outgoing") {
        setSlots((prev) => prev.filter((s) => s.key !== slotKey));
      }
    },
    [onReadyForCategory],
  );

  if (!avatarScene) return null;

  return (
    <>
      {slots.map((slot) => (
        <GarmentErrorBoundary key={slot.key} product={slot.product}>
          <Suspense fallback={null}>
            <SingleGarmentSlot
              slot={slot}
              avatar={avatar}
              avatarScene={avatarScene}
              onPhaseSettled={handlePhaseSettled}
              onProductClick={onWornProductClick}
            />
          </Suspense>
        </GarmentErrorBoundary>
      ))}
    </>
  );
}
