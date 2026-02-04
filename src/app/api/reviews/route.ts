import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

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

    const { data: review, error } = await supabase
      .from("Review")
      .insert({
        id: uuidv4(),
        authorId: userId,
        subjectId,
        recordingId,
        callId,
        rating,
        matchRelevance,
        helpfulness,
        comment,
        createdAt: new Date().toISOString(),
      })
      .select("*, author:User!Review_authorId_fkey(*)")
      .single();

    if (error) throw error;

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
