import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Role } from '../api/permissions-api'

const RANDOM_COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16',
]

function randomColor() {
  return RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)]
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '_')    // non-alphanumeric → underscore
    .replace(/^_|_$/g, '')           // trim leading/trailing underscores
}

interface RoleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: Role | null
  onSave: (data: { name: string; label: string; description: string; color: string }) => void
  loading?: boolean
}

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  onSave,
  loading,
}: RoleFormDialogProps) {
  const { t } = useTranslation()
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('')

  const isEdit = !!role
  const slug = isEdit ? role.name : toSlug(label)

  useEffect(() => {
    if (role) {
      setLabel(role.label)
      setDescription(role.description)
      setColor(role.color || '')
    } else {
      setLabel('')
      setDescription('')
      setColor(randomColor())
    }
  }, [role, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ name: slug, label, description, color: color || randomColor() })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t('permissions.edit_role')
              : t('permissions.new_role')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='role-label'>{t('permissions.role_label')}</Label>
            <Input
              id='role-label'
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder='Vendedor, Almacenista, Cajero...'
              required
            />
            {slug && (
              <p className='text-xs text-muted-foreground'>
                Slug: <code className='rounded bg-muted px-1 py-0.5'>{slug}</code>
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label>{t('permissions.role_color')}</Label>
            <div className='flex items-center gap-2'>
              <input
                type='color'
                value={color || '#6366f1'}
                onChange={(e) => setColor(e.target.value)}
                className='h-9 w-14 cursor-pointer rounded-md border p-1'
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder='#6366f1'
                className='flex-1 h-9'
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='role-desc'>
              {t('permissions.role_description')}
            </Label>
            <Textarea
              id='role-desc'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('permissions.role_description_placeholder')}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type='submit' disabled={loading || !label}>
              {loading ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
