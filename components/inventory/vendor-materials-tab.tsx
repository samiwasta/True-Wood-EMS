'use client'

import { useState } from 'react'
import { useVendorMaterials } from '@/lib/hooks/useVendorMaterials'
import { useMaterials } from '@/lib/hooks/useMaterials'
import { useVendors } from '@/lib/hooks/useVendors'
import { VendorMaterial } from '@/lib/models/inventory.model'
import { formatINR, getMaterialUnitLabel, resolveRelation } from '@/lib/utils/inventory.utils'
import { Link2, Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const emptyForm = {
  vendor_id: '',
  material_id: '',
  unit_price: '',
  gst_percent: '0',
  transportation_cost: '0',
}

export function VendorMaterialsTab() {
  const {
    vendorMaterials,
    loading,
    createVendorMaterial,
    updateVendorMaterial,
    deleteVendorMaterial,
  } = useVendorMaterials()
  const { materials } = useMaterials()
  const { vendors } = useVendors()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingItem, setEditingItem] = useState<VendorMaterial | null>(null)
  const [deletingItem, setDeletingItem] = useState<VendorMaterial | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => setForm(emptyForm)

  const parsePricing = () => {
    const unitPrice = parseFloat(form.unit_price)
    const gstPercent = parseFloat(form.gst_percent || '0')
    const transportationCost = parseFloat(form.transportation_cost || '0')

    if (!form.vendor_id) throw new Error('Vendor is required')
    if (!form.material_id) throw new Error('Material is required')
    if (Number.isNaN(unitPrice) || unitPrice < 0) throw new Error('Enter a valid unit price')
    if (Number.isNaN(gstPercent) || gstPercent < 0) throw new Error('Enter a valid GST percent')
    if (Number.isNaN(transportationCost) || transportationCost < 0) {
      throw new Error('Enter a valid transportation cost')
    }

    return { unitPrice, gstPercent, transportationCost }
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const { unitPrice, gstPercent, transportationCost } = parsePricing()
      await createVendorMaterial({
        vendor_id: form.vendor_id,
        material_id: form.material_id,
        unit_price: unitPrice,
        gst_percent: gstPercent,
        transportation_cost: transportationCost,
      })
      resetForm()
      setIsAddDialogOpen(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add mapping')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    setIsSubmitting(true)
    try {
      const { unitPrice, gstPercent, transportationCost } = parsePricing()
      await updateVendorMaterial(editingItem.id, {
        vendor_id: form.vendor_id,
        material_id: form.material_id,
        unit_price: unitPrice,
        gst_percent: gstPercent,
        transportation_cost: transportationCost,
      })
      resetForm()
      setEditingItem(null)
      setIsEditDialogOpen(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update mapping')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingItem) return

    setIsSubmitting(true)
    try {
      await deleteVendorMaterial(deletingItem.id)
      setDeletingItem(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete mapping')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEdit = (item: VendorMaterial) => {
    setEditingItem(item)
    setForm({
      vendor_id: item.vendor_id,
      material_id: item.material_id,
      unit_price: String(item.unit_price ?? ''),
      gst_percent: String(item.gst_percent ?? 0),
      transportation_cost: String(item.transportation_cost ?? 0),
    })
    setIsEditDialogOpen(true)
  }

  const renderFormFields = () => (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">
          Vendor <span className="text-red-500">*</span>
        </label>
        <Select
          value={form.vendor_id}
          onValueChange={(value) => setForm((prev) => ({ ...prev, vendor_id: value }))}
          disabled={isSubmitting}
        >
          <SelectTrigger className="h-11 w-full border-gray-300">
            <SelectValue placeholder="Select vendor" />
          </SelectTrigger>
          <SelectContent>
            {vendors.map((vendor) => (
              <SelectItem key={vendor.id} value={vendor.id}>
                {vendor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">
          Material <span className="text-red-500">*</span>
        </label>
        <Select
          value={form.material_id}
          onValueChange={(value) => setForm((prev) => ({ ...prev, material_id: value }))}
          disabled={isSubmitting}
        >
          <SelectTrigger className="h-11 w-full border-gray-300">
            <SelectValue placeholder="Select material" />
          </SelectTrigger>
          <SelectContent>
            {materials.map((material) => (
              <SelectItem key={material.id} value={material.id}>
                {material.name}
                {material.unit ? ` (${getMaterialUnitLabel(material.unit)})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">
          Unit Price (₹) <span className="text-red-500">*</span>
        </label>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={form.unit_price}
          onChange={(e) => setForm((prev) => ({ ...prev, unit_price: e.target.value }))}
          className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1"
          disabled={isSubmitting}
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block">GST (%)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={form.gst_percent}
            onChange={(e) => setForm((prev) => ({ ...prev, gst_percent: e.target.value }))}
            className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1"
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block">Transportation (₹)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={form.transportation_cost}
            onChange={(e) => setForm((prev) => ({ ...prev, transportation_cost: e.target.value }))}
            className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1"
            disabled={isSubmitting}
          />
        </div>
      </div>
    </>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-[#23887C]" />
          <h3 className="text-lg font-semibold text-gray-900">Vendor Mapping</h3>
          {!loading && vendorMaterials.length > 0 && (
            <span className="text-sm text-gray-500">({vendorMaterials.length})</span>
          )}
        </div>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-[#23887C] hover:bg-[#23887C]/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Mapping
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Vendor Mapping</DialogTitle>
              <DialogDescription>
                Link a vendor to a material with unit price, GST, and transportation.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              {renderFormFields()}
              <DialogFooter className="gap-3">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!form.vendor_id || !form.material_id || !form.unit_price || isSubmitting}
                  className="bg-[#23887C] hover:bg-[#23887C]/90 text-white"
                >
                  {isSubmitting ? 'Adding...' : 'Add Mapping'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : vendorMaterials.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <Link2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No vendor mappings found</p>
          <p className="text-sm text-gray-400 mt-1">
            Map vendors to items with pricing to enable search
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Vendor</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">GST %</TableHead>
                <TableHead className="text-right">Transport</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorMaterials.map((item) => {
                const vendor = resolveRelation(item.vendor)
                const material = resolveRelation(item.material)
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{vendor?.name || '—'}</TableCell>
                    <TableCell>
                      {material?.name || '—'}
                      {material?.unit ? (
                        <span className="text-gray-400 text-xs ml-1">
                          ({getMaterialUnitLabel(material.unit)})
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">{formatINR(Number(item.unit_price))}</TableCell>
                    <TableCell className="text-right">{Number(item.gst_percent)}%</TableCell>
                    <TableCell className="text-right">
                      {formatINR(Number(item.transportation_cost))}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => openEdit(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setDeletingItem(item)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            resetForm()
            setEditingItem(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Vendor Mapping</DialogTitle>
            <DialogDescription>Update pricing for this vendor–material pair.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {renderFormFields()}
            <DialogFooter className="gap-3">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.vendor_id || !form.material_id || !form.unit_price || isSubmitting}
                className="bg-[#23887C] hover:bg-[#23887C]/90 text-white"
              >
                {isSubmitting ? 'Updating...' : 'Update Mapping'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open)
          if (!open) setDeletingItem(null)
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              Delete Mapping
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this vendor–material pricing?
            </DialogDescription>
          </DialogHeader>
          {deletingItem && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-900">
                {resolveRelation(deletingItem.vendor)?.name || 'Vendor'} —{' '}
                {resolveRelation(deletingItem.material)?.name || 'Material'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Unit: {formatINR(Number(deletingItem.unit_price))} · GST:{' '}
                {Number(deletingItem.gst_percent)}% · Transport:{' '}
                {formatINR(Number(deletingItem.transportation_cost))}
              </p>
            </div>
          )}
          <DialogFooter className="gap-3">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Mapping'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
