import Stripe from "stripe";

// Lazy singleton — initialised on first use, not at module load time.
// This prevents build failures when STRIPE_SECRET_KEY isn't set in the
// build environment (e.g. Vercel build phase before env vars are configured).
let _stripe: Stripe | undefined;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

// Proxy so existing call sites (`stripe.checkout...` etc.) keep working unchanged
export const stripe = new Proxy({} as Stripe, {
  get(_, prop: string | symbol) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
