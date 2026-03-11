'use server'

import Stripe from 'stripe'
import { auth } from '@/auth'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  })
}

async function getUserProfile(): Promise<{ taxExempt: boolean; stripeCustomerId: string | null }> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL
    const sessionData = await auth()
    const token = sessionData?.accessToken
    if (!token || !apiUrl) return { taxExempt: false, stripeCustomerId: null }
    const res = await fetch(`${apiUrl}/api/v1/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return { taxExempt: false, stripeCustomerId: null }
    const { user } = await res.json()
    return { taxExempt: user.taxExempt ?? false, stripeCustomerId: user.stripeCustomerId ?? null }
  } catch {
    return { taxExempt: false, stripeCustomerId: null }
  }
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
      const isService = sub.productId.startsWith('service-')

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: sub.name,
          },
          unit_amount: Math.round(sub.price * 100),
          tax_behavior: 'exclusive',
          recurring: {
            interval,
          },
        },
        quantity: 1,
      }]

      const subscriptionMetadata: Record<string, string> = {
        userId,
        planId: sub.productId,
        billingPeriod: sub.billingPeriod || 'monthly',
      }
      if (isService) {
        // Extract service type from productId: "service-openclaw-monthly" → "openclaw"
        subscriptionMetadata.serviceType = sub.productId.replace(/^service-/, '').replace(/-(monthly|annual)$/, '')
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: lineItems,
        automatic_tax: { enabled: true },
        metadata: {
          userId,
          items: JSON.stringify(compactItems),
        },
        subscription_data: {
          metadata: subscriptionMetadata,
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
          tax_behavior: 'exclusive' as const,
        },
        quantity: item.quantity,
      })
    )

    // Tax exempt: pass Stripe Customer (with tax_exempt='exempt' set server-side) + keep automatic_tax
    // Stripe docs: "set Customer.tax_exempt='exempt' and pass customer ID to checkout session"
    const { taxExempt, stripeCustomerId } = await getUserProfile()
    console.log('[stripe.ts] getUserProfile:', { taxExempt, stripeCustomerId, userId })
    const customerParams: Partial<Stripe.Checkout.SessionCreateParams> =
      taxExempt && stripeCustomerId ? { customer: stripeCustomerId } : {}
    console.log('[stripe.ts] customerParams:', JSON.stringify(customerParams))

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      automatic_tax: { enabled: true },
      ...customerParams,
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
      const isService = sub.productId.startsWith('service-')

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: sub.name,
          },
          unit_amount: Math.round(sub.price * 100),
          tax_behavior: 'exclusive',
          recurring: {
            interval,
          },
        },
        quantity: 1,
      }]

      const subscriptionMetadata: Record<string, string> = {
        userId,
        planId: sub.productId,
        billingPeriod: sub.billingPeriod || 'monthly',
      }
      if (isService) {
        subscriptionMetadata.serviceType = sub.productId.replace(/^service-/, '').replace(/-(monthly|annual)$/, '')
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'subscription',
        ui_mode: 'embedded',
        line_items: lineItems,
        automatic_tax: { enabled: true },
        ...(email ? { customer_email: email } : {}),
        metadata: {
          userId,
          items: JSON.stringify(compactItems),
        },
        subscription_data: {
          metadata: subscriptionMetadata,
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
          tax_behavior: 'exclusive' as const,
        },
        quantity: item.quantity,
      })
    )

    // Tax exempt: pass Stripe Customer (with tax_exempt='exempt' set server-side) + keep automatic_tax
    const { taxExempt, stripeCustomerId } = await getUserProfile()
    console.log('[stripe.ts embedded] getUserProfile:', { taxExempt, stripeCustomerId, userId })
    const customerParams: Partial<Stripe.Checkout.SessionCreateParams> =
      taxExempt && stripeCustomerId
        ? { customer: stripeCustomerId }
        : email ? { customer_email: email } : {}
    console.log('[stripe.ts embedded] customerParams:', JSON.stringify(customerParams))

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      ui_mode: 'embedded',
      line_items: lineItems,
      automatic_tax: { enabled: true },
      ...customerParams,
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
