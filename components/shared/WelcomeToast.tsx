'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function WelcomeToast({ isNew }: { isNew: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (!isNew) return
    toast.success('Welcome to Pushback! Your account is ready.')
    // Remove ?welcome=1 from the URL without a full navigation
    router.replace('/dashboard', { scroll: false })
  }, [isNew, router])

  return null
}
