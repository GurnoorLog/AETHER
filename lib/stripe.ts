import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-07-29.dahlia",
  typescript: true,
});

const PLANS = {
  pro: { name: "Aether Pro", price: 1200, interval: "month" as const },
  unlimited: { name: "Aether Unlimited", price: 2900, interval: "month" as const },
} as const;

export type PlanTier = keyof typeof PLANS;

const priceCache = new Map<PlanTier, string>();

export async function getPriceId(tier: PlanTier): Promise<string> {
  const hit = priceCache.get(tier);
  if (hit) return hit;

  const p = PLANS[tier];

  const prods = await stripe.products.list({ limit: 100 });
  const prod = prods.data.find((x) => x.name === p.name);

  if (prod) {
    const prs = await stripe.prices.list({
      product: prod.id,
      type: "recurring",
      limit: 10,
    });
    const match = prs.data.find(
      (x) => x.unit_amount === p.price && x.recurring?.interval === p.interval
    );
    if (match) {
      priceCache.set(tier, match.id);
      return match.id;
    }
  }

  const newProd = prod ?? (await stripe.products.create({
    name: p.name,
    metadata: { tier },
  }));

  const priceRec = await stripe.prices.create({
    product: newProd.id,
    unit_amount: p.price,
    currency: "usd",
    recurring: { interval: p.interval },
    metadata: { tier },
  });

  priceCache.set(tier, priceRec.id);
  return priceRec.id;
}

export function tierFromPriceId(priceId: string): PlanTier | null {
  for (const [tier] of Object.entries(PLANS)) {
    const hit = priceCache.get(tier as PlanTier);
    if (hit === priceId) return tier as PlanTier;
  }
  return null;
}

export async function findOrCreateCustomer(
  userId: string,
  email: string,
  existingCustomerId?: string | null
): Promise<Stripe.Customer> {
  if (existingCustomerId) {
    const cust = await stripe.customers.retrieve(existingCustomerId);
    if (!cust.deleted) return cust;
  }

  const cust = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  });

  return cust;
}
