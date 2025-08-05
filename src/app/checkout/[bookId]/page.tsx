import CheckoutClient from './checkout-client'

// Generate static params for demo books
export async function generateStaticParams() {
  // Return empty array for static export
  // In demo mode, pages will be generated on-demand
  return []
}

export const dynamic = 'force-static'

export default function CheckoutPage() {
  return <CheckoutClient />
}