'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import posthog from 'posthog-js'
import { useAuth, useUser } from '@clerk/nextjs'

export function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isSignedIn, userId } = useAuth()
  const { user } = useUser()

  // Track pageviews
  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture('$pageview', {
        $current_url: url,
      })
    }
  }, [pathname, searchParams])

  // Identify Clerk users in PostHog
  useEffect(() => {
    if (isSignedIn && userId && user && !posthog._isIdentified()) {
      posthog.identify(userId, {
        email: user.primaryEmailAddress?.emailAddress,
        username: user.username,
      })
    }

    if (!isSignedIn && posthog._isIdentified()) {
      posthog.reset()
    }
  }, [posthog, user, isSignedIn, userId])

  return null
}
