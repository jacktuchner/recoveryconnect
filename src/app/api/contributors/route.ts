import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateMatchScore } from "@/lib/matching";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const procedure = searchParams.get("procedure");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const where: Record<string, unknown> = {
      role: { in: ["CONTRIBUTOR", "BOTH"] },
      profile: { isNot: null },
    };

    if (procedure) {
      where.profile = { ...(where.profile as object), procedureType: procedure };
    }

    const [contributors, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          profile: true,
          recordings: { where: { status: "PUBLISHED" }, take: 5 },
          reviewsReceived: true,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const session = await getServerSession(authOptions);
    let results: unknown[] = contributors;

    if (session?.user) {
      const userProfile = await prisma.profile.findUnique({
        where: { userId: (session.user as Record<string, string>).id },
      });

      if (userProfile) {
        results = contributors
          .map((c) => {
            if (!c.profile)
              return { ...c, matchScore: 0, matchBreakdown: [] };
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
                procedureType: c.profile.procedureType,
                procedureDetails: c.profile.procedureDetails,
                ageRange: c.profile.ageRange,
                activityLevel: c.profile.activityLevel,
                recoveryGoals: c.profile.recoveryGoals,
                complicatingFactors: c.profile.complicatingFactors,
                lifestyleContext: c.profile.lifestyleContext,
              }
            );
            return {
              ...c,
              matchScore: score.score,
              matchBreakdown: score.breakdown,
            };
          })
          .sort(
            (a, b) =>
              (b as { matchScore: number }).matchScore -
              (a as { matchScore: number }).matchScore
          );
      }
    }

    return NextResponse.json({
      contributors: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching contributors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
