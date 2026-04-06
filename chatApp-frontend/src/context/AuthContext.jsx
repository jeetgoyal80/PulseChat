import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import api, { getErrorMessage } from '@/lib/api'

const AUTH_STORAGE_KEY = 'pulse-auth-state'

const AuthContext = createContext(null)

function getInitialState() {
  if (typeof window === 'undefined') {
    return {
      user: null,
      pendingVerification: null,
      passwordResetRequest: null,
    }
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)

    if (!raw) {
      return {
        user: null,
        pendingVerification: null,
        passwordResetRequest: null,
      }
    }

    const parsed = JSON.parse(raw)

    return {
      user: parsed.user ?? null,
      pendingVerification: parsed.pendingVerification ?? null,
      passwordResetRequest: parsed.passwordResetRequest ?? null,
    }
  } catch {
    return {
      user: null,
      pendingVerification: null,
      passwordResetRequest: null,
    }
  }
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(getInitialState)
  const [isProcessing, setIsProcessing] = useState(false)
  const [authError, setAuthError] = useState('')
  const userRef = useRef(authState.user)

  useEffect(() => {
    userRef.current = authState.user
  }, [authState.user])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState))
  }, [authState])

  const clearAuthState = useCallback(() => {
    setAuthState((current) => ({
      ...current,
      user: null,
    }))
  }, [])

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status

        if ((status === 401 || status === 403) && userRef.current) {
          clearAuthState()
        }

        return Promise.reject(error)
      }
    )

    return () => {
      api.interceptors.response.eject(interceptor)
    }
  }, [clearAuthState])

  const runAuthRequest = useCallback(async (request) => {
    setIsProcessing(true)
    setAuthError('')

    try {
      return await request()
    } catch (error) {
      const message = getErrorMessage(error, 'Something went wrong. Please try again.')
      setAuthError(message)
      throw new Error(message)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const register = useCallback(
    async ({ name, email, password }) => {
      const response = await runAuthRequest(() =>
        api.post('/auth/register', { name, email, password })
      )

      setAuthState((current) => ({
        ...current,
        pendingVerification: {
          email,
          name,
        },
      }))

      return response.data
    },
    [runAuthRequest]
  )

  const verifyEmail = useCallback(
    async ({ email, otp }) => {
      const response = await runAuthRequest(() =>
        api.post('/auth/verify-email', { email, otp })
      )

      setAuthState((current) => ({
        ...current,
        user: response.data.user,
        pendingVerification: null,
      }))

      return response.data
    },
    [runAuthRequest]
  )

  const login = useCallback(
    async ({ email, password }) => {
      const response = await runAuthRequest(() =>
        api.post('/auth/login', { email, password })
      )

      setAuthState((current) => ({
        ...current,
        user: response.data.user,
      }))

      return response.data
    },
    [runAuthRequest]
  )

  const forgotPassword = useCallback(
    async ({ email }) => {
      const response = await runAuthRequest(() =>
        api.post('/auth/forgot-password', { email })
      )

      setAuthState((current) => ({
        ...current,
        passwordResetRequest: {
          email,
        },
      }))

      return response.data
    },
    [runAuthRequest]
  )

  const resetPassword = useCallback(
    async ({ email, otp, newPassword }) => {
      const response = await runAuthRequest(() =>
        api.post('/auth/reset-password', { email, otp, newPassword })
      )

      setAuthState((current) => ({
        ...current,
        passwordResetRequest: null,
      }))

      return response.data
    },
    [runAuthRequest]
  )

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Clear local auth state even if the backend session is already gone.
    } finally {
      setAuthState({
        user: null,
        pendingVerification: null,
        passwordResetRequest: null,
      })
    }
  }, [])

  const clearPendingVerification = useCallback(() => {
    setAuthState((current) => ({
      ...current,
      pendingVerification: null,
    }))
  }, [])

  const clearPasswordResetRequest = useCallback(() => {
    setAuthState((current) => ({
      ...current,
      passwordResetRequest: null,
    }))
  }, [])

  const value = useMemo(
    () => ({
      user: authState.user,
      pendingVerification: authState.pendingVerification,
      passwordResetRequest: authState.passwordResetRequest,
      isAuthenticated: Boolean(authState.user?.id),
      isProcessing,
      authError,
      setAuthError,
      register,
      verifyEmail,
      login,
      forgotPassword,
      resetPassword,
      logout,
      clearAuthState,
      clearPendingVerification,
      clearPasswordResetRequest,
    }),
    [
      authError,
      authState.passwordResetRequest,
      authState.pendingVerification,
      authState.user,
      clearAuthState,
      clearPasswordResetRequest,
      clearPendingVerification,
      forgotPassword,
      isProcessing,
      login,
      logout,
      register,
      resetPassword,
      verifyEmail,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
