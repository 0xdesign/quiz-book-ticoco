'use client'

import { useEffect, useState } from 'react'

interface ExitIntentModalProps {
  bookId: string
  childName?: string
}

export function ExitIntentModal({ bookId, childName }: ExitIntentModalProps) {
  const [show, setShow] = useState(false)
  const [hasShown, setHasShown] = useState(false)

  useEffect(() => {
    // Only trigger exit intent on desktop (not mobile where mouse movement is unreliable)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) return

    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger when mouse moves to top of viewport (likely closing tab/window)
      if (e.clientY <= 0 && !hasShown) {
        setShow(true)
        setHasShown(true)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [hasShown])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl animate-fadeIn border-2 border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-5">👋</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Wait! Before you go...
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            Your story for <span className="font-bold text-blue-600">{childName || 'your child'}</span> is ready and waiting!
          </p>
        </div>

        {/* Common Concerns */}
        <div className="mb-8 space-y-4">
          <h3 className="font-bold text-gray-900 text-lg mb-4">We understand your concerns:</h3>
          <div className="flex items-start gap-3 bg-green-50 p-4 rounded-xl border border-green-200">
            <div className="text-green-600 font-bold text-xl flex-shrink-0">✓</div>
            <p className="text-base text-gray-800">
              <strong className="text-gray-900">Bank-level security</strong> — Stripe encryption protects your card details
            </p>
          </div>
          <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-xl border border-blue-200">
            <div className="text-blue-600 font-bold text-xl flex-shrink-0">✓</div>
            <p className="text-base text-gray-800">
              <strong className="text-gray-900">Instant delivery</strong> — Story arrives in your email within 2 minutes
            </p>
          </div>
          <div className="flex items-start gap-3 bg-purple-50 p-4 rounded-xl border border-purple-200">
            <div className="text-purple-600 font-bold text-xl flex-shrink-0">✓</div>
            <p className="text-base text-gray-800">
              <strong className="text-gray-900">100% satisfaction</strong> — Not happy? Contact us for a full refund
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setShow(false)}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-lg py-4 rounded-xl hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Complete My Purchase
          </button>
          <button
            onClick={() => setShow(false)}
            className="w-full text-gray-600 text-base font-medium hover:text-gray-800 transition-colors py-2"
          >
            I need more time
          </button>
        </div>
      </div>
    </div>
  )
}