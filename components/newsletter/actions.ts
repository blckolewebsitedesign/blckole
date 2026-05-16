"use server";

import { subscribeToNewsletter } from "lib/shopify";

export type NewsletterState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Codes we treat as "already subscribed" — we silently succeed so we don't
// leak whether an email address exists in the store's customer database.
const ALREADY_SUBSCRIBED_CODES = new Set([
  "TAKEN",
  "CUSTOMER_DISABLED",
  "UNIDENTIFIED_CUSTOMER",
]);

export async function subscribeAction(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    return { status: "error", message: "Enter a valid email address." };
  }

  try {
    const result = await subscribeToNewsletter(email);

    if (result.ok || ALREADY_SUBSCRIBED_CODES.has(result.code)) {
      return { status: "success" };
    }

    return {
      status: "error",
      message: result.message || "Something went wrong. Try again.",
    };
  } catch {
    return { status: "error", message: "Network error. Try again." };
  }
}
