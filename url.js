node << "NODE";
require("@next/env").loadEnvConfig(process.cwd());
const domain = process.env.SHOPIFY_STORE_DOMAIN?.startsWith("https://")
  ? process.env.SHOPIFY_STORE_DOMAIN
  : `https://${process.env.SHOPIFY_STORE_DOMAIN}`;
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const endpoint = `${domain}/api/2023-01/graphql.json`;
const query = `
query FindJortsModels($query: String!) {
  products(first: 10, query: $query) {
    edges {
      node {
        title
        handle
        media(first: 20) {
          edges {
            node {
              mediaContentType
              ... on Model3d {
                id
                sources { url format mimeType filesize }
              }
            }
          }
        }
      }
    }
  }
}`;
(async () => {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({
      query,
      variables: {
        query: "Blackfade Script Denim OR Blackfade-Script-Denim",
      },
    }),
  });
  const json = await res.json();
  if (json.errors) {
    console.log(JSON.stringify(json.errors, null, 2));
    process.exit(0);
  }
  const products = json.data.products.edges.map((e) => e.node);
  for (const product of products) {
    const urls = [];
    for (const edge of product.media.edges) {
      const media = edge.node;
      if (media.mediaContentType !== "MODEL_3D") continue;
      for (const source of media.sources) {
        if (
          source.format === "glb" ||
          source.mimeType === "model/gltf-binary" ||
          source.url.toLowerCase().includes(".glb")
        ) {
          urls.push(source.url);
        }
      }
    }
    console.log("\n" + product.title + " / " + product.handle);
    if (urls.length === 0) console.log("  No GLB Model3d sources found");
    for (const url of urls) console.log("  " + url);
  }
})();
NODE;
