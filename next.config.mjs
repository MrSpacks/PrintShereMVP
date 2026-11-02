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
        source: "/:path*",
        headers: [
          // Запрет встраивания в чужие iframe (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Геолокация нужна карте и регистрации мастерской, остальное не используем
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)",
          },
        ],
      },
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
