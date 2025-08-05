'use client'

import { useState } from 'react'
import { DEMO_MODE, DEMO_BANNER } from '@/lib/demo-config'

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(true)
  
  if (!DEMO_MODE || !DEMO_BANNER.show || !isVisible) {
    return null
  }
  
  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium"
      style={{ 
        backgroundColor: DEMO_BANNER.backgroundColor,
        color: DEMO_BANNER.textColor 
      }}
    >
      <div className="flex items-center justify-center gap-2">
        <span>{DEMO_BANNER.message}</span>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 text-xs underline hover:no-underline"
        >
          Hide
        </button>
      </div>
      <div className="text-xs mt-1 opacity-75">
        Test card: 4242 4242 4242 4242 | Email notifications shown on screen
      </div>
    </div>
  )
}