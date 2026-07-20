import { NextResponse } from "next/server";

import { getAppVersion } from "@/lib/version/app-version";

export const dynamic = "force-dynamic";

/** Текущая версия на сервере — для проверки устаревших вкладок */
export async function GET() {
  return NextResponse.json(
    { version: getAppVersion() },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    }
  );
}
