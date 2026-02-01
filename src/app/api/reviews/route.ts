import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const body = await req.json();
    const {
      subjectId,
      recordingId,
      callId,
      rating,
      matchRelevance,
      helpfulness,
      comment,
    } = body;

    if (!subjectId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Subject ID and valid rating (1-5) are required" },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        authorId: userId,
        subjectId,
        recordingId,
        callId,
        rating,
        matchRelevance,
        helpfulness,
        comment,
      },
      include: { author: true },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
