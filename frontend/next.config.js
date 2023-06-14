module.exports = {
  reactStrictMode: false, // process.env.NODE_ENV === "production" ? false : true, // this useEffect  to be called twice thats why its set to false
  // Use the CDN in production and localhost for development.
  assetPrefix: process.env.NODE_ENV === "production" ? 'https://siws.nethermind.io/' : undefined,
};