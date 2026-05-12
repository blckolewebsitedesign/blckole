"use server";

import { TAGS } from "lib/constants";
import { createCart } from "lib/shopify";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function buyAgain(formData: FormData) {
  const variantIds = formData
    .getAll("variantId")
    .map((value) => String(value))
    .filter(Boolean);
  const quantities = formData
    .getAll("quantity")
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (variantIds.length === 0) {
    redirect("/profile?cart=unavailable");
  }

  const cart = await createCart(
    variantIds.map((merchandiseId, index) => ({
      merchandiseId,
      quantity: quantities[index] ?? 1,
    })),
  );

  (await cookies()).set("cartId", cart.id!);
  updateTag(TAGS.cart);
  redirect("/profile?cart=updated");
}
