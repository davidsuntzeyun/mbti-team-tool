/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Every page here reads live session/roster/guess data via cookies() and
    // the local data layer, so the client router cache should never serve a
    // stale copy right after a save (e.g. setting your MBTI type, adding a
    // guess). Disabling the cache window for dynamic routes fixes that.
    staleTimes: {
      dynamic: 0,
    },
  },
};

module.exports = nextConfig;
