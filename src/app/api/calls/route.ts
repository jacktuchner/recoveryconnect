import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLATFORM_FEE_PERCENT } from "@/lib/constants";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const calls = await prisma.call.findMany({
      where: {
        OR: [{ patientId: userId }, { contributorId: userId }],
      },
      include: {
        patient: true,
        contributor: { include: { profile: true } },
        reviews: true,
      },
      orderBy: { scheduledAt: "desc" },
    });

    return NextResponse.json(calls);
  } catch (error) {
    console.error("Error fetching calls:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const body = await req.json();
    const { contributorId, scheduledAt, durationMinutes, questionsInAdvance } =
      body;

    if (!contributorId || !scheduledAt) {
      return NextResponse.json(
        { error: "Contributor ID and scheduled time are required" },
        { status: 400 }
      );
    }

    const contributor = await prisma.user.findUnique({
      where: { id: contributorId },
      include: { profile: true },
    });

    if (!contributor?.profile?.isAvailableForCalls) {
      return NextResponse.json(
        { error: "This contributor is not available for calls" },
        { status: 400 }
      );
    }

    const rate = contributor.profile.hourlyRate || 50;
    const duration = durationMinutes || 30;
    const price = duration === 60 ? rate : rate / 2;
    const platformFee = price * (PLATFORM_FEE_PERCENT / 100);
    const contributorPayout = price - platformFee;

    const call = await prisma.call.create({
      data: {
        patientId: userId,
        contributorId,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: duration,
        questionsInAdvance,
        price,
        platformFee,
        contributorPayout,
        status: "REQUESTED",
      },
      include: {
        patient: true,
        contributor: { include: { profile: true } },
      },
    });

    return NextResponse.json(call, { status: 201 });
  } catch (error) {
    console.error("Error booking call:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
