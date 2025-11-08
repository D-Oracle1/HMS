/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['ui', 'db'],
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
