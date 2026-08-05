'use client'

import { useState } from 'react'
import { VendorMaterialService } from '@/lib/services/vendor-material.service'
import { VendorPriceBreakdown } from '@/lib/models/inventory.model'
import { formatINR, getMaterialUnitLabel } from '@/lib/utils/inventory.utils'
import { Search } from 'lucide-react'
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
  const [materialName, setMaterialName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [results, setResults] = useState<VendorPriceBreakdown[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    const qty = parseFloat(quantity)
    if (!materialName.trim()) {
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

    try {
      const data = await VendorMaterialService.searchByMaterial(materialName, qty)
      setResults(data)
    } catch (err) {
      setResults([])
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px_auto] gap-3 items-end">
          <div className="space-y-2">
            <label htmlFor="material-name" className="text-sm font-medium text-gray-700 block">
              Material Name
            </label>
            <Input
              id="material-name"
              type="text"
              placeholder="Search material..."
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1"
              disabled={loading}
            />
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
            {loading ? 'Searching...' : 'Search'}
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
          <p className="text-gray-500 font-medium">Search vendor prices</p>
          <p className="text-sm text-gray-400 mt-1">
            Enter a material name and quantity to compare vendor quotes
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
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Showing {results.length} vendor{results.length === 1 ? '' : 's'} for{' '}
            <span className="font-medium text-gray-700">{results[0]?.material_name}</span>
            {results.length > 1 &&
              new Set(results.map((r) => r.material_id)).size > 1 &&
              ' (multiple matching materials)'}
            , sorted by total ascending
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
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((row, index) => (
                  <TableRow
                    key={row.vendor_material_id}
                    className={index === 0 ? 'bg-[#23887C]/5' : undefined}
                  >
                    <TableCell className="font-medium">
                      {row.vendor_name}
                      {index === 0 && (
                        <span className="ml-2 text-xs font-medium text-[#23887C]">Lowest</span>
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
                        <span>
                          {row.material_name}
                          {row.material_unit ? (
                            <span className="text-gray-400 text-xs ml-1">
                              ({getMaterialUnitLabel(row.material_unit)})
                            </span>
                          ) : null}
                        </span>
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
                    <TableCell className="text-right font-semibold text-gray-900">
                      {formatINR(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
