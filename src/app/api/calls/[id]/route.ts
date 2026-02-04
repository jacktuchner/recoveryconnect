import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { v4 as uuidv4 } from "uuid";

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

    const { data: call, error: fetchError } = await supabase
      .from("Call")
      .select("*, contributor:User!Call_contributorId_fkey(stripeConnectId, stripeConnectOnboarded)")
      .eq("id", id)
      .single();

    if (fetchError || !call) {
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

    const { data: updated, error } = await supabase
      .from("Call")
      .update({ status, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .select("*, patient:User!Call_patientId_fkey(*), contributor:User!Call_contributorId_fkey(*, profile:Profile(*))")
      .single();

    if (error) throw error;

    // If call is completed and contributor has Stripe Connect, create payout
    if (status === "COMPLETED" && call.contributor?.stripeConnectId && call.contributor?.stripeConnectOnboarded) {
      try {
        // Create a transfer to the contributor's Connect account
        const transfer = await stripe.transfers.create({
          amount: Math.round(call.contributorPayout * 100), // Convert to cents
          currency: "usd",
          destination: call.contributor.stripeConnectId,
          metadata: {
            callId: call.id,
            contributorId: call.contributorId,
            patientId: call.patientId,
          },
        });

        // Record the payout
        await supabase.from("Payment").insert({
          id: uuidv4(),
          userId: call.contributorId,
          type: "CONTRIBUTOR_PAYOUT",
          amount: call.contributorPayout,
          currency: "usd",
          status: "COMPLETED",
          stripePaymentId: transfer.id,
          metadata: { callId: call.id, transferId: transfer.id },
          createdAt: new Date().toISOString(),
        });

        console.log(`Payout created for call ${call.id}: $${call.contributorPayout}`);
      } catch (payoutError) {
        // Log but don't fail the call update
        console.error("Error creating payout:", payoutError);
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating call:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
