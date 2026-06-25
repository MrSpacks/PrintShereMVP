import { NextResponse } from "next/server";

import { MOCK_ZASILKOVNA_POINTS } from "@/data/zasilkovna-points";

export async function GET() {
  return NextResponse.json({ points: MOCK_ZASILKOVNA_POINTS });
}
