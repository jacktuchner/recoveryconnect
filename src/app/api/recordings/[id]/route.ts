import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recording = await prisma.recording.findUnique({
      where: { id },
      include: {
        contributor: { include: { profile: true } },
        reviews: {
          include: { author: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!recording) {
      return NextResponse.json(
        { error: "Recording not found" },
        { status: 404 }
      );
    }

    await prisma.recording.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json(recording);
  } catch (error) {
    console.error("Error fetching recording:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
