/**
 * Performance optimization utilities for mobile devices and 3G networks
 * Includes lazy loading, caching, and network-aware optimizations
 */

import { useState, useEffect } from 'react'

/**
 * Network connection type detection
 */
export interface NetworkInfo {
  type: 'slow' | 'fast' | 'unknown'
  effectiveType: string
  downlink: number
  rtt: number
}

export function useNetworkInfo(): NetworkInfo {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    type: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0
  })

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      
      const updateNetworkInfo = () => {
        const effectiveType = connection.effectiveType || 'unknown'
        const downlink = connection.downlink || 0
        const rtt = connection.rtt || 0
        
        // Classify as slow or fast
        const type = effectiveType === '2g' || effectiveType === 'slow-2g' || downlink < 1.5 ? 'slow' : 'fast'
        
        setNetworkInfo({
          type,
          effectiveType,
          downlink,
          rtt
        })
      }

      updateNetworkInfo()
      connection.addEventListener('change', updateNetworkInfo)
      
      return () => {
        connection.removeEventListener('change', updateNetworkInfo)
      }
    }
  }, [])

  return networkInfo
}

/**
 * Image optimization for different network conditions
 */
export interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  blur?: boolean
}

export function optimizeImageForNetwork(
  src: string, 
  networkType: 'slow' | 'fast' | 'unknown',
  options: ImageOptimizationOptions = {}
): string {
  // For slow networks, reduce quality and dimensions
  if (networkType === 'slow') {
    const params = new URLSearchParams()
    
    if (options.width) params.set('w', Math.min(options.width, 400).toString())
    if (options.height) params.set('h', Math.min(options.height, 400).toString())
    params.set('q', '50') // Lower quality for slow networks
    params.set('f', 'webp') // Use WebP for better compression
    
    return `${src}?${params.toString()}`
  }

  // For fast networks, use higher quality
  const params = new URLSearchParams()
  if (options.width) params.set('w', options.width.toString())
  if (options.height) params.set('h', options.height.toString())
  params.set('q', options.quality?.toString() || '80')
  params.set('f', options.format || 'webp')
  
  return `${src}?${params.toString()}`
}

/**
 * Lazy loading hook for components
 */
export function useLazyLoad(threshold = 0.1) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [ref, setRef] = useState<Element | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref, threshold])

  return [setRef, isIntersecting] as const
}

/**
 * Debounce hook for expensive operations
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Memory-efficient cache for API responses
 */
class LRUCache<K, V> {
  private capacity: number
  private cache: Map<K, V>

  constructor(capacity: number = 50) {
    this.capacity = capacity
    this.cache = new Map()
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key)!
      this.cache.delete(key)
      this.cache.set(key, value)
      return value
    }
    return undefined
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing
      this.cache.delete(key)
    } else if (this.cache.size >= this.capacity) {
      // Remove oldest (first item)
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
    
    this.cache.set(key, value)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// Global cache instances
export const apiCache = new LRUCache<string, any>(100)
export const imageCache = new LRUCache<string, string>(50)

/**
 * Network-aware API call wrapper
 */
export async function networkAwareAPICall<T>(
  url: string,
  options: RequestInit = {},
  networkInfo: NetworkInfo
): Promise<T> {
  // Check cache first
  const cacheKey = `${url}:${JSON.stringify(options)}`
  const cachedResponse = apiCache.get(cacheKey)
  
  if (cachedResponse) {
    return cachedResponse
  }

  // Adjust timeout based on network
  const timeout = networkInfo.type === 'slow' ? 30000 : 15000
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Cache successful responses
    apiCache.set(cacheKey, data)
    
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  // Preload fonts
  const fontLink = document.createElement('link')
  fontLink.rel = 'preload'
  fontLink.href = '/fonts/inter.woff2'
  fontLink.as = 'font'
  fontLink.type = 'font/woff2'
  fontLink.crossOrigin = 'anonymous'
  document.head.appendChild(fontLink)

  // Preload critical images
  const heroImage = new Image()
  heroImage.src = '/images/hero-mobile.webp'
  
  // Preload initial API endpoint
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      // Cache initial API responses
      fetch('/api/health').catch(() => {}) // Silent fail
    })
  }
}

/**
 * Service Worker registration for offline support
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration)
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError)
        })
    })
  }
}

/**
 * Progressive loading for form steps
 */
export function useProgressiveLoading(totalSteps: number, currentStep: number) {
  const [loadedSteps, setLoadedSteps] = useState(new Set([1]))

  useEffect(() => {
    // Preload next step
    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1
      if (!loadedSteps.has(nextStep)) {
        // Simulate component preloading
        const timer = setTimeout(() => {
          setLoadedSteps(prev => new Set([...prev, nextStep]))
        }, 500)
        
        return () => clearTimeout(timer)
      }
    }
  }, [currentStep, totalSteps, loadedSteps])

  return {
    isStepLoaded: (step: number) => loadedSteps.has(step),
    preloadStep: (step: number) => setLoadedSteps(prev => new Set([...prev, step]))
  }
}

/**
 * Touch-friendly interaction utilities
 */
export const touchUtils = {
  // Minimum touch target size (44px recommended)
  minTouchTarget: 44,
  
  // Touch event handlers that prevent 300ms delay
  fastClick: (handler: () => void) => ({
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault()
      handler()
    },
    onClick: handler // Fallback for non-touch devices
  }),
  
  // Swipe detection for mobile navigation
  useSwipeGesture: (
    onSwipeLeft?: () => void,
    onSwipeRight?: () => void,
    threshold = 50
  ) => {
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)

    const handleTouchStart = (e: React.TouchEvent) => {
      setTouchEnd(null)
      setTouchStart(e.targetTouches[0].clientX)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX)
    }

    const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return
      
      const distance = touchStart - touchEnd
      const isLeftSwipe = distance > threshold
      const isRightSwipe = distance < -threshold

      if (isLeftSwipe && onSwipeLeft) onSwipeLeft()
      if (isRightSwipe && onSwipeRight) onSwipeRight()
    }

    return {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  }
}

/**
 * Memory usage monitoring
 */
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  } | null>(null)

  useEffect(() => {
    if ('memory' in performance) {
      const updateMemoryInfo = () => {
        const memory = (performance as any).memory
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        })
      }

      updateMemoryInfo()
      const interval = setInterval(updateMemoryInfo, 5000)
      
      return () => clearInterval(interval)
    }
  }, [])

  return memoryInfo
}

/**
 * Battery-aware optimizations
 */
export function useBatteryOptimization() {
  const [batteryInfo, setBatteryInfo] = useState<{
    level: number
    charging: boolean
    lowBattery: boolean
  }>({
    level: 1,
    charging: true,
    lowBattery: false
  })

  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBatteryInfo = () => {
          const level = battery.level
          const charging = battery.charging
          const lowBattery = level < 0.2 && !charging

          setBatteryInfo({ level, charging, lowBattery })
        }

        updateBatteryInfo()
        battery.addEventListener('levelchange', updateBatteryInfo)
        battery.addEventListener('chargingchange', updateBatteryInfo)
        
        return () => {
          battery.removeEventListener('levelchange', updateBatteryInfo)
          battery.removeEventListener('chargingchange', updateBatteryInfo)
        }
      })
    }
  }, [])

  return batteryInfo
}

/**
 * Performance metrics collection
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()

  startTiming(name: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      if (!this.metrics.has(name)) {
        this.metrics.set(name, [])
      }
      
      this.metrics.get(name)!.push(duration)
      
      // Keep only last 100 measurements
      const measurements = this.metrics.get(name)!
      if (measurements.length > 100) {
        measurements.splice(0, measurements.length - 100)
      }
    }
  }

  getAverageTime(name: string): number {
    const measurements = this.metrics.get(name)
    if (!measurements || measurements.length === 0) return 0
    
    return measurements.reduce((sum, time) => sum + time, 0) / measurements.length
  }

  getMetrics(): Record<string, { avg: number, min: number, max: number, count: number }> {
    const result: Record<string, { avg: number, min: number, max: number, count: number }> = {}
    
    this.metrics.forEach((measurements, name) => {
      if (measurements.length > 0) {
        result[name] = {
          avg: measurements.reduce((sum, time) => sum + time, 0) / measurements.length,
          min: Math.min(...measurements),
          max: Math.max(...measurements),
          count: measurements.length
        }
      }
    })
    
    return result
  }

  clear(): void {
    this.metrics.clear()
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()