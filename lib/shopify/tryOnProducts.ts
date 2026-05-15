import {
  DEFAULT_CURRENCY_MARKET,
  type SupportedCountryCode,
} from "lib/currency";
import { shopifyFetch } from "lib/shopify";
import type {
  Connection,
  Image,
  Money,
  ProductVariant,
} from "lib/shopify/types";
import type {
  BodyMaskPart,
  CompatibleAvatar,
  TryOnProduct,
  WearableCategory,
} from "types/tryon";

const TRY_ON_RIG_VERSION = "blckole_avatar_v1";

const getTryOnProductsQuery = /* GraphQL */ `
  query getTryOnProducts($country: CountryCode) @inContext(country: $country) {
    products(first: 100) {
      edges {
        node {
          id
          title
          handle
          featuredImage {
            url
            altText
            width
            height
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                availableForSale
                selectedOptions {
                  name
                  value
                }
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
          media(first: 20) {
            edges {
              node {
                mediaContentType
                ... on Model3d {
                  id
                  sources {
                    url
                    format
                    mimeType
                    filesize
                  }
                  previewImage {
                    url
                    altText
                    width
                    height
                  }
                }
              }
            }
          }
          metafields(
            identifiers: [
              { namespace: "custom", key: "enabled" }
              { namespace: "custom", key: "category" }
              { namespace: "custom", key: "compatible_avatar" }
              { namespace: "custom", key: "rig_version" }
              { namespace: "custom", key: "body_mask" }
              { namespace: "custom", key: "sort_order" }
              { namespace: "custom", key: "male_glb_url" }
              { namespace: "custom", key: "female_glb_url" }
              { namespace: "try_on", key: "enabled" }
              { namespace: "try_on", key: "category" }
              { namespace: "try_on", key: "compatible_avatar" }
              { namespace: "try_on", key: "rig_version" }
              { namespace: "try_on", key: "body_mask" }
              { namespace: "try_on", key: "sort_order" }
              { namespace: "try_on", key: "male_glb_url" }
              { namespace: "try_on", key: "female_glb_url" }
            ]
          ) {
            namespace
            key
            type
            value
          }
        }
      }
    }
  }
`;

type TryOnMetafield = {
  namespace: string;
  key: string;
  type: string;
  value: string;
} | null;

type ShopifyModel3dSource = {
  url: string;
  format?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
};

type ShopifyTryOnMedia =
  | {
      mediaContentType: "MODEL_3D";
      id: string;
      sources: ShopifyModel3dSource[];
      previewImage?: Image | null;
    }
  | {
      mediaContentType: string;
    };

type ShopifyTryOnProduct = {
  id: string;
  title: string;
  handle: string;
  featuredImage?: Image | null;
  priceRange: {
    minVariantPrice: Money;
  };
  variants: Connection<ProductVariant>;
  media: Connection<ShopifyTryOnMedia>;
  metafields: TryOnMetafield[];
};

type ShopifyTryOnProductsOperation = {
  data: {
    products: Connection<ShopifyTryOnProduct>;
  };
  variables: {
    country?: SupportedCountryCode;
  };
};

function removeEdgesAndNodes<T>(connection?: Connection<T>): T[] {
  return connection?.edges.map((edge) => edge.node).filter(Boolean) ?? [];
}

function metafieldMap(metafields: TryOnMetafield[]) {
  return new Map(
    metafields
      .filter((field): field is NonNullable<TryOnMetafield> => Boolean(field))
      .map((field) => [field.key, field.value]),
  );
}

function cleanUrl(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed && /^https?:\/\//i.test(trimmed) ? trimmed : undefined;
}

function isEnabled(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function isWearableCategory(
  value: string | undefined,
): value is WearableCategory {
  return (
    value === "top" ||
    value === "bottom" ||
    value === "shoes" ||
    value === "accessory"
  );
}

function isCompatibleAvatar(
  value: string | undefined,
): value is CompatibleAvatar {
  return value === "male" || value === "female" || value === "unisex";
}

function parseBodyMask(value: string | undefined): BodyMaskPart[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (part): part is BodyMaskPart =>
        part === "torso" ||
        part === "arms" ||
        part === "legs" ||
        part === "feet",
    );
  } catch {
    return [];
  }
}

function getGlbSources(media: Connection<ShopifyTryOnMedia>) {
  return removeEdgesAndNodes(media).flatMap((item) => {
    if (item.mediaContentType !== "MODEL_3D" || !("sources" in item)) {
      return [];
    }

    return item.sources.filter((source) => {
      const format = source.format?.toLowerCase();
      const mimeType = source.mimeType?.toLowerCase();
      return (
        format === "glb" ||
        mimeType === "model/gltf-binary" ||
        source.url.toLowerCase().includes(".glb")
      );
    });
  });
}

function getGlbUrl(media: Connection<ShopifyTryOnMedia>): string | undefined {
  return getGlbSources(media)[0]?.url;
}

function getAvatarGlbUrls(media: Connection<ShopifyTryOnMedia>) {
  return getGlbSources(media).reduce<{
    male?: string;
    female?: string;
  }>((urls, source) => {
    const url = source.url.toLowerCase();

    if (!urls.female && url.includes("female")) {
      return { ...urls, female: source.url };
    }

    if (!urls.male && url.includes("male")) {
      return { ...urls, male: source.url };
    }

    return urls;
  }, {});
}

function getMetafieldUrl(
  fields: Map<string, string>,
  key: "male_glb_url" | "female_glb_url",
) {
  return cleanUrl(fields.get(key));
}

function getAvatarSpecificGlbUrls(
  fields: Map<string, string>,
  media: Connection<ShopifyTryOnMedia>,
) {
  const mediaUrls = getAvatarGlbUrls(media);

  return {
    male: getMetafieldUrl(fields, "male_glb_url") ?? mediaUrls.male,
    female: getMetafieldUrl(fields, "female_glb_url") ?? mediaUrls.female,
  };
}

function normalizeTryOnProduct(
  product: ShopifyTryOnProduct,
): TryOnProduct | undefined {
  const fields = metafieldMap(product.metafields);

  if (!isEnabled(fields.get("enabled"))) return undefined;

  const category = fields.get("category");
  if (!isWearableCategory(category)) return undefined;

  const compatibleAvatar = fields.get("compatible_avatar");
  if (!isCompatibleAvatar(compatibleAvatar)) return undefined;

  const rigVersion = fields.get("rig_version");
  if (rigVersion !== TRY_ON_RIG_VERSION) return undefined;

  const avatarGlbUrls = getAvatarSpecificGlbUrls(fields, product.media);
  const maleGlbUrl = avatarGlbUrls.male;
  const femaleGlbUrl = avatarGlbUrls.female;
  const mediaGlbUrl = getGlbUrl(product.media);
  const glbUrl = maleGlbUrl ?? femaleGlbUrl ?? mediaGlbUrl;
  if (!glbUrl) return undefined;

  const variants = removeEdgesAndNodes(product.variants);
  const defaultVariant =
    variants.find((variant) => variant.availableForSale) ?? variants[0];
  if (!defaultVariant) return undefined;

  const price = defaultVariant.price ?? product.priceRange.minVariantPrice;

  return {
    id: product.id,
    shopifyProductId: product.id,
    variantId: defaultVariant.id,
    variants,
    title: product.title,
    handle: product.handle,
    category,
    price: price.amount,
    currencyCode: price.currencyCode,
    imageUrl: product.featuredImage?.url ?? "",
    glbUrl,
    maleGlbUrl,
    femaleGlbUrl,
    compatibleAvatar,
    rigVersion,
    bodyMask: parseBodyMask(fields.get("body_mask")),
    sortOrder: fields.get("sort_order")
      ? Number(fields.get("sort_order"))
      : undefined,
  };
}

export async function getTryOnProducts(
  countryCode: SupportedCountryCode = DEFAULT_CURRENCY_MARKET.countryCode,
): Promise<TryOnProduct[]> {
  const res = await shopifyFetch<ShopifyTryOnProductsOperation>({
    query: getTryOnProductsQuery,
    variables: { country: countryCode },
  });

  return removeEdgesAndNodes(res.body.data.products)
    .map(normalizeTryOnProduct)
    .filter((product): product is TryOnProduct => Boolean(product))
    .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
}
