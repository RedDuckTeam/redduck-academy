import { useEffect, useState } from 'react'

export function useLocalStorageState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(key)
      if (saved !== null) setValue(JSON.parse(saved) as T)
    } catch {}
    setIsHydrated(true)
  }, [key])

  useEffect(() => {
    if (!isHydrated) return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }, [key, value, isHydrated])

  const clear = () => {
    try {
      window.localStorage.removeItem(key)
    } catch {}
  }

  return { value, setValue, clear, isHydrated }
}
