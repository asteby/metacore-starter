import { Zap, Rocket, Building2 } from 'lucide-react'
import i18n from '@/i18n/i18n'

const t = (key: string) => i18n.t(key)

export const PLANS = {
  basico: {
    slug: 'basico',
    get name() { return t('plans.basico.name') },
    get description() { return t('plans.basico.description') },
    icon: Zap,
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    price: {
      monthly: 19,
      yearly: 190,
    },
    limits: {
      agents: 1,
      contacts: 500,
      messagesMonth: 1000,
      devices: 1,
      users: 1,
    },
    get features() {
      return [
        t('plans.basico.features.basic_chatbot'),
        t('plans.basico.features.auto_responses'),
        t('plans.basico.features.one_device'),
        t('plans.basico.features.email_support'),
      ]
    },
  },
  pro: {
    slug: 'pro',
    get name() { return t('plans.pro.name') },
    get description() { return t('plans.pro.description') },
    icon: Rocket,
    gradient: 'from-violet-500 to-purple-500',
    bgGradient: 'bg-gradient-to-br from-violet-500 to-purple-500',
    popular: true,
    price: {
      monthly: 49,
      yearly: 490,
    },
    limits: {
      agents: 3,
      contacts: 2000,
      messagesMonth: 5000,
      devices: 3,
      users: 5,
    },
    get features() {
      return [
        t('plans.pro.features.advanced_chatbot'),
        t('plans.pro.features.auto_responses'),
        t('plans.pro.features.three_devices'),
        t('plans.pro.features.integrations'),
        t('plans.pro.features.reports'),
        t('plans.pro.features.priority_support'),
      ]
    },
  },
  negocio: {
    slug: 'negocio',
    get name() { return t('plans.negocio.name') },
    get description() { return t('plans.negocio.description') },
    icon: Building2,
    gradient: 'from-amber-500 to-orange-500',
    bgGradient: 'bg-gradient-to-br from-amber-500 to-orange-500',
    price: {
      monthly: 99,
      yearly: 990,
    },
    limits: {
      agents: 10,
      contacts: 10000,
      messagesMonth: 20000,
      devices: 10,
      users: 20,
    },
    get features() {
      return [
        t('plans.negocio.features.advanced_ai'),
        t('plans.negocio.features.auto_responses'),
        t('plans.negocio.features.ten_devices'),
        t('plans.negocio.features.advanced_integrations'),
        t('plans.negocio.features.advanced_reports'),
        t('plans.negocio.features.api_access'),
        t('plans.negocio.features.dedicated_support'),
        t('plans.negocio.features.custom_onboarding'),
      ]
    },
  },
} as const

export type PlanSlug = keyof typeof PLANS
export type Plan = (typeof PLANS)[PlanSlug]

export const PLAN_LIST = Object.values(PLANS)
