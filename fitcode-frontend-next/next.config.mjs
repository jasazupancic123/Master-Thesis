/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'fitcode-testing.appspot.com',
      },
    ],
  },
};

export default nextConfig;
