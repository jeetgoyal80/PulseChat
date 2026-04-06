import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

import { useAuth } from '@/context/AuthContext'
import { SOCKET_BASE_URL } from '@/lib/api'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { clearAuthState, isAuthenticated } = useAuth()
  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [socketError, setSocketError] = useState('')

  if (!socketRef.current) {
    socketRef.current = io(SOCKET_BASE_URL, {
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })
  }

  useEffect(() => {
    const socket = socketRef.current

    const handleConnect = () => {
      setIsConnected(true)
      setSocketError('')
    }

    const handleDisconnect = () => {
      setIsConnected(false)
    }

    const handleConnectError = (error) => {
      setIsConnected(false)
      setSocketError(error.message)

      if (error.message?.toLowerCase().includes('unauthorized')) {
        clearAuthState()
      }
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
    }
  }, [clearAuthState])

  useEffect(() => {
    const socket = socketRef.current

    if (isAuthenticated) {
      socket.connect()
      return undefined
    }

    setIsConnected(false)
    setSocketError('')
    socket.disconnect()

    return undefined
  }, [isAuthenticated])

  useEffect(
    () => () => {
      socketRef.current?.disconnect()
    },
    []
  )

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        socketError,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)

  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }

  return context
}
