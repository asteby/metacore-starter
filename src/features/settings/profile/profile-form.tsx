import { useState, useRef } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@asteby/metacore-auth'
import { getInitials } from '@asteby/metacore-ui/lib'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@asteby/metacore-ui/primitives'
import { Loader2, Camera } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export function ProfileForm() {
  const { t } = useTranslation()
  const auth = useAuthStore((s) => s.auth)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const profileFormSchema = z.object({
    name: z
      .string()
      .min(2, t('settings.profile.name_min_length', 'Name is too short'))
      .max(100, t('settings.profile.name_max_length', 'Name is too long')),
    email: z
      .string()
      .email(t('settings.profile.email_invalid', 'Invalid email')),
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

  const currentAvatar = avatarPreview || auth.user?.avatar || null
  const initials = getInitials(auth.user?.name ?? 'User')

  async function onSubmit(data: ProfileFormValues) {
    // TODO: replace with a real backend call. The starter ships a no-op stub.
    // eslint-disable-next-line no-console
    console.log('profile submit', data)
    if (auth.user) {
      auth.setUser({ ...auth.user, name: data.name, email: data.email })
    }
    setAvatarPreview(null)
    toast.success(t('settings.profile.profile_updated', 'Profile updated'))
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
              className='bg-primary text-primary-foreground hover:bg-primary/90 absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full'
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
            <p className='text-sm font-medium'>
              {t('settings.profile.photo', 'Profile photo')}
            </p>
            <p className='text-muted-foreground text-xs'>
              {t('settings.profile.photo_description', 'PNG/JPG up to 1 MB.')}
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('settings.profile.name', 'Name')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t(
                    'settings.profile.name_placeholder',
                    'Your full name'
                  )}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t(
                  'settings.profile.name_description',
                  'This is the name displayed in the app.'
                )}
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
              <FormLabel>{t('settings.profile.email', 'Email')}</FormLabel>
              <FormControl>
                <Input
                  type='email'
                  placeholder={t(
                    'settings.profile.email_placeholder',
                    'you@example.com'
                  )}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t(
                  'settings.profile.email_description',
                  'Used for account-related notifications.'
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && (
            <Loader2 className='mr-2 size-4 animate-spin' />
          )}
          {t('common.save_changes', 'Save changes')}
        </Button>
      </form>
    </Form>
  )
}
