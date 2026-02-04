import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import { PLATFORM_FEE_PERCENT } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;
    const body = await req.json();
    const { contributorId, scheduledAt, durationMinutes, questionsInAdvance } = body;

    if (!contributorId || !scheduledAt) {
      return NextResponse.json(
        { error: "Contributor ID and scheduled time are required" },
        { status: 400 }
      );
    }

    // Get the contributor
    const { data: contributor, error: contribError } = await supabase
      .from("User")
      .select("*, profile:Profile(*)")
      .eq("id", contributorId)
      .single();

    if (contribError || !contributor?.profile?.isAvailableForCalls) {
      return NextResponse.json(
        { error: "This contributor is not available for calls" },
        { status: 400 }
      );
    }

    // Calculate pricing
    const rate = contributor.profile.hourlyRate || 50;
    const duration = durationMinutes || 30;
    const price = duration === 60 ? rate : rate / 2;

    // Create Stripe Checkout session
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const scheduledDate = new Date(scheduledAt);
    const formattedDate = scheduledDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${duration}-minute call with ${contributor.name || "Contributor"}`,
              description: `Scheduled for ${formattedDate}`,
              metadata: {
                contributorId,
                durationMinutes: String(duration),
              },
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "call_payment",
        userId,
        contributorId,
        scheduledAt: scheduledDate.toISOString(),
        durationMinutes: String(duration),
        questionsInAdvance: questionsInAdvance || "",
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&type=call`,
      cancel_url: `${baseUrl}/book/${contributorId}`,
      customer_email: session.user.email || undefined,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating call checkout session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
