import { forwardRef, useImperativeHandle } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { Rocket, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import type { SignUpFormData } from '../index'

type Props = {
  formData: SignUpFormData
  setIsLoading: (loading: boolean) => void
}

export const SignUpStepComplete = forwardRef<{ submit: () => void }, Props>(
  ({ formData, setIsLoading }, ref) => {
    const navigate = useNavigate()
    const { auth } = useAuthStore()

    const countryName = (() => {
      try {
        const dn = new Intl.DisplayNames([navigator.language || 'es'], { type: 'region' })
        return dn.of(formData.country) || formData.country
      } catch { return formData.country }
    })()

    const summaryItems = [
      { label: 'Nombre', value: formData.name },
      { label: 'Email', value: formData.email },
      { label: 'Negocio', value: formData.organizationName },
      { label: 'País', value: countryName },
    ]

    async function handleSubmit() {
      setIsLoading(true)

      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        organization_name: formData.organizationName,
        organization_logo: formData.organizationLogo,
        country: formData.country,
      }

      try {
        const response = await api.post('/auth/register', payload)
        const { user, token } = response.data.data
        auth.setUser(user)
        auth.setAccessToken(token)

        toast.success(`¡Bienvenido ${user.name}! Tu cuenta está lista`)
        navigate({ to: '/', replace: true })
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Error al crear la cuenta'
        toast.error(errorMessage)
        setIsLoading(false)
      }
    }

    useImperativeHandle(ref, () => ({
      submit: handleSubmit,
    }))

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="size-14 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <Rocket className="size-7 text-primary" />
          </motion.div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <CheckCircle2 className="size-4 text-green-500" />
            Resumen
          </h3>
          <div className="space-y-2 text-sm">
            {summaryItems.map((item) => (
              <div key={item.label} className="flex justify-between">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium truncate ml-2">{item.value || '-'}</span>
              </div>
            ))}
          </div>
        </div>

      </motion.div>
    )
  }
)

SignUpStepComplete.displayName = 'SignUpStepComplete'
