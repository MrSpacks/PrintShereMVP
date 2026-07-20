/** @type {import('next').NextConfig} */
const appVersion =
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  (process.env.NODE_ENV === "production" ? `build-${Date.now()}` : "dev");

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  async headers() {
    return [
      {
        // HTML и API версии — не кэшировать в браузере надолго
        source: "/((?!_next/static|_next/image|favicon.ico|icon.png|logo.png|images/).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
