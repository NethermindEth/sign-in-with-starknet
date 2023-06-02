module.exports = {
  reactStrictMode: false, // process.env.NODE_ENV === "production" ? false : true, // this useEffect  to be called twice thats why its set to false
  // Use the CDN in production and localhost for development.
  assetPrefix: process.env.NODE_ENV === "production" ? 'http://143.42.2.9:3000' : undefined,
};