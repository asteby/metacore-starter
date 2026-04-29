import { useState, useRef } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Loader2, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { getStorageUrl } from '@/lib/utils'

// Schema will be created inside component to access t() function

export function ProfileForm() {
  const { t } = useTranslation()
  const { auth } = useAuthStore()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const profileFormSchema = z.object({
    name: z
      .string()
      .min(2, t('settings.profile.name_min_length'))
      .max(100, t('settings.profile.name_max_length')),
    email: z.string().email(t('settings.profile.email_invalid')),
    avatar: z.string().optional(),
  })

  type ProfileFormValues = z.infer<typeof profileFormSchema>

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: auth.user?.name || '',
      email: auth.user?.email || '',
      avatar: '',
    },
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setAvatarPreview(base64)
        form.setValue('avatar', base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const currentAvatar = avatarPreview || (auth.user?.avatar ? getStorageUrl(auth.user.avatar, 'avatars') : null)
  const initials = auth.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'

  async function onSubmit(data: ProfileFormValues) {
    try {
      const response = await api.put('/users/me', data)
      
      // Update local state
      if (auth.user && response.data?.data) {
        auth.setUser({ ...auth.user, ...response.data.data })
      }
      
      setAvatarPreview(null)
      toast.success(t('settings.profile.profile_updated'))
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('settings.profile.error_updating'))
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        {/* Avatar */}
        <div className='flex items-center gap-4'>
          <div className='relative'>
            <Avatar className='size-20'>
              <AvatarImage src={currentAvatar || undefined} />
              <AvatarFallback className='text-lg'>{initials}</AvatarFallback>
            </Avatar>
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90'
            >
              <Camera className='size-4' />
            </button>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleAvatarChange}
              className='hidden'
            />
          </div>
          <div>
            <p className='text-sm font-medium'>{t('settings.profile.photo')}</p>
            <p className='text-xs text-muted-foreground'>{t('settings.profile.photo_description')}</p>
          </div>
        </div>

        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('settings.profile.name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('settings.profile.name_placeholder')} {...field} />
              </FormControl>
              <FormDescription>
                {t('settings.profile.name_description')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('settings.profile.email')}</FormLabel>
              <FormControl>
                <Input type='email' placeholder={t('settings.profile.email_placeholder')} {...field} />
              </FormControl>
              <FormDescription>
                {t('settings.profile.email_description')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type='submit' disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && (
            <Loader2 className='mr-2 size-4 animate-spin' />
          )}
          {t('common.save_changes')}
        </Button>
      </form>
    </Form>
  )
}
