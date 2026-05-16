export default {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    cpus: 1,
    ppr: true,
    inlineCss: true,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 1,
    useCache: true,
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
