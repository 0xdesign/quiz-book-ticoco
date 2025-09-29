/**
 * TrustBadges Component
 * Displays trust signals appropriate to context (homepage vs checkout)
 */

interface TrustBadgesProps {
  context: 'homepage' | 'checkout'
  className?: string
}

export function TrustBadges({ context, className = '' }: TrustBadgesProps) {
  if (context === 'checkout') {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-4 ${className}`}>
        {/* Stripe Badge */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-16 h-8 bg-gradient-to-r from-purple-600 to-blue-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">stripe</span>
          </div>
          <span>Secure</span>
        </div>

        {/* SSL Badge */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span>SSL Encrypted</span>
        </div>

        {/* Card Logos */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-7 bg-white border border-gray-200 rounded flex items-center justify-center">
            <span className="text-xs font-bold text-blue-700">VISA</span>
          </div>
          <div className="w-10 h-7 bg-white border border-gray-200 rounded flex items-center justify-center">
            <span className="text-xs font-bold text-orange-600">MC</span>
          </div>
          <div className="w-10 h-7 bg-white border border-gray-200 rounded flex items-center justify-center">
            <span className="text-xs font-bold text-blue-600">AMEX</span>
          </div>
        </div>
      </div>
    )
  }

  // Homepage badges (already implemented via emojis in homepage, but this provides structured version)
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${className}`}>
      <div className="text-center">
        <div className="text-3xl mb-2">🔒</div>
        <h4 className="font-semibold text-gray-800 text-sm">Secure Payment</h4>
        <p className="text-xs text-gray-600">Powered by Stripe</p>
      </div>
      <div className="text-center">
        <div className="text-3xl mb-2">🛡️</div>
        <h4 className="font-semibold text-gray-800 text-sm">COPPA Compliant</h4>
        <p className="text-xs text-gray-600">Privacy protected</p>
      </div>
      <div className="text-center">
        <div className="text-3xl mb-2">⚡</div>
        <h4 className="font-semibold text-gray-800 text-sm">Instant Delivery</h4>
        <p className="text-xs text-gray-600">No shipping wait</p>
      </div>
      <div className="text-center">
        <div className="text-3xl mb-2">💯</div>
        <h4 className="font-semibold text-gray-800 text-sm">Satisfaction</h4>
        <p className="text-xs text-gray-600">Love it or regenerate</p>
      </div>
    </div>
  )
}