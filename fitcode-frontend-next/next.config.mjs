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
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            ref: true,
            svgo: false, // <-- disables optimization, keeps your ids verbatim
          },
        },
      ],
    });

    return config;
  },
};

export default nextConfig;
