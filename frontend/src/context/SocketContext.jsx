import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef  = useRef(null)
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!user) return

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token: localStorage.getItem('ftp_token') },
      transports: ['websocket'],
    })

    socketRef.current = socket

    socket.on('connect',    () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    // Listen for real-time notifications
    socket.on('notification', (msg) => {
      setNotifications(prev => [msg, ...prev].slice(0, 50))
    })

    socket.on('batch:verified', (data) => {
      setNotifications(prev => [
        { type: 'verified', message: `Batch ${data.batchId} has been verified`, time: new Date() },
        ...prev,
      ].slice(0, 50))
    })

    socket.on('batch:rejected', (data) => {
      setNotifications(prev => [
        { type: 'rejected', message: `Batch ${data.batchId} was rejected: ${data.reason}`, time: new Date() },
        ...prev,
      ].slice(0, 50))
    })

    socket.on('complaint:new', (data) => {
      setNotifications(prev => [
        { type: 'complaint', message: `New complaint on batch ${data.batchId}`, time: new Date() },
        ...prev,
      ].slice(0, 50))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user])

  const emit = (event, data) => {
    socketRef.current?.emit(event, data)
  }

  const clearNotifications = () => setNotifications([])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, notifications, emit, clearNotifications }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
