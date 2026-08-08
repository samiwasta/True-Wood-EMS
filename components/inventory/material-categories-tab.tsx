'use client'

import { useMemo, useState } from 'react'
import { useMaterialCategories } from '@/lib/hooks/useMaterialCategories'
import { MaterialCategory } from '@/lib/models/inventory.model'
import { FolderTree, Plus, Edit2, Trash2, AlertTriangle, Search } from 'lucide-react'
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

const emptyForm = { name: '', description: '' }

export function MaterialCategoriesTab() {
  const { categories, loading, createCategory, updateCategory, deleteCategory } =
    useMaterialCategories()

  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingCategory, setEditingCategory] = useState<MaterialCategory | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<MaterialCategory | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return categories
    return categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(query) ||
        (category.description || '').toLowerCase().includes(query)
      )
    })
  }, [categories, searchQuery])

  const resetForm = () => setForm(emptyForm)

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setIsSubmitting(true)
    try {
      await createCategory({
        name: form.name,
        description: form.description || undefined,
      })
      resetForm()
      setIsAddDialogOpen(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add category')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !editingCategory) return

    setIsSubmitting(true)
    try {
      await updateCategory(editingCategory.id, {
        name: form.name,
        description: form.description || null,
      })
      resetForm()
      setEditingCategory(null)
      setIsEditDialogOpen(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update category')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCategory) return

    setIsSubmitting(true)
    try {
      await deleteCategory(deletingCategory.id)
      setDeletingCategory(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete category')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderFormFields = () => (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">
          Category Name <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          placeholder="e.g., Timber, Hardware, Finishes"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1"
          disabled={isSubmitting}
          autoFocus
          required
        />
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderTree className="h-5 w-5 text-[#23887C]" />
          <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
          {!loading && categories.length > 0 && (
            <span className="text-sm text-gray-500">({categories.length})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-52 border-gray-300"
            />
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
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Category</DialogTitle>
                <DialogDescription>
                  Create a category to organize inventory items.
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
                    disabled={!form.name.trim() || isSubmitting}
                    className="bg-[#23887C] hover:bg-[#23887C]/90 text-white"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Category'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <FolderTree className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {categories.length === 0 ? 'No categories found' : 'No matching categories'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {categories.length === 0
              ? 'Create categories before adding items'
              : 'Try a different search'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-[#23887C]/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 bg-[#23887C]/10 rounded-lg">
                  <FolderTree className="h-4 w-4 text-[#23887C]" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{category.name}</p>
                  {category.description && (
                    <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => {
                    setEditingCategory(category)
                    setForm({
                      name: category.name || '',
                      description: category.description || '',
                    })
                    setIsEditDialogOpen(true)
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setDeletingCategory(category)
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
            setEditingCategory(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category details.</DialogDescription>
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
                {isSubmitting ? 'Updating...' : 'Update Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open)
          if (!open) setDeletingCategory(null)
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              Delete Category
            </DialogTitle>
            <DialogDescription>
              Items in this category will become uncategorized. You can assign them to another
              category later.
            </DialogDescription>
          </DialogHeader>
          {deletingCategory && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-900">{deletingCategory.name}</p>
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
              {isSubmitting ? 'Deleting...' : 'Delete Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
