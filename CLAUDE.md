# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server with Turbopack (http://localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm prettier     # Auto-format all files
pnpm prettier:check  # Check formatting (also the only "test" command)
```

## Environment Setup

Copy `.env.example` and populate:

```
SHOPIFY_STORE_DOMAIN=mystore.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=...
SHOPIFY_REVALIDATION_SECRET=...
COMPANY_NAME="My Company"
SITE_NAME="My Store"
```

Alternatively: `vercel link && vercel env pull` if the project is linked to Vercel.

## Architecture

This is a **Next.js 15 App Router** headless storefront backed by **Shopify Storefront GraphQL API**, built with React 19 Server Components and Tailwind CSS v4.

### Layers

**`lib/shopify/`** — All Shopify communication. `index.ts` is the central API client that wraps every query and mutation. Queries are cached with Next.js `cacheTag()` and `cacheLife()`; cache is invalidated via the ISR webhook at `app/api/revalidate/route.ts` (validates `SHOPIFY_REVALIDATION_SECRET`).

**`components/cart/`** — Cart state lives in `cart-context.tsx` as a React Context using `useOptimistic` for instant UI feedback. Server Actions in `actions.ts` call the Shopify cart mutations. The CartProvider wraps the whole app in `app/layout.tsx`.

**`components/`** — Server Components by default; only cart and interactive UI are Client Components. Product gallery, variant selector, search filters, and the mobile nav use client-side state.

**`app/`** — App Router pages. Dynamic segments: `product/[handle]`, `search/[collection]`, and `[page]` (CMS pages from Shopify). `app/sitemap.ts` and `app/robots.ts` auto-generate from Shopify data.

### Data Flow

1. Server Components call `lib/shopify/index.ts` during render (cached).
2. Cache tags (`TAGS` from `lib/constants.ts`) link Shopify resources to Next.js cache entries.
3. Shopify webhooks hit `/api/revalidate` to purge stale cache.
4. Cart mutations go through Server Actions with `useOptimistic` for the optimistic update pattern.

### Key Patterns

- **No client-side data fetching** for product/collection data — everything is server-rendered or ISR.
- **`createUrl()`** in `lib/utils.ts` is the canonical way to build URLs with search params (used throughout search/filter).
- **`defaultSort` and `sorting`** constants in `lib/constants.ts` drive all sort options; adding a sort option requires updating that list and ensuring the Shopify query supports it.
- Next.js **Partial Pre-Rendering (PPR)** is enabled (`next.config.ts`); Suspense boundaries are intentional.
- Shopify CDN domains are whitelisted in `next.config.ts` for `<Image>` optimization — add new domains there if switching Shopify stores.
