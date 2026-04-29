import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  FileBarChart,
  Scale,
  TrendingUp,
  Banknote,
  BookOpen,
  PiggyBank,
} from 'lucide-react'

export const Route = createFileRoute('/_authenticated/reports/financial/')({
  component: FinancialReportsPage,
})

const reportCards = [
  {
    key: 'trial-balance',
    icon: Scale,
    color: 'text-blue-600 bg-blue-50',
    href: '/reports/financial/trial-balance',
  },
  {
    key: 'balance-sheet',
    icon: FileBarChart,
    color: 'text-green-600 bg-green-50',
    href: '/reports/financial/balance-sheet',
  },
  {
    key: 'profit-loss',
    icon: TrendingUp,
    color: 'text-purple-600 bg-purple-50',
    href: '/reports/financial/profit-loss',
  },
  {
    key: 'cash-flow',
    icon: Banknote,
    color: 'text-orange-600 bg-orange-50',
    href: '/reports/financial/cash-flow',
  },
  {
    key: 'general-ledger',
    icon: BookOpen,
    color: 'text-indigo-600 bg-indigo-50',
    href: '/reports/financial/general-ledger',
  },
  {
    key: 'budget-vs-actual',
    icon: PiggyBank,
    color: 'text-rose-600 bg-rose-50',
    href: '/reports/financial/budget-vs-actual',
  },
]

function FinancialReportsPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-col flex-1 p-8 gap-6 overflow-hidden">
        <h1 className="text-2xl font-bold tracking-tight shrink-0">
          {t('reports.financial.title', 'Reportes Financieros')}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportCards.map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.key}
                to={card.href}
                className="flex items-start gap-4 p-5 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {t(`reports.financial.${card.key}.title`, card.key)}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t(`reports.financial.${card.key}.description`, '')}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
