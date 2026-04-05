import Stripe from 'stripe'

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
  })
}

// Alias for convenience — only call from request handlers, not module scope
export const stripe = {
  get customers() { return getStripe().customers },
  get checkout() { return getStripe().checkout },
  get billingPortal() { return getStripe().billingPortal },
  get webhooks() { return getStripe().webhooks },
  get subscriptions() { return getStripe().subscriptions },
}

export const PLANS = {
  free: {
    name: 'Free',
    monitors: 1,
    scanInterval: '24h',
    emailAlerts: false,
  },
  pro: {
    name: 'Pro',
    price: 9.99,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    monitors: -1, // unlimited
    scanInterval: '15min',
    emailAlerts: true,
  },
}
