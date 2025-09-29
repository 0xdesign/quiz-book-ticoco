import CheckoutClient from './checkout-client'

// Generate static params (none for dynamic route)
export async function generateStaticParams() {
  // Return empty array for static export; pages generated on-demand
  return []
}

export const dynamic = 'force-static'

export default function CheckoutPage() {
  return <CheckoutClient />
}
