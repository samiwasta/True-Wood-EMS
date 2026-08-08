'use client'

import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const INVENTORY_PASSWORD = 'TW-IS-001'
const STORAGE_KEY = 'inventory_unlocked'

type InventoryLockProps = {
  children: React.ReactNode
}

export function InventoryLock({ children }: InventoryLockProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      setUnlocked(sessionStorage.getItem(STORAGE_KEY) === 'true')
    } catch {
      setUnlocked(false)
    } finally {
      setChecking(false)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === INVENTORY_PASSWORD) {
      try {
        sessionStorage.setItem(STORAGE_KEY, 'true')
      } catch {
        // Ignore storage failures; unlock for this page visit anyway
      }
      setUnlocked(true)
      setError(null)
      setPassword('')
      return
    }
    setError('Incorrect password')
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        Checking access...
      </div>
    )
  }

  if (!unlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="p-3 bg-[#23887C]/10 rounded-lg">
              <Lock className="h-6 w-6 text-[#23887C]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Inventory Locked</h2>
            <p className="text-sm text-gray-500">
              Enter the inventory password to continue
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="inventory-password" className="text-sm font-medium text-gray-700 block">
                Password
              </label>
              <Input
                id="inventory-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError(null)
                }}
                className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1"
                placeholder="Enter password"
                autoFocus
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-[#23887C] hover:bg-[#23887C]/90 text-white"
              disabled={!password.trim()}
            >
              Unlock Inventory
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
