import { NextResponse } from "next/server";

import {
  requireMakerUser,
  unauthorized,
} from "@/lib/maker/require-maker";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, props: RouteParams) {
  const params = await props.params;
  const user = await requireMakerUser();
  if (!user) return unauthorized();

  const filament = await prisma.makerFilament.findUnique({
    where: { id: params.id },
  });

  if (!filament || !user.maker || filament.makerId !== user.maker.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.makerFilament.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
