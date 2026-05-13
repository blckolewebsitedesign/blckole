"use client";

import { create } from "zustand";
import type { AvatarGender, TryOnLook, TryOnProduct } from "types/tryon";

const PULL_DURATION_MS = 620;

type TryOnState = {
  selectedAvatar: AvatarGender;
  selectedTop: TryOnProduct | null;
  selectedBottom: TryOnProduct | null;
  selectedShoes: TryOnProduct | null;
  selectedAccessories: TryOnProduct[];
  pendingProduct: TryOnProduct | null;
  savedLooks: TryOnLook[];
  productErrors: Record<string, string>;
  setAvatar: (avatar: AvatarGender) => void;
  selectProduct: (product: TryOnProduct) => void;
  setProductVariant: (productId: string, variantId: string) => void;
  resetLook: () => void;
  saveLook: () => void;
  removeProduct: (
    category: TryOnProduct["category"],
    productId?: string,
  ) => void;
  setProductError: (productId: string, message: string) => void;
  clearProductError: (productId: string) => void;
};

function updateProductVariant(product: TryOnProduct, variantId: string) {
  const variant = product.variants.find((item) => item.id === variantId);
  if (!variant) return product;

  return {
    ...product,
    variantId,
    price: variant.price.amount,
    currencyCode: variant.price.currencyCode,
  };
}

function updateProductInSlot(
  product: TryOnProduct | null,
  productId: string,
  variantId: string,
) {
  if (!product || product.id !== productId) return product;
  return updateProductVariant(product, variantId);
}

function currentLook(state: TryOnState): TryOnLook {
  return {
    avatar: state.selectedAvatar,
    top: state.selectedTop,
    bottom: state.selectedBottom,
    shoes: state.selectedShoes,
    accessories: state.selectedAccessories,
  };
}

export const useTryOnStore = create<TryOnState>((set, get) => ({
  selectedAvatar: "male",
  selectedTop: null,
  selectedBottom: null,
  selectedShoes: null,
  selectedAccessories: [],
  pendingProduct: null,
  savedLooks: [],
  productErrors: {},
  setAvatar: (avatar) =>
    set({
      selectedAvatar: avatar,
      selectedTop: null,
      selectedBottom: null,
      selectedShoes: null,
      selectedAccessories: [],
      pendingProduct: null,
    }),
  selectProduct: (product) => {
    set({ pendingProduct: product });

    window.setTimeout(() => {
      const pending = get().pendingProduct;
      if (pending?.id !== product.id) return;

      set((state) => {
        if (product.category === "accessory") {
          const exists = state.selectedAccessories.some(
            (item) => item.id === product.id,
          );
          return {
            pendingProduct: null,
            selectedAccessories: exists
              ? state.selectedAccessories.filter(
                  (item) => item.id !== product.id,
                )
              : [...state.selectedAccessories, product],
          };
        }

        if (product.category === "top") {
          return { pendingProduct: null, selectedTop: product };
        }

        if (product.category === "bottom") {
          return { pendingProduct: null, selectedBottom: product };
        }

        return { pendingProduct: null, selectedShoes: product };
      });
    }, PULL_DURATION_MS);
  },
  setProductVariant: (productId, variantId) =>
    set((state) => ({
      selectedTop: updateProductInSlot(state.selectedTop, productId, variantId),
      selectedBottom: updateProductInSlot(
        state.selectedBottom,
        productId,
        variantId,
      ),
      selectedShoes: updateProductInSlot(
        state.selectedShoes,
        productId,
        variantId,
      ),
      selectedAccessories: state.selectedAccessories.map((product) =>
        product.id === productId
          ? updateProductVariant(product, variantId)
          : product,
      ),
    })),
  resetLook: () =>
    set({
      selectedTop: null,
      selectedBottom: null,
      selectedShoes: null,
      selectedAccessories: [],
      pendingProduct: null,
    }),
  saveLook: () =>
    set((state) => ({ savedLooks: [currentLook(state), ...state.savedLooks] })),
  removeProduct: (category, productId) =>
    set((state) => {
      if (category === "accessory") {
        return {
          selectedAccessories: productId
            ? state.selectedAccessories.filter((item) => item.id !== productId)
            : [],
        };
      }

      if (category === "top") return { selectedTop: null };
      if (category === "bottom") return { selectedBottom: null };
      return { selectedShoes: null };
    }),
  setProductError: (productId, message) =>
    set((state) => ({
      productErrors: { ...state.productErrors, [productId]: message },
    })),
  clearProductError: (productId) =>
    set((state) => {
      const next = { ...state.productErrors };
      delete next[productId];
      return { productErrors: next };
    }),
}));
