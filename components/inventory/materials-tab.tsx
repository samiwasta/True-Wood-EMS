'use client'

import { useEffect, useRef, useState } from 'react'
import { useMaterials } from '@/lib/hooks/useMaterials'
import { Material } from '@/lib/models/inventory.model'
import { Package, Plus, Edit2, Trash2, AlertTriangle, ImagePlus, X } from 'lucide-react'
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
import { MATERIAL_UNITS, getMaterialUnitLabel } from '@/lib/utils/inventory.utils'

const emptyForm = { name: '', unit: '', description: '' }

export function MaterialsTab() {
  const { materials, loading, createMaterial, updateMaterial, deleteMaterial } = useMaterials()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const addFileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null)
      return
    }
    const objectUrl = URL.createObjectURL(photoFile)
    setPhotoPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [photoFile])

  const resetForm = () => {
    setForm(emptyForm)
    setPhotoFile(null)
    setPhotoPreview(null)
    setExistingPhotoUrl(null)
    setRemovePhoto(false)
    if (addFileInputRef.current) addFileInputRef.current.value = ''
    if (editFileInputRef.current) editFileInputRef.current.value = ''
  }

  const displayedPhoto = photoPreview || (!removePhoto ? existingPhotoUrl : null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be 5MB or smaller')
      e.target.value = ''
      return
    }
    setPhotoFile(file)
    setRemovePhoto(false)
  }

  const clearPhoto = (mode: 'add' | 'edit') => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (existingPhotoUrl) {
      setRemovePhoto(true)
    }
    const input = mode === 'add' ? addFileInputRef.current : editFileInputRef.current
    if (input) input.value = ''
  }

  const renderFormFields = (mode: 'add' | 'edit') => {
    const fileRef = mode === 'add' ? addFileInputRef : editFileInputRef
    const inputId = mode === 'add' ? 'material-photo-input-add' : 'material-photo-input-edit'

    return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">Photo</label>
        <div className="flex items-start gap-4">
          <div className="h-24 w-24 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center flex-shrink-0">
            {displayedPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displayedPhoto} alt="Material preview" className="h-full w-full object-cover" />
            ) : (
              <Package className="h-8 w-8 text-gray-300" />
            )}
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handlePhotoChange}
              className="hidden"
              id={inputId}
              disabled={isSubmitting}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              className="border-gray-300"
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              {displayedPhoto ? 'Change Photo' : 'Upload Photo'}
            </Button>
            {displayedPhoto && (
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                onClick={() => clearPhoto(mode)}
              >
                <X className="h-4 w-4 mr-2" />
                Remove Photo
              </Button>
            )}
            <p className="text-xs text-gray-400">JPEG, PNG, WebP or GIF up to 5MB</p>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">
          Material Name <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          placeholder="e.g., Teak Wood Plank"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1"
          disabled={isSubmitting}
          autoFocus
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">Unit</label>
        <Select
          value={form.unit || undefined}
          onValueChange={(value) => setForm((prev) => ({ ...prev, unit: value }))}
          disabled={isSubmitting}
        >
          <SelectTrigger className="h-11 w-full border-gray-300">
            <SelectValue placeholder="Select unit" />
          </SelectTrigger>
          <SelectContent>
            {form.unit &&
              !MATERIAL_UNITS.some((unit) => unit.value === form.unit) && (
                <SelectItem value={form.unit}>{form.unit}</SelectItem>
              )}
            {MATERIAL_UNITS.map((unit) => (
              <SelectItem key={unit.value} value={unit.value}>
                {unit.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">Description</label>
        <Input
          type="text"
          placeholder="Optional description"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1"
          disabled={isSubmitting}
        />
      </div>
    </>
    )
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setIsSubmitting(true)
    try {
      await createMaterial({
        name: form.name,
        unit: form.unit || undefined,
        description: form.description || undefined,
        photoFile,
      })
      resetForm()
      setIsAddDialogOpen(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add material')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !editingMaterial) return

    setIsSubmitting(true)
    try {
      await updateMaterial(editingMaterial.id, {
        name: form.name,
        unit: form.unit || null,
        description: form.description || null,
        photoFile,
        removePhoto: removePhoto && !photoFile,
      })
      resetForm()
      setEditingMaterial(null)
      setIsEditDialogOpen(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update material')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingMaterial) return

    setIsSubmitting(true)
    try {
      await deleteMaterial(deletingMaterial.id)
      setDeletingMaterial(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete material')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEdit = (material: Material) => {
    setEditingMaterial(material)
    setForm({
      name: material.name || '',
      unit: material.unit || '',
      description: material.description || '',
    })
    setPhotoFile(null)
    setExistingPhotoUrl(material.photo_url || null)
    setRemovePhoto(false)
    setIsEditDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-[#23887C]" />
          <h3 className="text-lg font-semibold text-gray-900">Items</h3>
          {!loading && materials.length > 0 && (
            <span className="text-sm text-gray-500">({materials.length})</span>
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
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>Create a material that vendors can supply.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              {renderFormFields('add')}
              <DialogFooter className="gap-3">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!form.name.trim() || isSubmitting}
                  className="bg-[#23887C] hover:bg-[#23887C]/90 text-white"
                >
                  {isSubmitting ? 'Adding...' : 'Add Item'}
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
      ) : materials.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No items found</p>
          <p className="text-sm text-gray-400 mt-1">Add your first material to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((material) => (
            <div
              key={material.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-[#23887C]/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="h-12 w-12 rounded-lg bg-[#23887C]/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {material.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={material.photo_url}
                      alt={material.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-[#23887C]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{material.name}</p>
                  {material.description && (
                    <p className="text-sm text-gray-500 mt-1">{material.description}</p>
                  )}
                  {material.unit && (
                    <p className="text-xs text-gray-400 mt-1">
                      Unit: {getMaterialUnitLabel(material.unit)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => openEdit(material)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setDeletingMaterial(material)
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
            setEditingMaterial(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>Update material details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {renderFormFields('edit')}
            <DialogFooter className="gap-3">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.name.trim() || isSubmitting}
                className="bg-[#23887C] hover:bg-[#23887C]/90 text-white"
              >
                {isSubmitting ? 'Updating...' : 'Update Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open)
          if (!open) setDeletingMaterial(null)
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              Delete Item
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? Related vendor mappings will also be removed.
            </DialogDescription>
          </DialogHeader>
          {deletingMaterial && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                {deletingMaterial.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={deletingMaterial.photo_url}
                    alt={deletingMaterial.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{deletingMaterial.name}</p>
                {deletingMaterial.unit && (
                  <p className="text-sm text-gray-500 mt-1">
                    Unit: {getMaterialUnitLabel(deletingMaterial.unit)}
                  </p>
                )}
              </div>
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
              {isSubmitting ? 'Deleting...' : 'Delete Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
