/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'fitcode-testing.appspot.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'iamaspire.aspire.qa' },
      { protocol: 'https', hostname: 'img.sofascore.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
