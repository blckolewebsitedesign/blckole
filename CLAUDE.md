# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Dev server with Turbopack on http://localhost:3000
pnpm build            # Production build
pnpm start            # Start production server
pnpm prettier         # Auto-format all files
pnpm prettier:check   # Check formatting (this is also the only test command)
```

There is no ESLint config — Prettier is the sole code style enforcer.

## Environment Variables

Required (validated at startup by `lib/utils.ts:validateEnvironmentVariables()`):
- `SHOPIFY_STORE_DOMAIN` — store subdomain, e.g. `mystore.myshopify.com`
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN` — Storefront API public token

Optional:
- `SHOPIFY_REVALIDATION_SECRET` — shared secret for the ISR webhook
- `COMPANY_NAME` — footer copyright name
- `SITE_NAME` — navbar/metadata site title

To pull from Vercel: `vercel link && vercel env pull`

## Architecture

Next.js 15 App Router storefront backed by Shopify Storefront GraphQL API. Uses React 19 Server Components, Tailwind CSS v4, and experimental Next.js features: Partial Pre-Rendering (`ppr: true`) and inline CSS (`inlineCss: true`).

### Layer Overview

```
app/                  # Routes (all Server Components by default)
components/           # UI — Server Components unless 'use client' is declared
lib/shopify/          # All Shopify API communication
lib/constants.ts      # TAGS, sorting, hidden-product tag
lib/utils.ts          # createUrl(), baseUrl, validateEnvironmentVariables()
lib/type-guards.ts    # isShopifyError(), isObject()
```

### Shopify Integration (`lib/shopify/`)

`index.ts` is the single entry point for all Shopify calls. It exports:
- **Cart:** `createCart`, `getCart`, `addToCart`, `removeFromCart`, `updateCart`
- **Products:** `getProduct`, `getProducts`, `getProductRecommendations`
- **Collections:** `getCollection`, `getCollections`, `getCollectionProducts`
- **Content:** `getMenu`, `getPage`, `getPages`

Every read function (except `getCart`) wraps its body in `"use cache"` with `cacheTag()` and `cacheLife('days')`. `getCart` uses `cacheLife('seconds')` and `"use cache": "no-store"` semantics (private). Tags are from `TAGS = { collections, products, cart }` in `lib/constants.ts`.

Cache is invalidated on-demand by the Shopify webhook at `app/api/revalidate/route.ts`, which calls `revalidateTag(TAGS.collections)` or `revalidateTag(TAGS.products)` based on the webhook topic. The request must carry `?secret=SHOPIFY_REVALIDATION_SECRET`.

GraphQL structure:
- `queries/` — 10 query strings (cart, collection, product, menu, page variants)
- `mutations/` — 4 mutation strings (create/add/edit/remove cart)
- `fragments/` — 4 fragments (cart, product, image, seo)

Response data is reshaped in `index.ts` (e.g. `reshapeProduct`, `reshapeCart`) to flatten Shopify's nested edges/nodes structure into plain app types defined in `types.ts`.

### Routing

| Route | Data fetched |
|---|---|
| `/` | `getCollectionProducts('hidden-homepage-featured-items')`, `getCollectionProducts('hidden-homepage-carousel')` |
| `/search?q=&sort=` | `getProducts({ query, sortKey, reverse })` |
| `/search/[collection]` | `getCollection`, `getCollectionProducts` |
| `/product/[handle]` | `getProduct(handle)`, `getProductRecommendations(id)` |
| `/[page]` | `getPage(handle)` |
| `/sitemap.xml` | `getCollections`, `getProducts`, `getPages` |
| `/api/revalidate` | Webhook — calls `revalidateTag` |

All dynamic product/collection/page routes call `notFound()` if the Shopify query returns null.

### Cart State

`components/cart/cart-context.tsx` (Client Component) provides `CartContext`. The root layout passes a cart promise into the provider without awaiting it — the provider resolves it lazily.

`useCart()` returns `{ cart, updateCartItem, addCartItem }`. Cart mutations use `useOptimistic` so the UI updates immediately while the server action runs.

Server actions live in `components/cart/actions.ts` (`"use server"`):
- `addItem(prevState, selectedVariantId)`
- `removeItem(prevState, merchandiseId)`
- `updateItemQuantity(prevState, { merchandiseId, quantity })`
- `redirectToCheckout()`
- `createCartAndSetCookie()`

Cart ID is persisted in a `cartId` cookie.

### Server vs Client Components

**Client Components** (`"use client"`):
- `cart/cart-context.tsx`, `cart/modal.tsx`, `cart/add-to-cart.tsx`, `cart/delete-item-button.tsx`, `cart/edit-item-quantity-button.tsx`
- `product/gallery.tsx`, `product/variant-selector.tsx`
- `layout/navbar/search.tsx`
- `welcome-toast.tsx`, `error.tsx`

Everything else is a Server Component, including `Navbar`, `Footer`, `Carousel`, `ThreeItemGrid`, and all page files.

### Key Conventions

**Hidden content:** Products tagged `nextjs-frontend-hidden` (constant `HIDDEN_PRODUCT_TAG`) are excluded from listings and set `robots: noindex`. Collections prefixed `hidden-*` are filtered out of the public collections list but used internally (homepage slots).

**Variant state in URL:** The product page stores selected variant options as search params (e.g. `?color=Red&size=L`). `VariantSelector` reads/writes these params via `useRouter.replace` — do not use local state for variant selection.

**URL construction:** Always use `createUrl(pathname, searchParams)` from `lib/utils.ts` when building URLs with query params. It merges params cleanly and is used consistently across search, filters, and variant links.

**Sorting:** Sort options are defined in `lib/constants.ts` as the `sorting` array. Each entry maps a UI label to a Shopify `sortKey` + `reverse` flag. Adding a new sort option requires updating this array and ensuring the Shopify query supports the key.

**Image optimization:** Shopify CDN domains are whitelisted in `next.config.ts` for `<Image>`. When switching stores, update the `images.remotePatterns` entry there.

**Product JSON-LD:** The product page emits a `<script type="application/ld+json">` schema block — keep it in sync when changing how product data is fetched or reshaped.

**Metadata:** Each page route exports a `generateMetadata` function that sources titles and OG images from Shopify data. The root layout sets a `%s | SITE_NAME` title template.
