import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      const userId = subscription.metadata.supabase_user_id

      await supabase.from('subscriptions').upsert({
        id: subscription.id,
        user_id: userId,
        status: subscription.status,
        plan: 'pro',
        stripe_customer_id: subscription.customer as string,
        updated_at: new Date().toISOString(),
      })
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata.supabase_user_id

      await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          plan: 'free',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
