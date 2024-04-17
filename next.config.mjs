/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "cautious-bandicoot-974.convex.cloud",
      },
    ],
  },
};

export default nextConfig;
