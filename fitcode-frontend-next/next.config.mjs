/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'fitcode-testing.appspot.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'iamaspire.aspire.qa',
      },
      {
        protocol: 'https',
        hostname: 'img.sofascore.com',
      },
    ],
    domains: [
      'fitcode-testing.appspot.com',
      'localhost',
      'iamaspire.aspire.qa',
      'img.sofascore.com',
    ],
  },
};

export default nextConfig;
