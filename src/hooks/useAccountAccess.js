import { useAuth } from '@clerk/react'
import { useEffect, useMemo, useState } from 'react'
import { freeDemoAccess } from '../data/access.js'
import { apiUrl } from '../lib/api.js'

async function readJsonResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }

  const body = await response.text()
  console.warn('Expected JSON from account access endpoint.', {
    status: response.status,
    contentType,
    preview: body.slice(0, 120),
  })
  throw new Error('We could not reach the account server. Refresh the page or try again shortly.')
}

export function useAccountAccess() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [access, setAccess] = useState(freeDemoAccess)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadAccess() {
      if (!isLoaded) return
      if (!isSignedIn) {
        setAccess(freeDemoAccess)
        setError('')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        const token = await getToken()
        const response = await fetch(apiUrl('/api/me/access'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        })
        const result = await readJsonResponse(response)
        if (cancelled) return
        if (!response.ok || !result?.ok) {
          throw new Error(result?.error || 'Could not load account access.')
        }
        setAccess(result.access || freeDemoAccess)
      } catch (loadError) {
        if (cancelled) return
        setAccess(freeDemoAccess)
        setError(loadError?.message || 'Could not load account access.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadAccess()

    return () => {
      cancelled = true
    }
  }, [getToken, isLoaded, isSignedIn])

  return useMemo(
    () => ({
      access,
      error,
      isLoaded,
      isSignedIn: Boolean(isSignedIn),
      loading,
    }),
    [access, error, isLoaded, isSignedIn, loading],
  )
}
