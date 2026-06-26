interface YesterdayLocationChipProps {
  label: string
  className: string
}

export function YesterdayLocationChip({ label, className }: YesterdayLocationChipProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap shadow-sm ${className}`}
    >
      Yesterday At: {label}
    </span>
  )
}
