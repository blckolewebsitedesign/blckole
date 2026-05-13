"use client";

import styles from "components/tryon/tryon.module.css";
import { useTryOnStore } from "stores/useTryOnStore";
import type { AvatarGender } from "types/tryon";

const AVATARS: AvatarGender[] = ["female", "male"];

export function AvatarSelector() {
  const selectedAvatar = useTryOnStore((state) => state.selectedAvatar);
  const setAvatar = useTryOnStore((state) => state.setAvatar);

  return (
    <div className={styles.avatarSelector} role="tablist" aria-label="Model">
      {AVATARS.map((avatar) => (
        <button
          key={avatar}
          type="button"
          role="tab"
          aria-selected={selectedAvatar === avatar}
          className={`${styles.avatarOption} ${
            selectedAvatar === avatar ? styles.avatarOptionActive : ""
          }`}
          onClick={() => setAvatar(avatar)}
        >
          {avatar}
        </button>
      ))}
    </div>
  );
}
