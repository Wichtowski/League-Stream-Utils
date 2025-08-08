import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "*": ["public/**/*", ".next/static/**/*"]
  },
  serverExternalPackages: ["electron"], // to prevent bundling Electron
  // Bundle splitting optimizations
  experimental: {
    // Enable better tree shaking
    optimizePackageImports: ["@heroicons/react"]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
        pathname: "/cdn/**"
      }
    ],
    domains: ["vdo.ninja", "via.placeholder.com"]
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
