import { MapPin } from 'lucide-react'

interface YesterdayLocationChipProps {
  label: string
  className: string
}

export function YesterdayLocationChip({ label, className }: YesterdayLocationChipProps) {
  return (
    <span
      title={`Yesterday at ${label}`}
      className={`inline-flex w-[240px] items-start gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium ${className}`}
    >
      <MapPin className="mt-0.5 h-3 w-3 shrink-0 opacity-90" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-tight">
        <span className="text-[10px] font-normal opacity-75">Yesterday at</span>
        <span className="truncate text-xs font-semibold">{label}</span>
      </span>
    </span>
  )
}
