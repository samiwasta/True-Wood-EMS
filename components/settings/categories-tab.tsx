'use client'

import { useState, useMemo } from 'react'
import { useCategories } from '@/lib/hooks/useCategories'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { Skeleton } from '@/components/ui/skeleton'
import { Category } from '@/lib/models/settings.model'
import { FolderTree, Plus, Edit2, Trash2, Search, AlertTriangle } from 'lucide-react'
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

export function CategoriesTab() {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories()
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  
  // Add dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Form state
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredCategories = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return categories
    }

    const query = debouncedSearch.toLowerCase()
    return categories.filter((category: Category) => {
      const name = (category.name || category.title || '').toLowerCase()
      const description = (category.description || '').toLowerCase()
      return name.includes(query) || description.includes(query)
    })
  }, [categories, debouncedSearch])

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!categoryName.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      await createCategory(categoryName, categoryDescription)
      
      // Reset form and close dialog
      setCategoryName('')
      setCategoryDescription('')
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error adding category:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to add category. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!categoryName.trim() || !editingCategory) {
      return
    }

    setIsSubmitting(true)
    try {
      // Pass description only if it has a value, otherwise pass undefined
      const descriptionToUpdate = categoryDescription.trim() || undefined
      await updateCategory(editingCategory.id, categoryName, descriptionToUpdate)
      
      // Reset form and close dialog
      setCategoryName('')
      setCategoryDescription('')
      setEditingCategory(null)
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating category:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update category. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCategory) return

    setIsSubmitting(true)
    try {
      await deleteCategory(deletingCategory.id)
      
      // Reset and close dialog
      setDeletingCategory(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting category:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete category. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddDialogOpenChange = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (!open) {
      setCategoryName('')
      setCategoryDescription('')
    }
  }

  const handleEditClick = (category: Category) => {
    setEditingCategory(category)
    setCategoryName(category.name || category.title || '')
    setCategoryDescription(category.description || '')
    setIsEditDialogOpen(true)
  }

  const handleEditDialogOpenChange = (open: boolean) => {
    setIsEditDialogOpen(open)
    if (!open) {
      setCategoryName('')
      setCategoryDescription('')
      setEditingCategory(null)
    }
  }

  const handleDeleteClick = (category: Category) => {
    setDeletingCategory(category)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setIsDeleteDialogOpen(open)
    if (!open) {
      setDeletingCategory(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FolderTree className="h-5 w-5 text-[#23887C]" />
          <h3 className="text-lg font-semibold text-gray-900">Employee Categories</h3>
          {!loading && categories.length > 0 && (
            <span className="text-sm text-gray-500">({categories.length})</span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-1 max-w-md justify-end">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-10 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 bg-white shadow-sm transition-all duration-200"
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-[#23887C] hover:bg-[#23887C]/90 text-white whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" />
                Add Employee Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  Add New Employee Category
                </DialogTitle>
                <DialogDescription className="text-gray-500 pt-2">
                  Create a new employee category to classify and organize your employees. Enter a name for the employee category below.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label 
                    htmlFor="category-name" 
                    className="text-sm font-medium text-gray-700 block"
                  >
                    Employee Category Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="category-name"
                    type="text"
                    placeholder="e.g., Office Staff"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200"
                    disabled={isSubmitting}
                    autoFocus
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    This name will be used to categorize and organize employees in your system.
                  </p>
                </div>
                <DialogFooter className="gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAddDialogOpenChange(false)}
                    disabled={isSubmitting}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!categoryName.trim() || isSubmitting}
                    className="bg-[#23887C] hover:bg-[#23887C]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="mr-2">Adding...</span>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </>
                    ) : (
                      <>
                        Add Employee Category
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <FolderTree className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {searchQuery ? 'No categories match your search' : 'No categories found'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery ? 'Try a different search term' : 'Get started by adding your first category'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCategories.map((category: Category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-[#23887C]/30 hover:shadow-sm transition-all duration-200 group"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-[#23887C]/10 rounded-lg group-hover:bg-[#23887C]/20 transition-colors">
                  <FolderTree className="h-4 w-4 text-[#23887C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{category.name || category.title}</p>
                  {category.description && (
                    <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {category.status && (
                  <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                    category.status === 'active' 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                    {category.status}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => handleEditClick(category)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteClick(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              Edit Employee Category
            </DialogTitle>
            <DialogDescription className="text-gray-500 pt-2">
              Update the employee category information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <label 
                htmlFor="edit-category-name" 
                className="text-sm font-medium text-gray-700 block"
              >
                Employee Category Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="edit-category-name"
                type="text"
                placeholder="e.g., Office Staff"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200"
                disabled={isSubmitting}
                autoFocus
                required
              />
            </div>
            <DialogFooter className="gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleEditDialogOpenChange(false)}
                disabled={isSubmitting}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!categoryName.trim() || isSubmitting}
                className="bg-[#23887C] hover:bg-[#23887C]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2">Updating...</span>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </>
                ) : (
                  <>
                    Update Category
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              Delete Employee Category
            </DialogTitle>
            <DialogDescription className="text-gray-500 pt-2">
              Are you sure you want to delete this employee category? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingCategory && (
            <div className="py-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-medium text-gray-900">{deletingCategory.name || deletingCategory.title}</p>
                {deletingCategory.description && (
                  <p className="text-sm text-gray-500 mt-1">{deletingCategory.description}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDeleteDialogOpenChange(false)}
              disabled={isSubmitting}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Deleting...</span>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Category
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

