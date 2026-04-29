import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { useAuth } from '@/context/auth-provider'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === '' ? 'Por favor, ingresa tu correo electrónico' : undefined),
  }),
  password: z
    .string()
    .min(1, 'Por favor, ingresa tu contraseña')
    .min(7, 'La contraseña debe tener al menos 7 caracteres'),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()
  const authContext = useAuth()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    api
      .post('/auth/login', data)
      .then((response) => {
        const { user, token } = response.data.data
        auth.setUser(user)
        auth.setAccessToken(token)

        // Also update our AuthProvider context for sidebar roles
        authContext.login(user.email, user.role)

        // Redirect based on role
        if (user.role === 'agent') {
          navigate({ to: '/conversations', replace: true })
        } else {
          navigate({ to: redirectTo || '/', replace: true })
        }
        toast.success(`Bienvenido de nuevo, ${user.name}!`)
      })
      .catch((error) => {
        const errorMessage = error.response?.data?.error || 'Inicio de sesión fallido'
        toast.error(errorMessage)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-xs'>
                Correo electrónico
              </FormLabel>
              <FormControl>
                <Input
                  placeholder='tu@email.com'
                  autoComplete='email'
                  className='h-10'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <div className="flex items-center justify-between">
                <FormLabel className='text-xs'>
                  Contraseña
                </FormLabel>
                <Link
                  to='/forgot-password'
                  className='text-xs font-medium text-primary hover:underline underline-offset-4'
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <FormControl>
                <PasswordInput
                  placeholder='********'
                  autoComplete='current-password'
                  className='h-10'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='w-full h-10' disabled={isLoading}>
          {isLoading ? (
            <Loader2 className='animate-spin' />
          ) : (
            'Entrar al panel'
          )}
        </Button>

        <p className='text-muted-foreground text-center text-xs mt-4'>
          Al iniciar sesión, aceptas nuestros{' '}
          <a
            href='/terms'
            className='underline underline-offset-2 hover:text-foreground'
          >
            Términos
          </a>{' '}
          y{' '}
          <a
            href='/privacy'
            className='underline underline-offset-2 hover:text-foreground'
          >
            Privacidad
          </a>
          .
        </p>
      </form>
    </Form>
  )
}
