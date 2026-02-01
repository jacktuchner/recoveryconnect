import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as Record<string, string>).id;
    const body = await req.json();
    const { status } = body;

    const call = await prisma.call.findUnique({ where: { id } });
    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    if (call.patientId !== userId && call.contributorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedTransitions: Record<string, string[]> = {
      REQUESTED: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["COMPLETED", "CANCELLED", "NO_SHOW"],
    };

    if (!allowedTransitions[call.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${call.status} to ${status}` },
        { status: 400 }
      );
    }

    const updated = await prisma.call.update({
      where: { id },
      data: { status },
      include: {
        patient: true,
        contributor: { include: { profile: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating call:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
