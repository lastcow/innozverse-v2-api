import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BillingPeriod = 'monthly' | 'annual'

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  description?: string
  type?: 'product' | 'subscription'
  billingPeriod?: BillingPeriod
  monthlyPrice?: number
  annualPrice?: number
  planId?: string
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  updateBillingPeriod: (billingPeriod: BillingPeriod) => void
  clearCart: () => void
  totalItems: () => number
  subtotal: () => number
  hasSubscription: () => boolean
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          // For subscriptions, replace any existing subscription
          if (item.type === 'subscription') {
            const withoutSubs = state.items.filter((i) => i.type !== 'subscription')
            return { items: [...withoutSubs, { ...item, quantity: 1 }] }
          }

          const existing = state.items.find((i) => i.productId === item.productId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: 1 }] }
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.productId !== productId) }
          }
          return {
            items: state.items.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            ),
          }
        }),

      updateBillingPeriod: (billingPeriod) =>
        set((state) => ({
          items: state.items.map((i) => {
            if (i.type !== 'subscription') return i
            const newPrice = billingPeriod === 'annual'
              ? (i.annualPrice ?? i.price)
              : (i.monthlyPrice ?? i.price)
            return {
              ...i,
              billingPeriod,
              price: newPrice,
              productId: i.planId
                ? `plan-${i.planId}-${billingPeriod}`
                : i.productId,
              name: i.planId
                ? `${i.name.replace(/ \((?:Annual|Monthly)\)$/, '')} (${billingPeriod === 'annual' ? 'Annual' : 'Monthly'})`
                : i.name,
            }
          }),
        })),

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      hasSubscription: () => get().items.some((i) => i.type === 'subscription'),
    }),
    {
      name: 'innozverse-cart',
    }
  )
)
