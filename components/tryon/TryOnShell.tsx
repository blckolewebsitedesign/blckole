import { TryOnExperience } from "components/tryon/TryOnExperience";
import {
  mapShopifyTryOnProduct,
  sampleBottomwearProducts,
  sampleTopwearProducts,
} from "components/tryon/tryon-products";
import { getProductGlbUrlForAvatar } from "lib/tryon/getProductGlbUrl";
import type { TryOnProduct } from "types/tryon";

type Props = {
  products: TryOnProduct[];
};

function hasAnyAvatarModel(product: TryOnProduct) {
  return Boolean(
    getProductGlbUrlForAvatar(product, "female") ||
      getProductGlbUrlForAvatar(product, "male"),
  );
}

export function TryOnShell({ products }: Props) {
  const topwearProducts = products
    .filter(
      (product) => product.category === "top" && hasAnyAvatarModel(product),
    )
    .map(mapShopifyTryOnProduct);
  const bottomwearProducts = products
    .filter(
      (product) => product.category === "bottom" && hasAnyAvatarModel(product),
    )
    .map(mapShopifyTryOnProduct);

  return (
    <TryOnExperience
      topwearProducts={
        topwearProducts.length > 0 ? topwearProducts : sampleTopwearProducts
      }
      bottomwearProducts={
        bottomwearProducts.length > 0
          ? bottomwearProducts
          : sampleBottomwearProducts
      }
    />
  );
}
