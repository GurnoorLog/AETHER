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
  const cached = priceCache.get(tier);
  if (cached) return cached;

  const plan = PLANS[tier];

  const products = await stripe.products.list({ limit: 100 });
  const product = products.data.find((p) => p.name === plan.name);

  if (product) {
    const prices = await stripe.prices.list({
      product: product.id,
      type: "recurring",
      limit: 10,
    });
    const existing = prices.data.find(
      (p) => p.unit_amount === plan.price && p.recurring?.interval === plan.interval
    );
    if (existing) {
      priceCache.set(tier, existing.id);
      return existing.id;
    }
  }

  const newProduct = product ?? (await stripe.products.create({
    name: plan.name,
    metadata: { tier },
  }));

  const price = await stripe.prices.create({
    product: newProduct.id,
    unit_amount: plan.price,
    currency: "usd",
    recurring: { interval: plan.interval },
    metadata: { tier },
  });

  priceCache.set(tier, price.id);
  return price.id;
}

export function tierFromPriceId(priceId: string): PlanTier | null {
  for (const [tier] of Object.entries(PLANS)) {
    const cached = priceCache.get(tier as PlanTier);
    if (cached === priceId) return tier as PlanTier;
  }
  return null;
}

export async function findOrCreateCustomer(
  userId: string,
  email: string,
  existingCustomerId?: string | null
): Promise<Stripe.Customer> {
  if (existingCustomerId) {
    const customer = await stripe.customers.retrieve(existingCustomerId);
    if (!customer.deleted) return customer;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  });

  return customer;
}
