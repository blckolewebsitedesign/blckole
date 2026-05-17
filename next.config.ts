// next.config.ts

const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },

  // Next.js 16 replacement for:
  // experimental.ppr + experimental.useCache
  cacheComponents: true,

  experimental: {
    cpus: 1,
    inlineCss: true,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 1,
    webpackBuildWorker: false,
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
    ],
  },
};

export default nextConfig;
