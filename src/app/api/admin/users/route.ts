import { NextResponse } from "next/server";

import {
  buildAdminUsersOrderBy,
  buildAdminUsersWhere,
  parseAdminUsersQuery,
} from "@/lib/admin/list-users";
import {
  adminUnauthorized,
  requireAdminUser,
} from "@/lib/admin/require-admin";
import { mapPrismaUser } from "@/lib/users/map-user";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return adminUnauthorized();

    const query = parseAdminUsersQuery(new URL(request.url).searchParams);
    const where = buildAdminUsersWhere(query);
    const orderBy = buildAdminUsersOrderBy(query);
    const skip = (query.page - 1) * query.pageSize;

    const [total, records] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: query.pageSize,
        include: { _count: { select: { ownedMakers: true } } },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    const page = total === 0 ? 1 : Math.min(query.page, totalPages);

    return NextResponse.json({
      users: records.map(mapPrismaUser),
      total,
      page,
      pageSize: query.pageSize,
      totalPages,
    });
  } catch (error) {
    console.error("[GET /api/admin/users]", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
