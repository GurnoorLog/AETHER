import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const tier = session.metadata?.tier;
        if (!userId || !tier) break;

        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
        let currentPeriodEnd: string | null = null;
        let priceId: string | null = null;

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const firstItem = sub.items.data[0];
          if (firstItem) {
            currentPeriodEnd = new Date(firstItem.current_period_end * 1000).toISOString();
            priceId = firstItem.price.id;
          }
        }

        await admin
          .from("user_profiles")
          .update({
            subscription_tier: tier,
            subscription_status: "active",
            stripe_price_id: priceId,
            current_period_end: currentPeriodEnd,
          })
          .eq("user_id", userId);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        if (!userId) break;

        const firstItem = subscription.items.data[0];
        const priceId = firstItem?.price?.id;
        const tier = firstItem?.price?.metadata?.tier;

        const statusMap: Record<string, string> = {
          active: "active",
          past_due: "past_due",
          canceled: "canceled",
          unpaid: "past_due",
          trialing: "active",
        };

        await admin
          .from("user_profiles")
          .update({
            subscription_status: statusMap[subscription.status] ?? subscription.status,
            ...(tier ? { subscription_tier: tier } : {}),
            stripe_price_id: priceId,
            ...(firstItem
              ? { current_period_end: new Date(firstItem.current_period_end * 1000).toISOString() }
              : {}),
          })
          .eq("user_id", userId);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        if (!userId) break;

        await admin
          .from("user_profiles")
          .update({
            subscription_tier: "free",
            subscription_status: "canceled",
            stripe_price_id: null,
          })
          .eq("user_id", userId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;
        if (!customerId) break;

        await admin
          .from("user_profiles")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;
        if (!customerId) break;

        const subscriptionId = invoice.parent?.subscription_details?.subscription;
        const subId = typeof subscriptionId === "string"
          ? subscriptionId
          : subscriptionId?.id;

        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const firstItem = sub.items.data[0];
          const tier = firstItem?.price?.metadata?.tier;
          await admin
            .from("user_profiles")
            .update({
              subscription_status: "active",
              ...(firstItem
                ? { current_period_end: new Date(firstItem.current_period_end * 1000).toISOString() }
                : {}),
              ...(tier ? { subscription_tier: tier } : {}),
            })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
}
