import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionId = req.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    const { type, recordingId } = checkoutSession.metadata || {};

    let recordingTitle: string | undefined;
    if (recordingId) {
      const { data: recording } = await supabase
        .from("Recording")
        .select("title")
        .eq("id", recordingId)
        .single();
      recordingTitle = recording?.title;
    }

    return NextResponse.json({
      type,
      recordingId,
      recordingTitle,
    });
  } catch (error) {
    console.error("Error fetching checkout session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
