'use client'

import { useEffect, useRef, useState } from 'react'

// Slide-and-fade reveal on scroll. Client component because IntersectionObserver
// is a browser API. Renders children server-side (any children — server or
// client) and only adds the transform once the wrapper crosses the viewport.
//
// Critical a11y: respects prefers-reduced-motion. Users with the OS-level
// reduce-motion preference get the final state immediately, no transform.
interface ScrollRevealProps {
  children: React.ReactNode
  direction?: 'left' | 'right' | 'up'
  /** Translation distance in pixels before reveal. Default 40px. */
  distance?: number
  /** Delay before transition starts, in ms. Default 0. */
  delay?: number
  /** IntersectionObserver threshold — fraction of element visible to fire. Default 0.15. */
  threshold?: number
  className?: string
  /** Wrapper element. Default 'div'. Use 'li' inside <ol>, etc. */
  as?: 'div' | 'li' | 'section'
}

export default function ScrollReveal({
  children,
  direction = 'up',
  distance = 40,
  delay = 0,
  threshold = 0.15,
  className = '',
  as = 'div',
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [reduced, threshold])

  const hiddenTransform =
    direction === 'left'
      ? `translateX(-${distance}px)`
      : direction === 'right'
      ? `translateX(${distance}px)`
      : `translateY(${distance}px)`

  const style: React.CSSProperties = reduced
    ? {}
    : {
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : hiddenTransform,
        transition: `opacity 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: visible ? 'auto' : 'opacity, transform',
      }

  const Tag = as
  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement & HTMLLIElement & HTMLElement>}
      className={className}
      style={style}
    >
      {children}
    </Tag>
  )
}
