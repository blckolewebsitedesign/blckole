"use client";

import type { Product, ProductMedia } from "lib/shopify/types";
import React, { useRef, useState } from "react";
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
