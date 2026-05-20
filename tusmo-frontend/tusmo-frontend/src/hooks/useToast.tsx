

import { useState, useCallback, useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

let counter = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++counter
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  return { toasts, show }
}

export function ToastContainer({ toasts }: { toasts: ReturnType<typeof useToast>['toasts'] }) {
  if (toasts.length === 0) return null
  const last = toasts[toasts.length - 1]
  return (
    <div className={`toast ${last.type}`}>
      {last.message}
    </div>
  )
}
