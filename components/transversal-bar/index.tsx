"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import styles from "./index.module.css";

type Item = {
  id: string;
  title: string;
  imageUrl: string;
  imageAlt?: string;
  videoUrl?: string;
  href?: string;
};

type Props = {
  items: Item[];
};

export function TransversalBar({ items }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const itemEl = track.children[index] as HTMLElement;
    if (itemEl) {
      itemEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
    setActiveIndex(index);
  }, []);

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.track}
        ref={trackRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          const idx = Math.round(el.scrollLeft / el.clientWidth);
          setActiveIndex(idx);
        }}
      >
        {items.map((item, i) => (
          <div key={item.id} className={styles.item}>
            {item.videoUrl ? (
              <video
                src={item.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className={styles.itemVideo}
              />
            ) : (
              <Image
                src={item.imageUrl}
                alt={item.imageAlt ?? item.title}
                fill
                sizes="100vw"
                className={styles.itemMedia}
                priority={i === 0}
              />
            )}
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className={styles.nav}>
          {items.map((item, i) => (
            <button
              key={item.id}
              className={`${styles.navItem}${i === activeIndex ? ` ${styles.navItemActive}` : ""}`}
              onClick={() => scrollTo(i)}
            >
              <Image
                src={item.imageUrl}
                alt=""
                width={24}
                height={24}
                className={styles.navThumb}
              />
              <span className={styles.navTitle}>{item.title}</span>
              <span className={styles.navIndex}>
                {(i + 1).toString().padStart(2, "0")}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
