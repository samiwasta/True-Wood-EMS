import { MapPin } from 'lucide-react'

interface YesterdayLocationChipProps {
  label: string
  className: string
}

export function YesterdayLocationChip({ label, className }: YesterdayLocationChipProps) {
  return (
    <span
      title={`Yesterday at ${label}`}
      className={`inline-flex w-fit max-w-[240px] items-center gap-1 rounded-full py-0.5 pl-1.5 pr-2.5 text-[11px] font-medium leading-none ${className}`}
    >
      <MapPin className="h-3 w-3 shrink-0 opacity-90" />
      <span className="opacity-80">Yesterday at</span>
      <span className="truncate font-semibold">{label}</span>
    </span>
  )
}
