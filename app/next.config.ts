import type { NextConfig } from "next";
import { ALLOWED_IMAGE_HOSTS } from "@lib/services/common/constants";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "*": ["public/**/*", ".next/static/**/*"]
  },
  serverExternalPackages: ["electron"], // to prevent bundling Electron
  // Bundle splitting optimizations
  experimental: {
    // Enable better tree shaking
    optimizePackageImports: ["@heroicons/react"],
    // CSS optimization
    optimizeCss: true
  },
  // Content Security Policy headers (duplicated in auth.ts since data types missmatch)
  async headers() {
    const isDev = process.env.NODE_ENV === "development";

    // Skip CSP headers in development to avoid conflicts with dev tools
    if (isDev) {
      return [];
    }

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self'",
              "style-src 'self'",
              "img-src 'self' data: https: blob:",
              "font-src 'self'",
              "connect-src 'self' ws: wss: https://ddragon.leagueoflegends.com https://raw.communitydragon.org http://127.0.0.1:2999 https://127.0.0.1:2999 https://liquipedia.net",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'"
            ].join("; ")
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          }
        ]
      }
    ];
  },
  images: {
    domains: [], // Explicitly set empty to suppress deprecation warning
    remotePatterns: ALLOWED_IMAGE_HOSTS.map((h) => ({
      protocol: "https",
      hostname: h,
      pathname: "/**"
    }))
  },
  // Webpack configuration for bundle splitting
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Split vendor bundles
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          // React and React DOM
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: "react",
            chunks: "all",
            priority: 40
          },
          // Next.js
          next: {
            test: /[\\/]node_modules[\\/](next)[\\/]/,
            name: "next",
            chunks: "all",
            priority: 30
          },
          // UI Libraries
          ui: {
            test: /[\\/]node_modules[\\/](@headlessui|@heroicons|framer-motion)[\\/]/,
            name: "ui",
            chunks: "all",
            priority: 20
          },
          // Utilities
          utils: {
            test: /[\\/]node_modules[\\/](axios|uuid|ws|bcryptjs|jsonwebtoken)[\\/]/,
            name: "utils",
            chunks: "all",
            priority: 10
          },
          // Default vendor bundle
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendor",
            chunks: "all",
            priority: 5
          }
        }
      };
    }

    return config;
  },
  // Enable compression
  compress: true,
  // Enable source maps in development only
  productionBrowserSourceMaps: false
};

if (process.env.NODE_ENV === "development") delete nextConfig.output; // for HMR

export default nextConfig;
