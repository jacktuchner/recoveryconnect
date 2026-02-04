import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

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

    // Get the recording
    const { data: recording, error: recError } = await supabase
      .from("Recording")
      .select("*, contributor:User!Recording_contributorId_fkey(name)")
      .eq("id", recordingId)
      .eq("status", "PUBLISHED")
      .single();

    if (recError || !recording) {
      return NextResponse.json(
        { error: "Recording not found" },
        { status: 404 }
      );
    }

    // Check if user already has access
    const { data: existingAccess } = await supabase
      .from("RecordingAccess")
      .select("id")
      .eq("userId", userId)
      .eq("recordingId", recordingId)
      .single();

    if (existingAccess) {
      return NextResponse.json(
        { error: "You already have access to this recording" },
        { status: 400 }
      );
    }

    // Check if user is the contributor (they have free access)
    if (recording.contributorId === userId) {
      return NextResponse.json(
        { error: "You own this recording" },
        { status: 400 }
      );
    }

    // Create Stripe Checkout session
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: recording.title,
              description: `Recording by ${recording.contributor?.name || "Anonymous"}`,
              metadata: {
                recordingId: recording.id,
              },
            },
            unit_amount: Math.round(recording.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "recording_purchase",
        userId,
        recordingId,
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/recordings/${recordingId}`,
      customer_email: session.user.email || undefined,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
