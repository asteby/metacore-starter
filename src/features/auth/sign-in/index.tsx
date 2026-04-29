import { useSearch, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ShoppingCart,
  Package,
  FileText,
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
  Wallet,
  ClipboardList,
  Truck,
} from 'lucide-react'
import { Logo } from '@/assets/logo'
import { UserAuthForm } from './components/user-auth-form'

const erpModules = [
  { icon: ShoppingCart, label: 'Ventas', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { icon: Truck, label: 'Compras', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { icon: Package, label: 'Inventario', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { icon: Wallet, label: 'Finanzas', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  { icon: Users, label: 'RRHH', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  { icon: FileText, label: 'Facturación', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
  { icon: BarChart3, label: 'Reportes', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  { icon: ClipboardList, label: 'Proyectos', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
]

const stats = [
  { label: 'Empresas activas', value: '2,400+' },
  { label: 'Transacciones/día', value: '150K+' },
  { label: 'Uptime', value: '99.9%' },
]

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <div className='h-svh flex overflow-hidden'>
      {/* Left Side - Form */}
      <div className='w-full lg:w-[45%] flex flex-col bg-background'>
        {/* Fixed Header */}
        <div className='px-6 pt-8 pb-4 lg:px-12 xl:px-16 max-w-md mx-auto w-full'>
          <div className='flex items-center justify-center gap-3'>
            <Link to='/' className='inline-flex items-center gap-2 group'>
              <Logo className='size-7 transition-transform group-hover:scale-110' />
              <span className='text-lg font-semibold'>Ops</span>
            </Link>
            <span className='text-muted-foreground/50'>|</span>
            <div className='text-sm text-muted-foreground'>
              ¿Nuevo aquí?{' '}
              <Link
                to='/sign-up'
                className='text-primary font-medium hover:underline underline-offset-4'
              >
                Crea una cuenta
              </Link>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className='flex-1 flex flex-col justify-center px-6 lg:px-12 xl:px-16 max-w-md mx-auto w-full'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className='mb-8 text-center lg:text-left'>
              <h1 className='text-2xl font-bold tracking-tight'>Iniciar sesión</h1>
              <p className='text-muted-foreground text-sm mt-1'>
                Accede al panel de administración de tu empresa.
              </p>
            </div>
            <UserAuthForm redirectTo={redirect} />
          </motion.div>
        </div>

        {/* Footer */}
        <div className='px-6 py-6 lg:px-12 xl:px-16 max-w-md mx-auto w-full border-t'>
          <p className='text-center text-xs text-muted-foreground'>
            © {new Date().getFullYear()} Ops. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Right Side - ERP Showcase */}
      <div className='hidden lg:flex lg:w-[55%] bg-muted/50 dark:bg-muted/20 flex-col justify-center relative overflow-hidden'>
        {/* Subtle grid pattern */}
        <div className='absolute inset-0 opacity-[0.03] dark:opacity-[0.05]'
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className='relative z-10 px-12 xl:px-20 max-w-2xl mx-auto w-full'>
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className='mb-10'
          >
            <div className='inline-flex items-center gap-2 text-primary mb-3'>
              <TrendingUp className='size-5' />
              <span className='text-sm font-medium'>Plataforma ERP integral</span>
            </div>
            <h2 className='text-3xl font-bold tracking-tight mb-2'>
              Todo tu negocio,{' '}
              <span className='text-primary'>un solo lugar.</span>
            </h2>
            <p className='text-muted-foreground text-sm max-w-md'>
              Gestiona ventas, compras, inventario, finanzas y recursos humanos desde una plataforma unificada.
            </p>
          </motion.div>

          {/* Module Grid */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className='grid grid-cols-4 gap-3 mb-10'
          >
            {erpModules.map((mod, i) => (
              <motion.div
                key={mod.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
                className='flex flex-col items-center gap-2 p-4 rounded-xl bg-background/60 dark:bg-background/40 border border-border/50 hover:border-primary/30 transition-colors'
              >
                <div className={`size-10 rounded-lg flex items-center justify-center ${mod.color}`}>
                  <mod.icon className='size-5' />
                </div>
                <span className='text-xs font-medium text-muted-foreground'>{mod.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className='flex gap-8 pt-6 border-t border-border/50'
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className='text-2xl font-bold tracking-tight flex items-center gap-1'>
                  <DollarSign className='size-4 text-primary hidden' />
                  {stat.value}
                </div>
                <div className='text-xs text-muted-foreground'>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
