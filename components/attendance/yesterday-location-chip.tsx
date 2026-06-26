import { MapPin } from 'lucide-react'

interface YesterdayLocationChipProps {
  label: string
  className: string
}

export function YesterdayLocationChip({ label, className }: YesterdayLocationChipProps) {
  return (
    <span
      title={`Yesterday At: ${label}`}
      className={`inline-flex w-[240px] items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium leading-none ${className}`}
    >
      <MapPin className="h-3 w-3 shrink-0 opacity-90" />
      <span className="min-w-0 flex-1 truncate">
        <span className="opacity-80">Yesterday At: </span>
        <span className="font-semibold">{label}</span>
      </span>
    </span>
  )
}
