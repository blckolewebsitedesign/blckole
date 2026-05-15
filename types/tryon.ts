export type AvatarGender = "male" | "female";

export type CompatibleAvatar = AvatarGender | "unisex";

export type WearableCategory = "top" | "bottom" | "shoes" | "accessory";

export type BodyMaskPart = "torso" | "arms" | "legs" | "feet";

export type TryOnVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  selectedOptions: {
    name: string;
    value: string;
  }[];
  price: {
    amount: string;
    currencyCode: string;
  };
};

export type TryOnProduct = {
  id: string;
  shopifyProductId: string;
  variantId: string;
  variants: TryOnVariant[];
  title: string;
  handle: string;
  category: WearableCategory;
  price: string;
  currencyCode: string;
  imageUrl: string;
  glbUrl: string;
  maleGlbUrl?: string;
  femaleGlbUrl?: string;
  compatibleAvatar: CompatibleAvatar;
  rigVersion: "blckole_avatar_v1";
  bodyMask: BodyMaskPart[];
  sortOrder?: number;
};

export type TryOnLook = {
  avatar: AvatarGender;
  top: TryOnProduct | null;
  bottom: TryOnProduct | null;
  shoes: TryOnProduct | null;
  accessories: TryOnProduct[];
};
