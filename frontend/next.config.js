module.exports = {
  reactStrictMode: true,
  // Use the CDN in production and localhost for development.
  assetPrefix: process.env.NODE_ENV === "production" ? 'http://143.42.2.9' : undefined,
};