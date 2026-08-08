'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { VendorMaterialService } from '@/lib/services/vendor-material.service'
import { useMaterials } from '@/lib/hooks/useMaterials'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { throttle } from '@/lib/hooks/useThrottle'
import { Material, VendorPriceBreakdown } from '@/lib/models/inventory.model'
import {
  formatINR,
  getMaterialUnitLabel,
  resolveRelation,
} from '@/lib/utils/inventory.utils'
import { Search, Phone, TrendingDown, BarChart3, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function InventorySearch() {
  const { materials } = useMaterials()

  const [materialName, setMaterialName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [results, setResults] = useState<VendorPriceBreakdown[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(materialName, 300)

  const activeMaterials = useMemo(
    () => materials.filter((material) => material.is_active !== false),
    [materials]
  )

  const suggestions = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase()
    if (query.length < 1) return []

    return activeMaterials
      .filter((material) => {
        const category = resolveRelation(material.category)
        return (
          material.name.toLowerCase().includes(query) ||
          (category?.name || '').toLowerCase().includes(query)
        )
      })
      .slice(0, 8)
  }, [activeMaterials, debouncedQuery])

  useEffect(() => {
    setHighlightedIndex(-1)
  }, [suggestions])

  const summary = useMemo(() => {
    if (results.length === 0) return null
    const totals = results.map((row) => row.total)
    const lowest = Math.min(...totals)
    const highest = Math.max(...totals)
    const average = totals.reduce((sum, value) => sum + value, 0) / totals.length
    const best = results.reduce(
      (current, row) => (row.total < current.total ? row : current),
      results[0]
    )
    return {
      count: results.length,
      lowest,
      highest,
      average,
      savings: highest - lowest,
      bestVendor: best.vendor_name,
    }
  }, [results])

  const runSearch = useCallback(async (name: string, qtyValue: string) => {
    const qty = parseFloat(qtyValue)
    if (!name.trim()) {
      setError('Enter a material name')
      return
    }
    if (Number.isNaN(qty) || qty <= 0) {
      setError('Enter a quantity greater than zero')
      return
    }

    setLoading(true)
    setError(null)
    setHasSearched(true)
    setShowSuggestions(false)

    try {
      const data = await VendorMaterialService.searchByMaterial({
        materialName: name.trim(),
        quantity: qty,
        sortBy: 'total_asc',
      })
      setResults(data)
    } catch (err) {
      setResults([])
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const runSearchRef = useRef(runSearch)
  useEffect(() => {
    runSearchRef.current = runSearch
  }, [runSearch])

  const throttledSearchRef = useRef(
    throttle((name: string, qtyValue: string) => {
      void runSearchRef.current(name, qtyValue)
    }, 600)
  )

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    throttledSearchRef.current(materialName, quantity)
  }

  const selectSuggestion = (material: Material) => {
    setMaterialName(material.name)
    setShowSuggestions(false)
    setHighlightedIndex(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Escape') setShowSuggestions(false)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length)
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
      return
    }

    if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      selectSuggestion(suggestions[highlightedIndex])
      return
    }

    if (e.key === 'Escape') {
      setShowSuggestions(false)
      setHighlightedIndex(-1)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        suggestionsRef.current?.contains(target) ||
        inputRef.current?.contains(target)
      ) {
        return
      }
      setShowSuggestions(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const lowestTotal = summary?.lowest

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-3 items-end">
          <div className="space-y-2 relative">
            <label htmlFor="material-name" className="text-sm font-medium text-gray-700 block">
              Material Name
            </label>
            <Input
              ref={inputRef}
              id="material-name"
              type="text"
              placeholder="Type material name..."
              value={materialName}
              onChange={(e) => {
                setMaterialName(e.target.value)
                setShowSuggestions(true)
                setError(null)
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1"
              disabled={loading}
            />

            {showSuggestions && materialName.trim().length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden"
              >
                {suggestions.length === 0 ? (
                  <div className="px-3 py-2.5 text-sm text-gray-500">
                    {debouncedQuery.trim() !== materialName.trim()
                      ? 'Searching...'
                      : 'No matching materials'}
                  </div>
                ) : (
                  <ul className="max-h-64 overflow-y-auto py-1">
                    {suggestions.map((material, index) => {
                      const category = resolveRelation(material.category)
                      return (
                        <li key={material.id}>
                          <button
                            type="button"
                            className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${
                              index === highlightedIndex
                                ? 'bg-[#23887C]/10'
                                : 'hover:bg-gray-50'
                            }`}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            onClick={() => selectSuggestion(material)}
                          >
                            <div className="h-9 w-9 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                              {material.photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={material.photo_url}
                                  alt={material.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Search className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {material.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {category?.name ? `${category.name} · ` : ''}
                                {material.unit
                                  ? getMaterialUnitLabel(material.unit)
                                  : 'No unit'}
                              </p>
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="quantity" className="text-sm font-medium text-gray-700 block">
              Quantity
            </label>
            <Input
              id="quantity"
              type="number"
              min="0.01"
              step="any"
              placeholder="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-11 bg-[#23887C] hover:bg-[#23887C]/90 text-white px-6"
          >
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Searching...' : 'Compare Vendors'}
          </Button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : !hasSearched ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Compare vendor quotes</p>
          <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
            Start typing a material name to see suggestions, then compare vendor prices.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500 font-medium">No vendors found</p>
          <p className="text-sm text-gray-400 mt-1">
            No active vendor mappings match this material. Add items, vendors, and mappings first.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <TrendingDown className="h-4 w-4 text-[#23887C]" />
                  Best total
                </div>
                <p className="text-lg font-semibold text-gray-900">{formatINR(summary.lowest)}</p>
                <p className="text-xs text-gray-500 mt-1">{summary.bestVendor}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <BarChart3 className="h-4 w-4 text-[#23887C]" />
                  Average total
                </div>
                <p className="text-lg font-semibold text-gray-900">{formatINR(summary.average)}</p>
                <p className="text-xs text-gray-500 mt-1">{summary.count} quotes</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <TrendingUp className="h-4 w-4 text-[#23887C]" />
                  Highest total
                </div>
                <p className="text-lg font-semibold text-gray-900">{formatINR(summary.highest)}</p>
                <p className="text-xs text-gray-500 mt-1">Across all quotes</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <TrendingDown className="h-4 w-4 text-[#23887C]" />
                  Potential savings
                </div>
                <p className="text-lg font-semibold text-gray-900">{formatINR(summary.savings)}</p>
                <p className="text-xs text-gray-500 mt-1">Highest vs best</p>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500">
            Showing {results.length} quote{results.length === 1 ? '' : 's'} · lowest total first
          </p>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Vendor</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Per Unit</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">GST</TableHead>
                  <TableHead className="text-right">Transport</TableHead>
                  <TableHead className="text-right">Eff. / Unit</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((row) => {
                  const isBest = lowestTotal !== undefined && row.total === lowestTotal
                  return (
                    <TableRow
                      key={row.vendor_material_id}
                      className={isBest ? 'bg-[#23887C]/5' : undefined}
                    >
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {row.vendor_name}
                          {isBest && (
                            <span className="ml-2 text-xs font-medium text-[#23887C]">Best</span>
                          )}
                        </div>
                        {(row.vendor_contact_name || row.vendor_phone) && (
                          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                            {row.vendor_contact_name && <div>{row.vendor_contact_name}</div>}
                            {row.vendor_phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {row.vendor_phone}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {row.material_photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.material_photo_url}
                              alt={row.material_name}
                              className="h-8 w-8 rounded object-cover flex-shrink-0"
                            />
                          ) : null}
                          <div>
                            <div>
                              {row.material_name}
                              {row.material_unit ? (
                                <span className="text-gray-400 text-xs ml-1">
                                  ({getMaterialUnitLabel(row.material_unit)})
                                </span>
                              ) : null}
                            </div>
                            {row.material_category_name && (
                              <div className="text-xs text-[#23887C] mt-0.5">
                                {row.material_category_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatINR(row.unit_price)}</TableCell>
                      <TableCell className="text-right">{row.quantity}</TableCell>
                      <TableCell className="text-right">{formatINR(row.subtotal)}</TableCell>
                      <TableCell className="text-right">
                        <div>{formatINR(row.gst_amount)}</div>
                        <div className="text-xs text-gray-400">{row.gst_percent}%</div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatINR(row.transportation_cost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatINR(row.effective_unit_price)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        {formatINR(row.total)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
