import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/assets/logo'
import { ForgotPasswordForm } from './components/forgot-password-form'
import { ChatMockup } from '../sign-up/components/chat-mockup'

export function ForgotPassword() {
  return (
    <div className='h-svh flex overflow-hidden'>
      {/* Left Side - Form */}
      <div className='w-full lg:w-1/2 flex flex-col bg-background'>
        {/* Fixed Header */}
        <div className='px-6 pt-8 pb-4 lg:px-12 xl:px-20 max-w-lg mx-auto w-full'>
          <div className='flex items-center justify-center gap-3'>
            <Link to='/' className='inline-flex items-center gap-2 group'>
              <Logo className='size-7 transition-transform group-hover:scale-110' />
              <span className='text-lg font-semibold'>Ops</span>
            </Link>
            <span className='text-muted-foreground/50'>|</span>
            <div className='text-sm text-muted-foreground'>
              <Link
                to='/sign-in'
                className='inline-flex items-center gap-1 text-primary font-medium hover:underline underline-offset-4'
              >
                <ArrowLeft className="size-3" />
                Volver al login
              </Link>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className='flex-1 flex flex-col justify-center px-6 lg:px-12 xl:px-20 max-w-lg mx-auto w-full'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className='mb-8 text-center lg:text-left'>
              <h1 className='text-2xl font-bold tracking-tight'>Recuperar acceso</h1>
              <p className='text-muted-foreground text-sm mt-1'>
                Te enviaremos instrucciones a tu correo.
              </p>
            </div>
            <ForgotPasswordForm />
          </motion.div>
        </div>

        {/* Footer */}
        <div className='px-6 py-6 lg:px-12 xl:px-20 max-w-lg mx-auto w-full border-t'>
          <p className='text-center text-xs text-muted-foreground'>
            ¿Necesitas ayuda? <a href="mailto:soporte@link.com" className="text-primary hover:underline">Soporte técnico</a>
          </p>
        </div>
      </div>

      {/* Right Side - Chat Mockup */}
      <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 flex-col items-center pt-12 relative overflow-hidden'>
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
          <div className='absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl' />
          <div className='absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-3xl' />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className='relative z-10 text-center mb-6 px-8'
        >
          <h1 className='text-2xl font-bold tracking-tight mb-2'>
            Seguridad primero
          </h1>
          <p className='text-muted-foreground text-sm max-w-xs mx-auto'>
            Tus datos y los de tus clientes están siempre protegidos con encriptación de grado militar.
          </p>
        </motion.div>

        <div className='relative z-10 flex-1 w-full flex justify-center'>
          <ChatMockup currentStep={2} organizationName='Seguridad Ops' />
        </div>
      </div>
    </div>
  )
}
