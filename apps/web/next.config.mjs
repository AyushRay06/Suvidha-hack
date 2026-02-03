/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@suvidha/types'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
