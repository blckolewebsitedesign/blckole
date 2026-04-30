"use client";

import { useInView } from "framer-motion";
import { useEffect, useRef } from "react";
import styles from "./index.module.css";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function scramble(
  el: HTMLElement,
  original: string,
  duration: number = 0.6,
): () => void {
  let frame = 0;
  const totalFrames = Math.floor(duration * 60);
  let raf: number;

  function tick() {
    const progress = frame / totalFrames;
    el.textContent = original
      .split("")
      .map((char, i) => {
        if (char === " ") return " ";
        if (i / original.length < progress) return original[i];
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      })
      .join("");

    frame++;
    if (frame <= totalFrames) {
      raf = requestAnimationFrame(tick);
    } else {
      el.textContent = original;
    }
  }

  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

type Props = {
  text: string;
  className?: string;
  triggerOnHover?: boolean;
};

export function TextShuffle({ text, className, triggerOnHover }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (inView && ref.current) {
      cleanupRef.current?.();
      cleanupRef.current = scramble(ref.current, text);
    }
  }, [inView, text]);

  function handleHover() {
    if (!triggerOnHover || !ref.current) return;
    cleanupRef.current?.();
    cleanupRef.current = scramble(ref.current, text, 0.4);
  }
  return (
    <span
      className={`${styles.wrapper}${className ? ` ${className}` : ""}`}
      onMouseEnter={handleHover}
    >
      <span ref={ref} className={styles.inner}>
        {text}
      </span>
    </span>
  );
}
