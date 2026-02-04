import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { transcribeAudio } from "@/lib/openai";
import { scanContent, needsManualReview, shouldAutoReject } from "@/lib/content-moderation";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const body = await req.json();
    const { recordingId } = body;

    if (!recordingId) {
      return NextResponse.json(
        { error: "Recording ID is required" },
        { status: 400 }
      );
    }

    // Verify the recording belongs to the user
    const { data: recording, error: fetchError } = await supabase
      .from("Recording")
      .select("*")
      .eq("id", recordingId)
      .single();

    if (fetchError || !recording) {
      return NextResponse.json(
        { error: "Recording not found" },
        { status: 404 }
      );
    }

    if (recording.contributorId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to transcribe this recording" },
        { status: 403 }
      );
    }

    // Mark transcription as pending
    await supabase
      .from("Recording")
      .update({ transcriptionStatus: "PENDING", updatedAt: new Date().toISOString() })
      .eq("id", recordingId);

    try {
      // Perform transcription
      const transcription = await transcribeAudio(recording.mediaUrl);

      // Scan content for potentially dangerous language
      const contentFlags = scanContent(transcription);

      // Determine recording status based on content scan
      let newStatus = recording.status;
      if (shouldAutoReject(contentFlags)) {
        newStatus = "REJECTED";
      } else if (needsManualReview(contentFlags)) {
        newStatus = "PENDING_REVIEW";
      }

      // Update recording with transcription
      const { data: updatedRecording, error: updateError } = await supabase
        .from("Recording")
        .update({
          transcription,
          transcriptionStatus: "COMPLETED",
          status: newStatus,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", recordingId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Create content flags in database if any were found
      if (contentFlags.length > 0) {
        const flagRecords = contentFlags.map(flag => ({
          id: uuidv4(),
          recordingId,
          flagType: flag.flagType,
          flaggedText: flag.flaggedText,
          context: flag.context,
          status: "PENDING",
          createdAt: new Date().toISOString(),
        }));

        // Insert flags (ignore errors if ContentFlag table doesn't exist yet)
        await supabase.from("ContentFlag").insert(flagRecords).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        transcription,
        recording: updatedRecording,
        contentFlags: contentFlags.length > 0 ? {
          count: contentFlags.length,
          needsReview: needsManualReview(contentFlags),
          autoRejected: shouldAutoReject(contentFlags),
        } : null,
      });
    } catch (transcriptionError) {
      // Mark transcription as failed
      await supabase
        .from("Recording")
        .update({ transcriptionStatus: "FAILED", updatedAt: new Date().toISOString() })
        .eq("id", recordingId);

      console.error("Transcription error:", transcriptionError);
      return NextResponse.json(
        { error: "Transcription failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in transcription endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
