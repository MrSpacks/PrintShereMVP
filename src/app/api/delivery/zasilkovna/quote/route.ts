import { NextResponse } from "next/server";

import { getZasilkovnaQuote } from "@/lib/delivery/zasilkovna";
import { prisma } from "@/lib/prisma";
import type { ZasilkovnaQuoteRequest } from "@/types/delivery";

function isQuoteRequest(body: unknown): body is ZasilkovnaQuoteRequest {
  if (!body || typeof body !== "object") return false;
  const payload = body as Record<string, unknown>;
  return (
    typeof payload.makerId === "string" &&
    typeof payload.weightGrams === "number" &&
    payload.weightGrams > 0
  );
}

/** Расчёт стоимости доставки Zásilkovna при оформлении заказа */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!isQuoteRequest(body)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const maker = await prisma.maker.findUnique({
      where: { id: body.makerId },
    });

    if (!maker) {
      return NextResponse.json({ error: "Maker not found" }, { status: 404 });
    }

    const quote = await getZasilkovnaQuote(body);
    return NextResponse.json(quote);
  } catch (error) {
    console.error("[POST /api/delivery/zasilkovna/quote]", error);
    return NextResponse.json(
      { error: "Failed to calculate delivery" },
      { status: 500 }
    );
  }
}
