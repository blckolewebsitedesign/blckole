"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { subscribeAction, type NewsletterState } from "./actions";
import styles from "./index.module.css";

const INITIAL_STATE: NewsletterState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.btn} disabled={pending}>
      {pending ? "..." : "SUBSCRIBE"}
    </button>
  );
}

export function Newsletter() {
  const [state, formAction] = useActionState(subscribeAction, INITIAL_STATE);

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

        {state.status === "success" ? (
          <p className={styles.thanks}>You&apos;re on the list.</p>
        ) : (
          <form className={styles.form} action={formAction}>
            <input
              type="email"
              name="email"
              required
              placeholder="Email address"
              aria-label="Email address"
              className={styles.input}
              defaultValue=""
            />
            <SubmitButton />
            {state.status === "error" && state.message ? (
              <p className={styles.error} role="alert">
                {state.message}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </section>
  );
}
