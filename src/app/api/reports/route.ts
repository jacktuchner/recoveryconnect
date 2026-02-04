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
    const { contentType, contentId, reason, details } = body;

    if (!contentType || !contentId || !reason) {
      return NextResponse.json(
        { error: "Content type, content ID, and reason are required" },
        { status: 400 }
      );
    }

    // Check if user already reported this content
    const { data: existing } = await supabase
      .from("Report")
      .select("id")
      .eq("reporterId", userId)
      .eq("contentType", contentType)
      .eq("contentId", contentId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You have already reported this content" },
        { status: 409 }
      );
    }

    const { data: report, error } = await supabase
      .from("Report")
      .insert({
        id: uuidv4(),
        reporterId: userId,
        contentType,
        contentId,
        reason,
        details: details || null,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Admin only: fetch all reports
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING";

    const { data: reports, error } = await supabase
      .from("Report")
      .select("*, reporter:User!Report_reporterId_fkey(id, name, email)")
      .eq("status", status)
      .order("createdAt", { ascending: false });

    if (error) throw error;

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
