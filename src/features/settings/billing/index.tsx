import { useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PLAN_LIST, type PlanSlug } from '@/config/plans'
import { useAuthStore } from '@/stores/auth-store'

export function Billing() {
  const { t, i18n } = useTranslation()
  const [isYearly, setIsYearly] = useState(false)
  const { auth } = useAuthStore()
  const currentPlan = auth.user?.plan_slug as PlanSlug | undefined

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      {auth.user && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('settings.billing.current_plan')}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex size-10 items-center justify-center rounded-lg text-white",
                currentPlan ? PLAN_LIST.find(p => p.slug === currentPlan)?.bgGradient : 'bg-gray-500'
              )}>
                {currentPlan && (() => {
                  const plan = PLAN_LIST.find(p => p.slug === currentPlan)
                  if (plan) {
                    const Icon = plan.icon
                    return <Icon className="size-5" />
                  }
                  return null
                })()}
              </div>
              <div>
                <p className="font-medium">{auth.user.plan_name || t('settings.billing.no_plan')}</p>
                <p className="text-sm text-muted-foreground">
                  {auth.user.subscription_status === 'trialing' && auth.user.current_period_end && (
                    <>{t('settings.billing.free_trial_until')} {new Date(auth.user.current_period_end).toLocaleDateString(i18n.language)}</>
                  )}
                  {auth.user.subscription_status === 'active' && auth.user.current_period_end && (
                    <>{t('settings.billing.next_billing')}: {new Date(auth.user.current_period_end).toLocaleDateString(i18n.language)}</>
                  )}
                </p>
              </div>
            </div>
            {auth.user.subscription_status === 'trialing' && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                <Sparkles className="mr-1 size-3" />
                {t('settings.billing.free_trial')}
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-3">
        <Label htmlFor="billing-toggle" className={cn(!isYearly && 'font-semibold')}>
          {t('settings.billing.monthly')}
        </Label>
        <Switch
          id="billing-toggle"
          checked={isYearly}
          onCheckedChange={setIsYearly}
        />
        <Label htmlFor="billing-toggle" className={cn(isYearly && 'font-semibold')}>
          {t('settings.billing.yearly')}
          <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
            {t('settings.billing.save_2_months')}
          </Badge>
        </Label>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {PLAN_LIST.map((plan) => {
          const isCurrentPlan = currentPlan === plan.slug
          const Icon = plan.icon
          const price = isYearly ? plan.price.yearly : plan.price.monthly

          return (
            <Card
              key={plan.slug}
              className={cn(
                "relative flex flex-col",
                'popular' in plan && plan.popular && "border-2 border-violet-500 shadow-lg",
                isCurrentPlan && "ring-2 ring-primary"
              )}
            >
              {'popular' in plan && plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-violet-500 hover:bg-violet-500">
                    {t('settings.billing.most_popular')}
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className={cn(
                  "mb-3 flex size-12 items-center justify-center rounded-xl text-white",
                  plan.bgGradient
                )}>
                  <Icon className="size-6" />
                </div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="mb-6">
                  <span className="text-4xl font-bold">${price}</span>
                  <span className="text-muted-foreground">
                    /{isYearly ? t('settings.billing.per_year') : t('settings.billing.per_month')}
                  </span>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className={cn("w-full", 'popular' in plan && plan.popular && "bg-violet-500 hover:bg-violet-600")}
                  variant={isCurrentPlan ? "outline" : "default"}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? t('settings.billing.current_plan_badge') : t('settings.billing.select_plan')}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
