import { redirect } from 'next/navigation'

export default function OrdersPage() {
  redirect('/user/purchase-history')
}
