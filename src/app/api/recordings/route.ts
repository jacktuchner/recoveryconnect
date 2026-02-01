import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateMatchScore } from "@/lib/matching";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const procedure = searchParams.get("procedure");
    const ageRange = searchParams.get("ageRange");
    const activityLevel = searchParams.get("activityLevel");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const where: Record<string, unknown> = { status: "PUBLISHED" };
    if (procedure) where.procedureType = procedure;
    if (ageRange) where.ageRange = ageRange;
    if (activityLevel) where.activityLevel = activityLevel;
    if (category) where.category = category;

    const [recordings, total] = await Promise.all([
      prisma.recording.findMany({
        where,
        include: {
          contributor: { include: { profile: true } },
          reviews: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.recording.count({ where }),
    ]);

    const session = await getServerSession(authOptions);
    let enrichedRecordings: unknown[] = recordings;

    if (session?.user) {
      const userProfile = await prisma.profile.findUnique({
        where: { userId: (session.user as Record<string, string>).id },
      });

      if (userProfile) {
        enrichedRecordings = recordings
          .map((rec) => {
            const score = calculateMatchScore(
              {
                procedureType: userProfile.procedureType,
                procedureDetails: userProfile.procedureDetails,
                ageRange: userProfile.ageRange,
                activityLevel: userProfile.activityLevel,
                recoveryGoals: userProfile.recoveryGoals,
                complicatingFactors: userProfile.complicatingFactors,
                lifestyleContext: userProfile.lifestyleContext,
              },
              {
                procedureType: rec.procedureType,
                ageRange: rec.ageRange,
                activityLevel: rec.activityLevel,
                recoveryGoals: rec.recoveryGoals,
                complicatingFactors:
                  rec.contributor.profile?.complicatingFactors || [],
                lifestyleContext:
                  rec.contributor.profile?.lifestyleContext || [],
              }
            );
            return {
              ...rec,
              matchScore: score.score,
              matchBreakdown: score.breakdown,
            };
          })
          .sort(
            (a, b) => b.matchScore - a.matchScore
          );
      }
    }

    return NextResponse.json({
      recordings: enrichedRecordings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching recordings:", error);
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || !["CONTRIBUTOR", "BOTH", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Only contributors can create recordings" },
        { status: 403 }
      );
    }

    if (!user.profile) {
      return NextResponse.json(
        { error: "Please complete your profile first" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      category,
      mediaUrl,
      thumbnailUrl,
      durationSeconds,
      isVideo,
      price,
    } = body;

    if (!title || !category || !mediaUrl) {
      return NextResponse.json(
        { error: "Title, category, and media URL are required" },
        { status: 400 }
      );
    }

    const recording = await prisma.recording.create({
      data: {
        contributorId: userId,
        title,
        description,
        category,
        mediaUrl,
        thumbnailUrl,
        durationSeconds,
        isVideo: isVideo || false,
        price: price || 9.99,
        procedureType: user.profile.procedureType,
        ageRange: user.profile.ageRange,
        activityLevel: user.profile.activityLevel,
        recoveryGoals: user.profile.recoveryGoals,
        status: "PENDING_REVIEW",
      },
      include: { contributor: { include: { profile: true } } },
    });

    return NextResponse.json(recording, { status: 201 });
  } catch (error) {
    console.error("Error creating recording:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
