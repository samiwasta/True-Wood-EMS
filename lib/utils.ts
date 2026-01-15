import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\+91\s*/g, '').replace(/\D/g, '')
  return cleaned
}

export function formatPhoneNumberForDisplay(phone: string | null | undefined): string {
  if (!phone) return '-'
  const digitsOnly = normalizePhoneNumber(phone)
  if (digitsOnly.length === 10) {
    return `+91 ${digitsOnly}`
  }
  return phone
}

export function formatPhoneNumberForInput(phone: string | null | undefined): string {
  if (!phone) return ''
  const digitsOnly = normalizePhoneNumber(phone)
  if (digitsOnly.length === 10) {
    return `+91 ${digitsOnly}`
  }
  return digitsOnly
}

export function validatePhoneNumber(phone: string): boolean {
  if (!phone || !phone.trim()) {
    return true
  }
  const digitsOnly = normalizePhoneNumber(phone)
  return digitsOnly.length === 10
}
