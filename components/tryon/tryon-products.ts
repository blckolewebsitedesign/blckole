import { getProductGlbUrlForAvatar } from "lib/tryon/getProductGlbUrl";
import type {
  AvatarGender,
  BodyMaskPart,
  CompatibleAvatar,
  TryOnProduct,
} from "types/tryon";

export type TryOnUiProductType = "topwear" | "bottomwear";

export type TryOnUiProduct = {
  id: string;
  name: string;
  price: number;
  currencyCode: string;
  type: TryOnUiProductType;
  thumbnail: string;
  modelUrl: string;
  wearableModelUrl: string;
  maleModelUrl?: string;
  femaleModelUrl?: string;
  maleWearableModelUrl?: string;
  femaleWearableModelUrl?: string;
  compatibleAvatar: CompatibleAvatar;
  bodyMask: BodyMaskPart[];
  handle?: string;
  sourceProduct?: TryOnProduct;
};

export const sampleTopwearProducts: TryOnUiProduct[] = [
  {
    id: "berserker-tank",
    name: "Berserker Tank",
    price: 4999,
    currencyCode: "INR",
    type: "topwear",
    thumbnail: "/products/berserker-tank.png",
    modelUrl: "/models/topwear/berserker-tank.glb",
    wearableModelUrl: "/models/wearables/berserker-tank.glb",
    compatibleAvatar: "unisex",
    bodyMask: ["torso"],
  },
  {
    id: "ritual-tee",
    name: "Ritual Tee",
    price: 4490,
    currencyCode: "INR",
    type: "topwear",
    thumbnail: "/products/ritual-tee.png",
    modelUrl: "/models/topwear/ritual-tee.glb",
    wearableModelUrl: "/models/wearables/ritual-tee.glb",
    compatibleAvatar: "unisex",
    bodyMask: ["torso", "arms"],
  },
  {
    id: "void-tank",
    name: "Void Tank",
    price: 3990,
    currencyCode: "INR",
    type: "topwear",
    thumbnail: "/products/void-tank.png",
    modelUrl: "/models/topwear/void-tank.glb",
    wearableModelUrl: "/models/wearables/void-tank.glb",
    compatibleAvatar: "unisex",
    bodyMask: ["torso"],
  },
  {
    id: "sigil-shirt",
    name: "Sigil Shirt",
    price: 5290,
    currencyCode: "INR",
    type: "topwear",
    thumbnail: "/products/sigil-shirt.png",
    modelUrl: "/models/topwear/sigil-shirt.glb",
    wearableModelUrl: "/models/wearables/sigil-shirt.glb",
    compatibleAvatar: "unisex",
    bodyMask: ["torso", "arms"],
  },
];

export const sampleBottomwearProducts: TryOnUiProduct[] = [
  {
    id: "crimson-baggy",
    name: "Crimson Baggy Pants",
    price: 8490,
    currencyCode: "INR",
    type: "bottomwear",
    thumbnail: "/products/crimson-baggy.png",
    modelUrl: "/models/bottomwear/crimson-baggy.glb",
    wearableModelUrl: "/models/wearables/crimson-baggy.glb",
    compatibleAvatar: "unisex",
    bodyMask: ["legs"],
  },
  {
    id: "obsidian-cargos",
    name: "Obsidian Cargos",
    price: 7890,
    currencyCode: "INR",
    type: "bottomwear",
    thumbnail: "/products/obsidian-cargos.png",
    modelUrl: "/models/bottomwear/obsidian-cargos.glb",
    wearableModelUrl: "/models/wearables/obsidian-cargos.glb",
    compatibleAvatar: "unisex",
    bodyMask: ["legs"],
  },
  {
    id: "ash-denim",
    name: "Ash Denim",
    price: 6990,
    currencyCode: "INR",
    type: "bottomwear",
    thumbnail: "/products/ash-denim.png",
    modelUrl: "/models/bottomwear/ash-denim.glb",
    wearableModelUrl: "/models/wearables/ash-denim.glb",
    compatibleAvatar: "unisex",
    bodyMask: ["legs"],
  },
  {
    id: "night-track-pants",
    name: "Night Track Pants",
    price: 7590,
    currencyCode: "INR",
    type: "bottomwear",
    thumbnail: "/products/night-track-pants.png",
    modelUrl: "/models/bottomwear/night-track-pants.glb",
    wearableModelUrl: "/models/wearables/night-track-pants.glb",
    compatibleAvatar: "unisex",
    bodyMask: ["legs"],
  },
];

export function mapShopifyTryOnProduct(product: TryOnProduct): TryOnUiProduct {
  const type: TryOnUiProductType =
    product.category === "bottom" ? "bottomwear" : "topwear";
  const maleUrl = getProductGlbUrlForAvatar(product, "male");
  const femaleUrl = getProductGlbUrlForAvatar(product, "female");
  const modelUrl = femaleUrl ?? maleUrl ?? product.glbUrl;

  return {
    id: product.id,
    name: product.title,
    price: Number(product.price),
    currencyCode: product.currencyCode,
    type,
    thumbnail: product.imageUrl || "/logo.svg",
    modelUrl,
    wearableModelUrl: modelUrl,
    maleModelUrl: maleUrl,
    femaleModelUrl: femaleUrl,
    maleWearableModelUrl: maleUrl,
    femaleWearableModelUrl: femaleUrl,
    compatibleAvatar: product.compatibleAvatar,
    bodyMask: product.bodyMask,
    handle: product.handle,
    sourceProduct: product,
  };
}

export function isProductCompatible(
  product: TryOnUiProduct,
  avatar: AvatarGender,
) {
  return (
    product.compatibleAvatar === "unisex" || product.compatibleAvatar === avatar
  );
}

export function resolvePreviewModelUrl(
  product: TryOnUiProduct,
  avatar: AvatarGender,
) {
  return avatar === "male"
    ? (product.maleModelUrl ?? product.modelUrl)
    : (product.femaleModelUrl ?? product.modelUrl);
}

export function resolveWearableModelUrl(
  product: TryOnUiProduct,
  avatar: AvatarGender,
) {
  return avatar === "male"
    ? (product.maleWearableModelUrl ?? product.wearableModelUrl)
    : (product.femaleWearableModelUrl ?? product.wearableModelUrl);
}
