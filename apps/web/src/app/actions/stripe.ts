'use server'

import Stripe from 'stripe'
import { auth } from '@/auth'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  })
}

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  type?: 'product' | 'subscription'
  billingPeriod?: 'monthly' | 'annual'
}

export async function createCheckoutSession(
  items: CartItem[],
  _userId?: string
): Promise<{ url?: string; error?: string }> {
  if (!items.length) {
    return { error: 'Cart is empty' }
  }

  // Server-side auth verification — always use server-side session userId
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Unauthorized' }
  }
  const userId = session.user.id

  try {
    const stripe = getStripe()
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'

    const subscriptionItems = items.filter((i) => i.type === 'subscription')
    const productItems = items.filter((i) => i.type !== 'subscription')

    // Can't mix subscriptions and products in the same Stripe Checkout session
    if (subscriptionItems.length > 0 && productItems.length > 0) {
      return { error: 'Please checkout subscriptions and products separately' }
    }

    const isSubscription = subscriptionItems.length > 0

    const compactItems = items.map((i) => ({
      productId: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      type: i.type,
      billingPeriod: i.billingPeriod,
    }))

    if (isSubscription) {
      const sub = subscriptionItems[0]!
      const interval: 'month' | 'year' = sub.billingPeriod === 'annual' ? 'year' : 'month'

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: sub.name,
          },
          unit_amount: Math.round(sub.price * 100),
          recurring: {
            interval,
          },
        },
        quantity: 1,
      }]

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: lineItems,
        metadata: {
          userId,
          items: JSON.stringify(compactItems),
        },
        subscription_data: {
          metadata: {
            userId,
            planId: sub.productId,
            billingPeriod: sub.billingPeriod || 'monthly',
          },
        },
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/checkout/cancel`,
      })

      return { url: session.url! }
    }

    // One-time payment for products
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = productItems.map(
      (item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            ...(item.image ? { images: [item.image] } : {}),
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })
    )

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      metadata: {
        userId,
        items: JSON.stringify(compactItems),
      },
      payment_intent_data: {
        metadata: {
          userId,
          items: JSON.stringify(compactItems),
        },
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
    })

    return { url: session.url! }
  } catch (err) {
    console.error('Stripe checkout session error:', err)
    return { error: 'Failed to create checkout session' }
  }
}

export async function createEmbeddedCheckoutSession(
  items: CartItem[],
  _userId?: string,
  userEmail?: string
): Promise<{ clientSecret?: string; error?: string }> {
  if (!items.length) {
    return { error: 'Cart is empty' }
  }

  // Always use server-side session userId to ensure FK integrity
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Unauthorized' }
  }
  const userId = session.user.id
  const email = userEmail || session.user.email || undefined

  try {
    const stripe = getStripe()
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'

    const subscriptionItems = items.filter((i) => i.type === 'subscription')
    const productItems = items.filter((i) => i.type !== 'subscription')

    if (subscriptionItems.length > 0 && productItems.length > 0) {
      return { error: 'Please checkout subscriptions and products separately' }
    }

    const isSubscription = subscriptionItems.length > 0

    const compactItems = items.map((i) => ({
      productId: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      type: i.type,
      billingPeriod: i.billingPeriod,
    }))

    if (isSubscription) {
      const sub = subscriptionItems[0]!
      const interval: 'month' | 'year' = sub.billingPeriod === 'annual' ? 'year' : 'month'

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: sub.name,
          },
          unit_amount: Math.round(sub.price * 100),
          recurring: {
            interval,
          },
        },
        quantity: 1,
      }]

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'subscription',
        ui_mode: 'embedded',
        line_items: lineItems,
        ...(email ? { customer_email: email } : {}),
        metadata: {
          userId,
          items: JSON.stringify(compactItems),
        },
        subscription_data: {
          metadata: {
            userId,
            planId: sub.productId,
            billingPeriod: sub.billingPeriod || 'monthly',
          },
        },
        return_url: `${baseUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      })

      return { clientSecret: checkoutSession.client_secret! }
    }

    // One-time payment for products
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = productItems.map(
      (item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            ...(item.image ? { images: [item.image] } : {}),
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })
    )

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      ui_mode: 'embedded',
      line_items: lineItems,
      ...(email ? { customer_email: email } : {}),
      metadata: {
        userId,
        items: JSON.stringify(compactItems),
      },
      payment_intent_data: {
        metadata: {
          userId,
          items: JSON.stringify(compactItems),
        },
      },
      return_url: `${baseUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    })

    return { clientSecret: checkoutSession.client_secret! }
  } catch (err) {
    console.error('Stripe embedded checkout session error:', err)
    return { error: 'Failed to create checkout session' }
  }
}
