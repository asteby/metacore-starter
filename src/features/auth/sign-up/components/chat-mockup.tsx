import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Store, TrendingUp, Package, FileText, Users, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'

type Props = {
  currentStep: number
  organizationName: string
  organizationLogo?: string
}

type DashboardCard = {
  id: number
  label: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: 'sales' | 'inventory' | 'invoices' | 'employees'
  delay: number
}

const dashboardScenarios: DashboardCard[][] = [
  [
    { id: 1, label: 'Ventas del mes', value: '$284,500', change: '+12.5%', trend: 'up', icon: 'sales', delay: 0 },
    { id: 2, label: 'Inventario', value: '1,842', change: '-3.2%', trend: 'down', icon: 'inventory', delay: 400 },
    { id: 3, label: 'Facturas pendientes', value: '23', change: '-8.1%', trend: 'down', icon: 'invoices', delay: 800 },
    { id: 4, label: 'Empleados activos', value: '47', change: '+2.1%', trend: 'up', icon: 'employees', delay: 1200 },
  ],
  [
    { id: 1, label: 'Ventas del mes', value: '$312,800', change: '+18.3%', trend: 'up', icon: 'sales', delay: 0 },
    { id: 2, label: 'Inventario', value: '2,105', change: '+5.7%', trend: 'up', icon: 'inventory', delay: 400 },
    { id: 3, label: 'Facturas pendientes', value: '15', change: '-34.8%', trend: 'down', icon: 'invoices', delay: 800 },
    { id: 4, label: 'Empleados activos', value: '52', change: '+10.6%', trend: 'up', icon: 'employees', delay: 1200 },
  ],
  [
    { id: 1, label: 'Ventas del mes', value: '$198,200', change: '-5.4%', trend: 'down', icon: 'sales', delay: 0 },
    { id: 2, label: 'Inventario', value: '1,650', change: '-9.1%', trend: 'down', icon: 'inventory', delay: 400 },
    { id: 3, label: 'Facturas pendientes', value: '31', change: '+12.0%', trend: 'up', icon: 'invoices', delay: 800 },
    { id: 4, label: 'Empleados activos', value: '45', change: '-4.3%', trend: 'down', icon: 'employees', delay: 1200 },
  ],
]

const iconMap = {
  sales: DollarSign,
  inventory: Package,
  invoices: FileText,
  employees: Users,
}

const iconColorMap = {
  sales: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  inventory: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  invoices: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  employees: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
}

export function ChatMockup({ currentStep: _currentStep, organizationName, organizationLogo }: Props) {
  const [currentScenario, setCurrentScenario] = useState(0)
  const [visibleCards, setVisibleCards] = useState<DashboardCard[]>([])

  useEffect(() => {
    const scenario = dashboardScenarios[currentScenario]
    setVisibleCards([])
    const timeouts: ReturnType<typeof setTimeout>[] = []

    scenario.forEach((card) => {
      timeouts.push(setTimeout(() => {
        setVisibleCards((prev) => [...prev, card])
      }, card.delay))
    })

    timeouts.push(setTimeout(() => {
      setCurrentScenario((prev) => (prev + 1) % dashboardScenarios.length)
    }, 6500))

    return () => { timeouts.forEach(clearTimeout) }
  }, [currentScenario])

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-[340px]"
      >
        {/* Device frame */}
        <div className="bg-[#1a1a1a] rounded-[50px] p-3 shadow-2xl">
          {/* Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[140px] h-[22px] bg-[#1a1a1a] rounded-b-2xl z-20" />

          {/* Screen */}
          <div className="bg-white dark:bg-zinc-900 rounded-[40px] overflow-hidden">
            {/* Dashboard header */}
            <div className="bg-primary px-5 py-3 pt-8 flex items-center gap-3">
              <div className="size-11 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                {organizationLogo ? (
                  <img src={organizationLogo} alt="Logo" className="size-full object-cover" />
                ) : (
                  <Store className="size-6 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-[15px]">
                  {organizationName || 'Tu Empresa'}
                </h3>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="size-3 text-white/80" />
                  <span className="text-white/80 text-xs">Panel de control</span>
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="min-h-[400px] bg-gray-50 dark:bg-zinc-950 p-4">
              {/* Section title */}
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  Resumen general
                </span>
                <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                  Marzo 2026
                </span>
              </div>

              {/* Metric cards grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <AnimatePresence mode="popLayout">
                  {visibleCards.map((card) => {
                    const Icon = iconMap[card.icon]
                    return (
                      <motion.div
                        key={`${currentScenario}-${card.id}`}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="bg-white dark:bg-zinc-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-zinc-700/50"
                      >
                        <div className={cn('size-8 rounded-lg flex items-center justify-center mb-2', iconColorMap[card.icon])}>
                          <Icon className="size-4" />
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 mb-0.5">{card.label}</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{card.value}</p>
                        <div className={cn(
                          'flex items-center gap-0.5 mt-1',
                          card.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                        )}>
                          {card.trend === 'up'
                            ? <ArrowUpRight className="size-3" />
                            : <ArrowDownRight className="size-3" />
                          }
                          <span className="text-[10px] font-medium">{card.change}</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {/* Mini activity chart placeholder */}
              <AnimatePresence>
                {visibleCards.length >= 4 && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-3 bg-white dark:bg-zinc-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-zinc-700/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-gray-600 dark:text-zinc-300">Ventas semanal</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">+8.4%</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-12">
                      {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ duration: 0.5, delay: i * 0.07 }}
                          className={cn(
                            'flex-1 rounded-sm',
                            i === 5 ? 'bg-primary' : 'bg-primary/20 dark:bg-primary/30'
                          )}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-1.5">
                      {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                        <span key={d} className="text-[8px] text-gray-400 dark:text-zinc-500 flex-1 text-center">{d}</span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom nav bar */}
            <div className="bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 px-6 py-2 flex items-center justify-around">
              {[
                { icon: TrendingUp, label: 'Inicio', active: true },
                { icon: Package, label: 'Inventario', active: false },
                { icon: FileText, label: 'Facturas', active: false },
                { icon: Users, label: 'Equipo', active: false },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-0.5">
                  <item.icon className={cn('size-4', item.active ? 'text-primary' : 'text-gray-400 dark:text-zinc-500')} />
                  <span className={cn('text-[9px]', item.active ? 'text-primary font-medium' : 'text-gray-400 dark:text-zinc-500')}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Home indicator */}
            <div className="bg-white dark:bg-zinc-900 h-7 flex items-center justify-center pb-1">
              <div className="w-28 h-1 bg-gray-300 dark:bg-zinc-600 rounded-full" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
