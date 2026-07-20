import { NextResponse } from "next/server";

import { purgeExpiredOrderFiles } from "@/lib/orders/purge-expired-order-files";

/**
 * Cron: удаление STL/OBJ через 30 дней после завершения заказа.
 * Vercel Cron → GET с заголовком Authorization: Bearer CRON_SECRET
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 }
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await purgeExpiredOrderFiles();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/cron/purge-order-files]", error);
    return NextResponse.json({ error: "Purge failed" }, { status: 500 });
  }
}
