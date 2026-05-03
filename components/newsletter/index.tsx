"use client";

import { useState } from "react";
import styles from "./index.module.css";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    // No backend wired yet — flip UI state for now.
    setSubmitted(true);
  }

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>Notes</span>
          <h2 className={styles.title}>
            Restocks &amp; new drops in your inbox.
          </h2>
          <p className={styles.dek}>
            One field. No daily spam. Unsubscribe anytime.
          </p>
        </div>

        {submitted ? (
          <p className={styles.thanks}>You&apos;re on the list.</p>
        ) : (
          <form className={styles.form} onSubmit={onSubmit}>
            <input
              type="email"
              required
              placeholder="Email address"
              aria-label="Email address"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className={styles.btn}>
              SUBSCRIBE
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
