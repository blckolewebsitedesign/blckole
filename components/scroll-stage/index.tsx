"use client";

import type { Product, ProductMedia } from "lib/shopify/types";
import React, { useEffect, useRef, useState } from "react";
import styles from "./index.module.css";

type VideoMedia = Extract<ProductMedia, { mediaContentType: "VIDEO" }>;

type Props = {
  products: Product[];
  recommendationsMap?: Record<string, Product[]>;
  currentIndex: number;
  detailOpen: boolean;
  recsOpen: boolean;
  paused?: boolean;
  onSelect: (
    index: number,
    opts?: { open?: boolean; userInitiated?: boolean },
  ) => void;
  onClose: () => void;
  onToggleRecs: () => void;
};

const SWIPE_MIN_DISTANCE = 50;
const SWIPE_MAX_DURATION = 600;

type LayerEntry = { product: Product; dir: 0 | -1 | 1 };

const SCROLL_SEQUENCE_FRAME_COUNT = 224;
const SCROLL_SEQUENCE_PATH = "/scroll-sequence";

function getScrollSequenceFrameSrc(frameNumber: number) {
  const paddedFrame = String(frameNumber).padStart(3, "0");
  return `${SCROLL_SEQUENCE_PATH}/ezgif-frame-${paddedFrame}.png`;
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = width / height;
  const drawHeight = imageRatio > canvasRatio ? height : width / imageRatio;
  const drawWidth = imageRatio > canvasRatio ? height * imageRatio : width;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;

  context.clearRect(0, 0, width, height);
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function ScrollSequenceCanvas({
  active,
  scrollRootRef,
}: {
  active: boolean;
  scrollRootRef: React.RefObject<HTMLElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    Array.from({ length: SCROLL_SEQUENCE_FRAME_COUNT }, () => null),
  );
  const currentFrameRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!active || failed) return;

    let cancelled = false;

    const loadFrame = (index: number) => {
      if (imagesRef.current[index]) return imagesRef.current[index];

      const image = new Image();
      image.decoding = "async";
      image.addEventListener(
        "load",
        () => {
          window.dispatchEvent(new Event("scroll-sequence-frame-load"));
        },
        { once: true },
      );
      image.src = getScrollSequenceFrameSrc(index + 1);
      imagesRef.current[index] = image;
      return image;
    };

    const firstImage = loadFrame(0);
    if (!firstImage) return;

    const handleFirstFrame = () => {
      if (cancelled) return;
      setReady(true);

      const preloadRest = () => {
        for (let i = 1; i < SCROLL_SEQUENCE_FRAME_COUNT; i += 1) {
          loadFrame(i);
        }
      };

      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(preloadRest, { timeout: 1400 });
      } else {
        globalThis.setTimeout(preloadRest, 250);
      }
    };

    const handleFirstFrameError = () => {
      if (!cancelled) setFailed(true);
    };

    if (firstImage.complete && firstImage.naturalWidth > 0) {
      handleFirstFrame();
    } else {
      firstImage.addEventListener("load", handleFirstFrame, { once: true });
      firstImage.addEventListener("error", handleFirstFrameError, {
        once: true,
      });
    }

    return () => {
      cancelled = true;
      firstImage.removeEventListener("load", handleFirstFrame);
      firstImage.removeEventListener("error", handleFirstFrameError);
    };
  }, [active, failed]);

  useEffect(() => {
    if (!active || !ready) return;

    const canvas = canvasRef.current;
    const scrollRoot = scrollRootRef.current?.parentElement;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !scrollRoot || !context) return;

    const getNearestLoadedFrame = (targetFrame: number) => {
      for (let offset = 0; offset < SCROLL_SEQUENCE_FRAME_COUNT; offset += 1) {
        const prev = targetFrame - offset;
        const next = targetFrame + offset;
        const prevImage = prev >= 0 ? imagesRef.current[prev] : null;
        const nextImage =
          next < SCROLL_SEQUENCE_FRAME_COUNT ? imagesRef.current[next] : null;

        if (prevImage?.complete && prevImage.naturalWidth > 0) return prevImage;
        if (nextImage?.complete && nextImage.naturalWidth > 0) return nextImage;
      }

      return null;
    };

    const render = () => {
      rafRef.current = null;

      const rootRect = scrollRoot.getBoundingClientRect();
      const scrollDistance = Math.max(
        1,
        scrollRoot.offsetHeight - window.innerHeight,
      );
      const progress = Math.min(1, Math.max(0, -rootRect.top / scrollDistance));
      const frameIndex = Math.min(
        SCROLL_SEQUENCE_FRAME_COUNT - 1,
        Math.round(progress * (SCROLL_SEQUENCE_FRAME_COUNT - 1)),
      );
      scrollRootRef.current?.style.setProperty(
        "--sequence-progress",
        progress.toFixed(4),
      );

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(canvas.clientWidth * pixelRatio));
      const height = Math.max(1, Math.round(canvas.clientHeight * pixelRatio));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        currentFrameRef.current = -1;
      }

      const image = getNearestLoadedFrame(frameIndex);
      if (!image) return;

      if (currentFrameRef.current !== frameIndex) {
        currentFrameRef.current = frameIndex;
        drawCoverImage(context, image, width, height);
      }
    };

    const requestRender = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(render);
    };

    requestRender();
    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", requestRender);
    window.addEventListener("scroll-sequence-frame-load", requestRender);

    return () => {
      window.removeEventListener("scroll", requestRender);
      window.removeEventListener("resize", requestRender);
      window.removeEventListener("scroll-sequence-frame-load", requestRender);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [active, ready, scrollRootRef]);

  if (failed) return null;

  return (
    <canvas
      ref={canvasRef}
      className={styles.sequenceCanvas}
      aria-hidden="true"
      data-ready={ready ? "true" : "false"}
    />
  );
}

function HeroLeftContent() {
  return (
    <section className={styles.textContent} aria-labelledby="hero-title">
      <p className={styles.heroEyebrow}>You are being pulled in.</p>
      <h1 id="hero-title" className={styles.heroHeadline}>
        <span>You always</span>
        <span>find your</span>
        <span>way back.</span>
      </h1>
      <p className={styles.heroBody}>
        <span>The void has chosen.</span>
        <span>Two remain.</span>
        <span>This is the final pull.</span>
      </p>
      {/* <a href="/story" className={styles.trailerLink}>
        <span className={styles.trailerIcon} aria-hidden="true" />
        Watch trailer
      </a> */}
    </section>
  );
}

function HeroRightActions({}: { onSelectAvatar: () => void }) {
  return (
    <div className={styles.actionStack} data-no-swipe>
      <a href="/indexes/products" className={styles.secondaryAction}>
        <span>Shop now</span>
      </a>
      <a href="/try-on" className={styles.secondaryAction}>
        Select avatar
      </a>
      <a href="/indexes/products" className={styles.secondaryAction}>
        Explore catalog
      </a>
    </div>
  );
}

function HeroBottomBar({
  soundOn,
  onToggleSound,
}: {
  soundOn: boolean;
  onToggleSound: () => void;
}) {
  return (
    <div className={styles.landingFooter} data-no-swipe>
      <button
        type="button"
        className={styles.soundStatus}
        aria-pressed={soundOn}
        onClick={onToggleSound}
      >
        {/* <span>Sound: {soundOn ? "on" : "off"}</span>
        <span className={styles.soundBars}>
          <span />
          <span />
          <span />
          <span />
        </span> */}
      </button>

      <div className={styles.scrollCue} aria-hidden="true">
        <span className={styles.mouseCue}>
          <span />
        </span>
        <span>Scroll to enter</span>
      </div>
    </div>
  );
}

// function DetailCharacter({
//   layers,
//   paused,
//   onModelClick,
// }: {
//   layers: LayerEntry[];
//   paused: boolean;
//   onModelClick: () => void;
// }) {
//   return (
//     <div className={styles.mainCharacterWrapper}>
//       <div className={styles.floorGlow} aria-hidden="true" />
//       <div className={styles.mainCharacter}>
//         {layers.map((entry, i, arr) => {
//           const isLatest = i === arr.length - 1;
//           const cls = isLatest
//             ? entry.dir === -1
//               ? styles.charLayerInLeft
//               : entry.dir === 1
//                 ? styles.charLayerInRight
//                 : styles.charLayerInitial
//             : entry.dir === -1
//               ? styles.charLayerOutRight
//               : styles.charLayerOutLeft;
//           return (
//             <div
//               key={entry.product.id}
//               className={`${styles.charLayer} ${cls}`}
//             >
//               <RotatingFigure
//                 product={entry.product}
//                 listenToGlobalFrame={isLatest}
//                 priority={true}
//                 paused={paused}
//                 onClick={isLatest ? onModelClick : undefined}
//               />
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

export const ScrollStage = React.memo(function ScrollStage({
  products,
  recommendationsMap,
  currentIndex,
  detailOpen,
  recsOpen,
  paused = false,
  onSelect,
  onClose,
  onToggleRecs,
}: Props) {
  // Swipe navigation (pointer-based, both modes).
  const stageRef = useRef<HTMLElement>(null);

  const [soundOn, setSoundOn] = useState(true);

  return (
    <section
      ref={stageRef}
      className={styles.stage}
      aria-label="BLCKOLE entry campaign"
      data-detail-open={detailOpen ? "true" : "false"}
      data-recs-open={recsOpen ? "true" : "false"}
    >
      <ScrollSequenceCanvas active={!detailOpen} scrollRootRef={stageRef} />

      <div className={styles.leftPanel}>
        <HeroLeftContent />
      </div>

      <div className={styles.rightPanel}>
        {!detailOpen && (
          <HeroRightActions
            onSelectAvatar={() => {
              onSelect(currentIndex, { open: true, userInitiated: true });
            }}
          />
        )}
      </div>

      <HeroBottomBar
        soundOn={soundOn}
        onToggleSound={() => setSoundOn((v) => !v)}
      />
    </section>
  );
});
