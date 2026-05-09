"use server";

import { TAGS } from "lib/constants";
import { SHOPIFY_CHECKOUT_COUNTRY } from "lib/currency";
import {
  addToCart,
  createCart,
  getCart,
  removeFromCart,
  updateCart,
  updateCartBuyerIdentity,
} from "lib/shopify";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function addItem(
  prevState: any,
  selectedVariantId: string | undefined,
) {
  if (!selectedVariantId) {
    return "Error adding item to cart";
  }

  let cartId = (await cookies()).get("cartId")?.value;
  let cart;
  const lines = [{ merchandiseId: selectedVariantId, quantity: 1 }];

  if (cartId) {
    cart = await getCart();

    if (
      cart?.buyerIdentity.countryCode &&
      cart.buyerIdentity.countryCode !== SHOPIFY_CHECKOUT_COUNTRY
    ) {
      cart = await updateCartBuyerIdentity(SHOPIFY_CHECKOUT_COUNTRY);
    }
  }

  if (!cartId || !cart) {
    cart = await createCart(lines);
    (await cookies()).set("cartId", cart.id!);
    updateTag(TAGS.cart);
    return;
  }

  try {
    await addToCart(lines);
    updateTag(TAGS.cart);
  } catch (e) {
    try {
      cart = await createCart(lines);
      (await cookies()).set("cartId", cart.id!);
      updateTag(TAGS.cart);
    } catch {
      return "Error adding item to cart";
    }
  }
}

export async function removeItem(prevState: any, merchandiseId: string) {
  try {
    const cart = await getCart();

    if (!cart) {
      return "Error fetching cart";
    }

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId,
    );

    if (lineItem && lineItem.id) {
      await removeFromCart([lineItem.id]);
      updateTag(TAGS.cart);
    } else {
      return "Item not found in cart";
    }
  } catch (e) {
    return "Error removing item from cart";
  }
}

export async function updateItemQuantity(
  prevState: any,
  payload: {
    merchandiseId: string;
    quantity: number;
  },
) {
  const { merchandiseId, quantity } = payload;

  try {
    const cart = await getCart();

    if (!cart) {
      return "Error fetching cart";
    }

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId,
    );

    if (lineItem && lineItem.id) {
      if (quantity === 0) {
        await removeFromCart([lineItem.id]);
      } else {
        await updateCart([
          {
            id: lineItem.id,
            merchandiseId,
            quantity,
          },
        ]);
      }
    } else if (quantity > 0) {
      // If the item doesn't exist in the cart and quantity > 0, add it
      await addToCart([{ merchandiseId, quantity }]);
    }

    updateTag(TAGS.cart);
  } catch (e) {
    console.error(e);
    return "Error updating item quantity";
  }
}

export async function redirectToCheckout() {
  let cart = await getCart();
  if (
    cart?.buyerIdentity.countryCode &&
    cart.buyerIdentity.countryCode !== SHOPIFY_CHECKOUT_COUNTRY
  ) {
    cart = await updateCartBuyerIdentity(SHOPIFY_CHECKOUT_COUNTRY);
    updateTag(TAGS.cart);
  }
  redirect(cart!.checkoutUrl);
}

export async function createCartAndSetCookie() {
  let cart = await createCart();
  (await cookies()).set("cartId", cart.id!);
}
