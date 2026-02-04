import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

// GET - Get Stripe Express dashboard link
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, string>).id;

    const { data: user, error } = await supabase
      .from("User")
      .select("stripeConnectId, stripeConnectOnboarded")
      .eq("id", userId)
      .single();

    if (error) throw error;

    if (!user?.stripeConnectId) {
      return NextResponse.json(
        { error: "Connect account not found" },
        { status: 404 }
      );
    }

    if (!user.stripeConnectOnboarded) {
      return NextResponse.json(
        { error: "Connect account not fully onboarded" },
        { status: 400 }
      );
    }

    // Create login link for Express dashboard
    const loginLink = await stripe.accounts.createLoginLink(user.stripeConnectId);

    return NextResponse.json({ url: loginLink.url });
  } catch (error) {
    console.error("Error creating dashboard link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
