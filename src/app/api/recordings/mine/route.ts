import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: recordings, error } = await supabase
      .from("Recording")
      .select("*, reviews:Review(*)")
      .eq("contributorId", (session.user as any).id)
      .order("createdAt", { ascending: false });

    if (error) throw error;

    return NextResponse.json(recordings);
  } catch (error) {
    console.error("Error fetching recordings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
