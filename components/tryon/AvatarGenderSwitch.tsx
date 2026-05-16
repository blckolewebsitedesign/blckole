"use client";

import styles from "components/tryon/tryon.module.css";
import type { AvatarGender } from "types/tryon";

type Props = {
  value: AvatarGender;
  onChange: (avatar: AvatarGender) => void;
};

const AVATARS: AvatarGender[] = ["female", "male"];

export function AvatarGenderSwitch({ value, onChange }: Props) {
  return (
    <div
      className={styles.genderSwitch}
      role="tablist"
      aria-label="Avatar gender"
    >
      {AVATARS.map((avatar) => (
        <button
          key={avatar}
          type="button"
          role="tab"
          aria-selected={value === avatar}
          className={styles.genderOption}
          data-active={value === avatar ? "true" : "false"}
          onClick={() => onChange(avatar)}
        >
          {avatar}
        </button>
      ))}
    </div>
  );
}
