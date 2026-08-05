'use client'

import { useState } from 'react'
import { useVendors } from '@/lib/hooks/useVendors'
import { Vendor } from '@/lib/models/inventory.model'
import { Building2, Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const emptyForm = {
  name: '',
  contact_name: '',
  phone: '',
  email: '',
  address: '',
}

export function VendorsTab() {
  const { vendors, loading, createVendor, updateVendor, deleteVendor } = useVendors()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => setForm(emptyForm)

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setIsSubmitting(true)
    try {
      await createVendor({
        name: form.name,
        contact_name: form.contact_name || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
      })
      resetForm()
      setIsAddDialogOpen(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add vendor')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !editingVendor) return

    setIsSubmitting(true)
    try {
      await updateVendor(editingVendor.id, {
        name: form.name,
        contact_name: form.contact_name || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
      })
      resetForm()
      setEditingVendor(null)
      setIsEditDialogOpen(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update vendor')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingVendor) return

    setIsSubmitting(true)
    try {
      await deleteVendor(deletingVendor.id)
      setDeletingVendor(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete vendor')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEdit = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setForm({
      name: vendor.name || '',
      contact_name: vendor.contact_name || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      address: vendor.address || '',
    })
    setIsEditDialogOpen(true)
  }

  const renderFormFields = () => (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">
          Vendor Name <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          placeholder="e.g., ABC Timber Supplies"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1"
          disabled={isSubmitting}
          autoFocus
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">Contact Name</label>
        <Input
          type="text"
          placeholder="Contact person"
          value={form.contact_name}
          onChange={(e) => setForm((prev) => ({ ...prev, contact_name: e.target.value }))}
          className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1"
          disabled={isSubmitting}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block">Phone</label>
          <Input
            type="text"
            placeholder="Phone number"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1"
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block">Email</label>
          <Input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1"
            disabled={isSubmitting}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">Address</label>
        <Input
          type="text"
          placeholder="Vendor address"
          value={form.address}
          onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
          className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1"
          disabled={isSubmitting}
        />
      </div>
    </>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#23887C]" />
          <h3 className="text-lg font-semibold text-gray-900">Vendors</h3>
          {!loading && vendors.length > 0 && (
            <span className="text-sm text-gray-500">({vendors.length})</span>
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
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
              <DialogDescription>Add a supplier that can provide materials.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              {renderFormFields()}
              <DialogFooter className="gap-3">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!form.name.trim() || isSubmitting}
                  className="bg-[#23887C] hover:bg-[#23887C]/90 text-white"
                >
                  {isSubmitting ? 'Adding...' : 'Add Vendor'}
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
      ) : vendors.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No vendors found</p>
          <p className="text-sm text-gray-400 mt-1">Add your first vendor to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-[#23887C]/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="p-2 bg-[#23887C]/10 rounded-lg">
                  <Building2 className="h-4 w-4 text-[#23887C]" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{vendor.name}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
                    {vendor.contact_name && <span>{vendor.contact_name}</span>}
                    {vendor.phone && <span>{vendor.phone}</span>}
                    {vendor.email && <span>{vendor.email}</span>}
                  </div>
                  {vendor.address && (
                    <p className="text-xs text-gray-400 mt-1">{vendor.address}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => openEdit(vendor)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setDeletingVendor(vendor)
                    setIsDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            resetForm()
            setEditingVendor(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
            <DialogDescription>Update vendor details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {renderFormFields()}
            <DialogFooter className="gap-3">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.name.trim() || isSubmitting}
                className="bg-[#23887C] hover:bg-[#23887C]/90 text-white"
              >
                {isSubmitting ? 'Updating...' : 'Update Vendor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open)
          if (!open) setDeletingVendor(null)
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              Delete Vendor
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this vendor? Related material mappings will also be removed.
            </DialogDescription>
          </DialogHeader>
          {deletingVendor && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-900">{deletingVendor.name}</p>
              {deletingVendor.phone && (
                <p className="text-sm text-gray-500 mt-1">{deletingVendor.phone}</p>
              )}
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
              {isSubmitting ? 'Deleting...' : 'Delete Vendor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
