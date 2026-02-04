import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: contributor, error } = await supabase
      .from("User")
      .select("*, profile:Profile(*), recordings:Recording(*, reviews:Review(*)), reviewsReceived:Review(*, author:User!Review_authorId_fkey(*)), availability:Availability(*)")
      .eq("id", id)
      .single();

    if (error || !contributor) {
      return NextResponse.json(
        { error: "Contributor not found" },
        { status: 404 }
      );
    }

    // Filter recordings to only published ones and sort
    if (contributor.recordings) {
      contributor.recordings = contributor.recordings
        .filter((r: any) => r.status === "PUBLISHED")
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Sort and limit reviews
    if (contributor.reviewsReceived) {
      contributor.reviewsReceived = contributor.reviewsReceived
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
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
