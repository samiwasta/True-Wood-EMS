import { supabase } from '@/lib/supabase'
import { Material } from '@/lib/models/inventory.model'

const PHOTO_BUCKET = 'material-photos'
const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function getExtension(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && fromName.length <= 5) return fromName
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'
  return 'jpg'
}

function storagePathFromPublicUrl(photoUrl: string): string | null {
  const marker = `/object/public/${PHOTO_BUCKET}/`
  const index = photoUrl.indexOf(marker)
  if (index === -1) return null
  return decodeURIComponent(photoUrl.slice(index + marker.length))
}

export class MaterialService {
  static async getAll(): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching materials:', error)
        throw new Error(error.message || 'Failed to fetch materials')
      }

      return data ?? []
    } catch (error) {
      console.error('Error fetching materials:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch materials')
    }
  }

  static async uploadPhoto(materialId: string, file: File): Promise<string> {
    if (!materialId) {
      throw new Error('Material ID is required')
    }
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      throw new Error('Photo must be a JPEG, PNG, WebP, or GIF image')
    }
    if (file.size > MAX_PHOTO_BYTES) {
      throw new Error('Photo must be 5MB or smaller')
    }

    const path = `${materialId}/${Date.now()}.${getExtension(file)}`

    const { error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      console.error('Error uploading material photo:', uploadError)
      throw new Error(uploadError.message || 'Failed to upload photo')
    }

    const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path)
    if (!data?.publicUrl) {
      throw new Error('Failed to get photo URL')
    }

    return data.publicUrl
  }

  static async deletePhotoByUrl(photoUrl: string | null | undefined): Promise<void> {
    if (!photoUrl) return

    const path = storagePathFromPublicUrl(photoUrl)
    if (!path) return

    const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([path])
    if (error) {
      console.error('Error deleting material photo:', error)
    }
  }

  static async create(input: {
    name: string
    unit?: string
    description?: string
    photoFile?: File | null
  }): Promise<Material> {
    try {
      const trimmedName = input.name.trim()
      if (!trimmedName) {
        throw new Error('Material name is required')
      }

      const payload: Record<string, unknown> = {
        name: trimmedName,
        is_active: true,
      }

      if (input.unit?.trim()) {
        payload.unit = input.unit.trim()
      }

      if (input.description?.trim()) {
        payload.description = input.description.trim()
      }

      const { data, error } = await supabase
        .from('materials')
        .insert(payload)
        .select()
        .single()

      if (error) {
        console.error('Error creating material:', error)
        throw new Error(error.message || error.details || 'Failed to create material')
      }

      if (!input.photoFile) {
        return data
      }

      try {
        const photoUrl = await this.uploadPhoto(data.id, input.photoFile)
        const { data: updated, error: updateError } = await supabase
          .from('materials')
          .update({ photo_url: photoUrl })
          .eq('id', data.id)
          .select()
          .single()

        if (updateError) {
          console.error('Error saving material photo URL:', updateError)
          throw new Error(updateError.message || 'Failed to save photo')
        }

        return updated
      } catch (photoError) {
        await supabase.from('materials').delete().eq('id', data.id)
        throw photoError
      }
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error('Failed to create material')
    }
  }

  static async update(
    id: string,
    input: {
      name: string
      unit?: string | null
      description?: string | null
      is_active?: boolean
      photoFile?: File | null
      removePhoto?: boolean
    }
  ): Promise<Material> {
    try {
      if (!id) {
        throw new Error('Material ID is required')
      }

      const trimmedName = input.name.trim()
      if (!trimmedName) {
        throw new Error('Material name is required')
      }

      const { data: existing, error: existingError } = await supabase
        .from('materials')
        .select('*')
        .eq('id', id)
        .single()

      if (existingError) {
        throw new Error(existingError.message || 'Material not found')
      }

      const payload: Record<string, unknown> = {
        name: trimmedName,
      }

      if (input.unit !== undefined) {
        payload.unit = input.unit?.trim() || null
      }

      if (input.description !== undefined) {
        payload.description = input.description?.trim() || null
      }

      if (input.is_active !== undefined) {
        payload.is_active = input.is_active
      }

      if (input.photoFile) {
        const photoUrl = await this.uploadPhoto(id, input.photoFile)
        payload.photo_url = photoUrl
        await this.deletePhotoByUrl(existing.photo_url)
      } else if (input.removePhoto) {
        payload.photo_url = null
        await this.deletePhotoByUrl(existing.photo_url)
      }

      const { data, error } = await supabase
        .from('materials')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating material:', error)
        throw new Error(error.message || error.details || 'Failed to update material')
      }

      return data
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error('Failed to update material')
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      if (!id) {
        throw new Error('Material ID is required')
      }

      const { data: existing } = await supabase
        .from('materials')
        .select('photo_url')
        .eq('id', id)
        .maybeSingle()

      const { error } = await supabase.from('materials').delete().eq('id', id)

      if (error) {
        console.error('Error deleting material:', error)
        throw new Error(error.message || error.details || 'Failed to delete material')
      }

      await this.deletePhotoByUrl(existing?.photo_url)
      return true
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error('Failed to delete material')
    }
  }
}
