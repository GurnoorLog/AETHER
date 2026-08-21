import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { stripe, getPriceId, findOrCreateCustomer } from "@/lib/stripe";
import type { PlanTier } from "@/lib/stripe";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tier } = (await request.json()) as { tier?: string };

  if (!tier || !["pro", "unlimited"].includes(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("stripe_customer_id, email")
    .eq("user_id", user.id)
    .single();

  const email = profile?.email ?? user.email ?? "";
  const customer = await findOrCreateCustomer(user.id, email, profile?.stripe_customer_id);

  await supabase
    .from("user_profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("user_id", user.id);

  const priceId = await getPriceId(tier as PlanTier);
  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}`,
    metadata: { user_id: user.id, tier },
    subscription_data: { metadata: { user_id: user.id, tier } },
  });

  return NextResponse.json({ url: session.url });
}
