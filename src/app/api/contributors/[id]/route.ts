import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contributor = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        recordings: {
          where: { status: "PUBLISHED" },
          include: { reviews: true },
          orderBy: { createdAt: "desc" },
        },
        reviewsReceived: {
          include: { author: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        availability: true,
      },
    });

    if (!contributor) {
      return NextResponse.json(
        { error: "Contributor not found" },
        { status: 404 }
      );
    }

    const { passwordHash, ...safe } = contributor as Record<string, unknown>;
    return NextResponse.json(safe);
  } catch (error) {
    console.error("Error fetching contributor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
