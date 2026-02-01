import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: (session.user as any).id },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
// POST /api/profile - Create profile
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    const existing = await prisma.profile.findUnique({ where: { userId } });
    if (existing) {
      return NextResponse.json({ error: "Profile already exists. Use PUT to update." }, { status: 409 });
    }

    const profile = await prisma.profile.create({
      data: {
        userId,
        procedureType: body.procedureType,
        procedureDetails: body.procedureDetails || null,
        ageRange: body.ageRange,
        activityLevel: body.activityLevel || "RECREATIONAL",
        recoveryGoals: body.recoveryGoals || [],
        timeSinceSurgery: body.timeSinceSurgery || null,
        complicatingFactors: body.complicatingFactors || [],
        lifestyleContext: body.lifestyleContext || [],
        hourlyRate: body.hourlyRate || null,
        isAvailableForCalls: body.isAvailableForCalls || false,
      },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error("Error creating profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
// PUT /api/profile - Update profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    const profile = await prisma.profile.update({
      where: { userId },
      data: {
        procedureType: body.procedureType,
        procedureDetails: body.procedureDetails || null,
        ageRange: body.ageRange,
        activityLevel: body.activityLevel || "RECREATIONAL",
        recoveryGoals: body.recoveryGoals || [],
        timeSinceSurgery: body.timeSinceSurgery || null,
        complicatingFactors: body.complicatingFactors || [],
        lifestyleContext: body.lifestyleContext || [],
        hourlyRate: body.hourlyRate || null,
        isAvailableForCalls: body.isAvailableForCalls || false,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
