/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@suvidha/types", "@suvidha/database"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
