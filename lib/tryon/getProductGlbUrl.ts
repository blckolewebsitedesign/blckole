import type { AvatarGender, TryOnProduct } from "types/tryon";

export function getProductGlbUrlForAvatar(
  product: TryOnProduct,
  avatar: AvatarGender,
) {
  const hasAvatarSpecificGlb = Boolean(
    product.maleGlbUrl || product.femaleGlbUrl,
  );

  if (avatar === "male") {
    return (
      product.maleGlbUrl ?? (hasAvatarSpecificGlb ? undefined : product.glbUrl)
    );
  }

  return (
    product.femaleGlbUrl ?? (hasAvatarSpecificGlb ? undefined : product.glbUrl)
  );
}
