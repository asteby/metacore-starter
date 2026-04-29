import { useState, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart,
  Package,
  FileText,
  Users,
  Wallet,
  TrendingUp,
  BarChart3,
  ClipboardList,
  Check,
  ArrowLeft,
  ArrowRight,
  Rocket,
  Loader2,
  Shield,
  Zap,
  Globe,
} from 'lucide-react'
import { Logo } from '@/assets/logo'
import { cn } from '@/lib/utils'
import { SignUpStepAccount } from './components/sign-up-step-account'
import { SignUpStepOrganization } from './components/sign-up-step-organization'
import { SignUpStepComplete } from './components/sign-up-step-complete'
import { Button } from '@/components/ui/button'

export type SignUpFormData = {
  name: string
  email: string
  password: string
  confirmPassword: string
  organizationName: string
  organizationLogo: string
  country: string
}

const steps = [
  { id: 1, title: 'Tu cuenta', description: 'Datos personales' },
  { id: 2, title: 'Tu negocio', description: 'Configura tu espacio' },
  { id: 3, title: '¡Listo!', description: 'Comienza a gestionar' },
]

const erpModules = [
  { icon: ShoppingCart, label: 'Ventas', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { icon: Package, label: 'Inventario', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { icon: Wallet, label: 'Finanzas', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  { icon: Users, label: 'RRHH', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  { icon: FileText, label: 'Facturación', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
  { icon: BarChart3, label: 'Reportes', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
]

const features = [
  { icon: Zap, title: 'Implementación rápida', desc: 'Configura tu empresa en minutos, no en semanas.' },
  { icon: Shield, title: 'Datos seguros', desc: 'Encriptación de extremo a extremo y backups automáticos.' },
  { icon: Globe, title: 'Acceso desde cualquier lugar', desc: 'Gestiona tu negocio desde cualquier dispositivo.' },
]

export function SignUp() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const formRef = useRef<{ submit: () => void } | null>(null)
  const [formData, setFormData] = useState<SignUpFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    organizationLogo: '',
    country: '',
  })

  const updateFormData = (data: Partial<SignUpFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3))
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1))

  const handleNext = () => {
    if (formRef.current) {
      formRef.current.submit()
    }
  }

  return (
    <div className="h-svh flex overflow-hidden">
      {/* Left Side - Form */}
      <div className="w-full lg:w-[45%] flex flex-col">
        {/* Fixed Header */}
        <div className="px-6 pt-8 pb-4 lg:px-12 xl:px-16 max-w-md mx-auto w-full">
          <div className="flex items-center justify-center gap-3">
            <Link to="/sign-in" className="inline-flex items-center gap-2 group">
              <Logo className="size-7 transition-transform group-hover:scale-110" />
              <span className="text-lg font-semibold">Ops</span>
            </Link>
            <span className="text-muted-foreground/50">|</span>
            <div className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/sign-in"
                className="text-primary font-medium hover:underline underline-offset-4"
              >
                Inicia sesión
              </Link>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex flex-col justify-center px-6 lg:px-12 xl:px-16 max-w-md mx-auto w-full overflow-y-auto">
          <div className='mb-8 text-center lg:text-left'>
            <h2 className='text-2xl font-bold tracking-tight'>Crea tu cuenta</h2>
            <p className='text-muted-foreground text-sm mt-1'>
              Configura tu empresa y comienza a gestionar tus operaciones.
            </p>
          </div>
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <SignUpStepAccount
                key="step-1"
                ref={formRef}
                formData={formData}
                updateFormData={updateFormData}
                onNext={nextStep}
              />
            )}
            {currentStep === 2 && (
              <SignUpStepOrganization
                key="step-2"
                ref={formRef}
                formData={formData}
                updateFormData={updateFormData}
                onNext={nextStep}
              />
            )}
            {currentStep === 3 && (
              <SignUpStepComplete
                key="step-3"
                ref={formRef}
                formData={formData}
                setIsLoading={setIsLoading}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Fixed Footer with Buttons */}
        <div className="px-6 py-4 lg:px-12 xl:px-16 max-w-md mx-auto w-full border-t">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button type="button" variant="outline" className="h-10" onClick={prevStep} disabled={isLoading}>
                <ArrowLeft className="size-4 mr-1" />
                Atrás
              </Button>
            )}
            <Button
              type="button"
              className="flex-1 h-10"
              onClick={handleNext}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : currentStep === 3 ? (
                <>
                  <Rocket className="size-4 mr-1" />
                  ¡Comenzar!
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight className="size-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          {/* Terms */}
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Al crear cuenta, aceptas los{' '}
            <a href="/terms" className="underline underline-offset-2 hover:text-foreground">
              Términos
            </a>{' '}
            y{' '}
            <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">
              Privacidad
            </a>
          </p>
        </div>
      </div>

      {/* Right Side - ERP Showcase */}
      <div className="hidden lg:flex lg:w-[55%] bg-muted/50 dark:bg-muted/20 flex-col justify-center relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className='absolute inset-0 opacity-[0.03] dark:opacity-[0.05]'
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className='relative z-10 px-12 xl:px-20 max-w-2xl mx-auto w-full'>
          {/* Step indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mb-8"
          >
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex items-center justify-center size-8 rounded-full text-sm font-medium transition-all duration-300',
                      currentStep > step.id
                        ? 'bg-primary text-primary-foreground'
                        : currentStep === step.id
                          ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                          : 'bg-background text-muted-foreground border'
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="size-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className={cn(
                    'text-xs mt-1.5 transition-colors',
                    currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-12 h-0.5 mx-2 mb-5 transition-colors duration-300',
                      currentStep > step.id ? 'bg-primary' : 'bg-border'
                    )}
                  />
                )}
              </div>
            ))}
          </motion.div>

          {/* Dynamic content based on step */}
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1-info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className='inline-flex items-center gap-2 text-primary mb-3'>
                  <TrendingUp className='size-5' />
                  <span className='text-sm font-medium'>Módulos incluidos</span>
                </div>
                <h2 className='text-2xl font-bold tracking-tight mb-2'>
                  Todos los módulos que necesitas
                </h2>
                <p className='text-muted-foreground text-sm mb-8 max-w-md'>
                  Accede a herramientas completas de gestión empresarial desde el primer día.
                </p>

                <div className='grid grid-cols-3 gap-3'>
                  {erpModules.map((mod, i) => (
                    <motion.div
                      key={mod.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className='flex items-center gap-3 p-3 rounded-xl bg-background/60 dark:bg-background/40 border border-border/50'
                    >
                      <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${mod.color}`}>
                        <mod.icon className='size-4' />
                      </div>
                      <span className='text-sm font-medium'>{mod.label}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2-info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className='inline-flex items-center gap-2 text-primary mb-3'>
                  <ClipboardList className='size-5' />
                  <span className='text-sm font-medium'>Tu espacio de trabajo</span>
                </div>
                <h2 className='text-2xl font-bold tracking-tight mb-2'>
                  {formData.organizationName
                    ? `Configurando ${formData.organizationName}`
                    : 'Personaliza tu empresa'}
                </h2>
                <p className='text-muted-foreground text-sm mb-8 max-w-md'>
                  Cada empresa es diferente. Configura Ops para que se adapte a tus procesos.
                </p>

                <div className='space-y-4'>
                  {features.map((feat, i) => (
                    <motion.div
                      key={feat.title}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                      className='flex gap-4 p-4 rounded-xl bg-background/60 dark:bg-background/40 border border-border/50'
                    >
                      <div className='size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0'>
                        <feat.icon className='size-5' />
                      </div>
                      <div>
                        <h3 className='text-sm font-semibold mb-0.5'>{feat.title}</h3>
                        <p className='text-xs text-muted-foreground'>{feat.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3-info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className='inline-flex items-center gap-2 text-primary mb-3'>
                  <Rocket className='size-5' />
                  <span className='text-sm font-medium'>Todo listo</span>
                </div>
                <h2 className='text-2xl font-bold tracking-tight mb-2'>
                  Comienza a gestionar tu negocio
                </h2>
                <p className='text-muted-foreground text-sm mb-8 max-w-md'>
                  Tu plataforma ERP está lista. Aquí tienes lo que puedes hacer desde hoy.
                </p>

                <div className='space-y-3'>
                  {[
                    'Registrar tus primeros productos en inventario',
                    'Crear cotizaciones y órdenes de venta',
                    'Configurar tu catálogo de proveedores',
                    'Gestionar empleados y nómina',
                    'Generar reportes financieros en tiempo real',
                  ].map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.08 }}
                      className='flex items-center gap-3 p-3 rounded-xl bg-background/60 dark:bg-background/40 border border-border/50'
                    >
                      <div className='size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0'>
                        <Check className='size-3.5' />
                      </div>
                      <span className='text-sm'>{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
