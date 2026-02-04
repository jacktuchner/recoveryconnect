import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const { data: recording, error } = await supabase
      .from("Recording")
      .select("*, contributor:User!Recording_contributorId_fkey(*, profile:Profile(*)), reviews:Review(*, author:User!Review_authorId_fkey(*))")
      .eq("id", id)
      .single();

    if (error || !recording) {
      return NextResponse.json(
        { error: "Recording not found" },
        { status: 404 }
      );
    }

    // Check if user has access (is contributor or has purchased)
    let hasAccess = false;
    if (userId) {
      // Check if user is the contributor
      if (recording.contributorId === userId) {
        hasAccess = true;
      } else {
        // Check if user has purchased access
        const { data: access } = await supabase
          .from("RecordingAccess")
          .select("id")
          .eq("userId", userId)
          .eq("recordingId", id)
          .single();

        hasAccess = !!access;
      }
    }

    // Increment view count
    await supabase
      .from("Recording")
      .update({ viewCount: (recording.viewCount || 0) + 1 })
      .eq("id", id);

    return NextResponse.json({
      ...recording,
      hasAccess,
    });
  } catch (error) {
    console.error("Error fetching recording:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
