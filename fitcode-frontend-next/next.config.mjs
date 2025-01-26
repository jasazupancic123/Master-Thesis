/** @type {import('next').NextConfig} */
const nextConfig = {
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
