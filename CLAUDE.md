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

- `queries/` — query strings (cart, collection, product, menu, page variants)
- `mutations/` — mutation strings (create/add/edit/remove cart)
- `fragments/` — fragments (cart, product, image, seo)

Response data is reshaped in `index.ts` (e.g. `reshapeProduct`, `reshapeCart`) to flatten Shopify's nested edges/nodes structure into plain app types defined in `types.ts`.

### Routing

| Route                  | Data fetched                                                                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                    | `getCollectionProducts('hidden-homepage-featured-items')` → fallback `getProducts({})`, `getProductRecommendations` per product, `getProducts({})` for featured section |
| `/looks/[slug]`        | Same as `/` but pre-selects the product matching `slug` via `initialHandle` prop                                                                                        |
| `/products/[handle]`   | `getProduct(handle)`                                                                                                                                                    |
| `/indexes/products`    | Products index listing                                                                                                                                                  |
| `/indexes/collections` | Collections index listing                                                                                                                                               |
| `/story/[slug]`        | Story/editorial page                                                                                                                                                    |
| `/[page]`              | `getPage(handle)`                                                                                                                                                       |
| `/sitemap.xml`         | `getCollections`, `getProducts`, `getPages`                                                                                                                             |
| `/api/revalidate`      | Webhook — calls `revalidateTag`                                                                                                                                         |

All dynamic product/collection/page routes call `notFound()` if the Shopify query returns null.

### HomeScene Interaction Model

The homepage is a single-page "look browser" experience, not a traditional product listing:

- **`HomeScene`** (`components/home-scene/`) — root Client Component that owns all interaction state: `selectedIndex` (which product is in detail view), `currentFrame` (360° rotation frame), `isExpanded` (bottom panel expanded state). It manages the URL via `history.pushState` directly (not Next.js router) so that selecting a product deep-links to `/looks/[handle]` without a page reload.

- **`ScrollStage`** (`components/scroll-stage/`) — renders all products as a horizontal row of `RotatingFigure` slots. On product select, GSAP animates the selected thumbnail to fly into the detail view position ("flying thumbnail" transition). In detail mode, all products are rendered as a carousel with GSAP-driven slide positions. Keyboard (Escape), wheel, and touch swipe are all wired here.

- The `HomeScene` container has a fixed-position hero (`mainRef`) that fades out via GSAP ScrollTrigger as the scrollable content below (`contentRef`) glides up. `FeaturedProducts` and `Footer` live in that scrollable section.

- **`/looks/[slug]`** renders the identical `HomeScene` but passes `initialHandle` so the detail view opens immediately on load, enabling shareable deep links.

### Product Media & ChromaKeyCanvas

All product media rendering goes through `ChromaKeyCanvas` (`components/chroma-key-canvas/`):

- Implements a WebGL chroma-key shader that composites green-screen product images/videos onto a transparent background in real time.
- For images: renders a single frame onto a WebGL canvas.
- For videos: drives a `requestAnimationFrame` render loop; pauses via `IntersectionObserver` when off-screen.
- Falls back to a plain `<img>` or `<video>` tag if WebGL is unavailable.

**`RotatingFigure`** (`components/rotating-figure/`) wraps `ChromaKeyCanvas` and handles the product display logic:

- If the product has a `VIDEO` media item, it renders the video through `ChromaKeyCanvas`.
- Otherwise, it cycles through `product.images` as rotation frames at 900ms intervals (3× faster on hover), controlled by an `externalFrame` prop when in detail mode.
- Renders as a `<button>` (when `onClick` is provided) or a `<Link>` to `/products/[handle]` (default).

**Filmstrip convention:** The **last image** in `product.images` is treated as a horizontal filmstrip sprite sheet for 36-frame 360° rotation. `ProductDetailPanel` uses it to render a scrubbable filmstrip UI that drives `currentFrame` back up to `HomeScene` → `ScrollStage` → `RotatingFigure`.

### Animation System

GSAP is the primary animation engine throughout:

- `gsap` + `@gsap/react` (`useGSAP`) are used in every major interactive component.
- `ScrollTrigger` is registered globally in `HomeScene` and `FeaturedProducts`.
- All GSAP instances are scoped (`{ scope: ref }`) to avoid selector collisions.
- `gsap.matchMedia` is used in `ScrollStage` for mobile/desktop responsive animation differences.

Smooth scrolling uses Lenis (`lenis` / `@studio-freight/lenis`).

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

- `home-scene/index.tsx`, `scroll-stage/index.tsx`, `bottom-bar/index.tsx`
- `rotating-figure/index.tsx`, `chroma-key-canvas/index.tsx`
- `featured-products/index.tsx`, `product-detail-panel/index.tsx`
- `cart/cart-context.tsx`, `cart/add-to-cart.tsx`, `cart/drawer.tsx`
- `page-transition/index.tsx`

Everything else (page files, `Header`, `Footer`, `SiteShell`, etc.) is a Server Component.

### Key Conventions

**Hidden content:** Products tagged `nextjs-frontend-hidden` (constant `HIDDEN_PRODUCT_TAG`) are excluded from listings and set `robots: noindex`. Collections prefixed `hidden-*` are filtered out of the public collections list but used internally (homepage featured slot uses `hidden-homepage-featured-items`).

**URL construction:** Always use `createUrl(pathname, searchParams)` from `lib/utils.ts` when building URLs with query params.

**Image optimization:** Shopify CDN domains are whitelisted in `next.config.ts` for `<Image>` (`cdn.shopify.com`). When switching stores, update the `images.remotePatterns` entry there.

**Metadata:** Each page route exports a `generateMetadata` function that sources titles and OG images from Shopify data. The root layout sets a `%s | SITE_NAME` title template.

**Product JSON-LD:** The product page emits a `<script type="application/ld+json">` schema block — keep it in sync when changing how product data is fetched or reshaped.
