import { Construction, Sparkles, Rocket } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Main } from '@/components/layout/main'

interface ComingSoonProps {
  title?: string
  description?: string
  icon?: 'construction' | 'sparkles' | 'rocket'
}

export function ComingSoon({ 
  title,
  description,
  icon = 'construction'
}: ComingSoonProps) {
  const { t } = useTranslation()
  
  const icons = {
    construction: Construction,
    sparkles: Sparkles,
    rocket: Rocket
  }
  
  const Icon = icons[icon]
  const displayTitle = title || t('coming_soon.default_title')
  const displayDescription = description || t('coming_soon.default_description')

  return (
    <Main fixed>
      <div className='flex h-full flex-col items-center justify-center'>
        <div className='relative'>
          {/* Glow effect */}
          <div className='absolute inset-0 blur-3xl opacity-20 bg-primary rounded-full scale-150' />
          
          {/* Icon container */}
          <div className='relative h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-8'>
            <Icon className='h-12 w-12 text-primary' />
          </div>
        </div>

        <div className='text-center space-y-3 max-w-md'>
          <h1 className='text-2xl font-bold tracking-tight'>
            {displayTitle} <span className='inline-block animate-bounce'>🚀</span>
          </h1>
          <p className='text-muted-foreground'>
            {displayDescription}
          </p>
          <p className='text-sm text-muted-foreground/60 pt-4'>
            {t('coming_soon.access_soon')}
          </p>
        </div>

        {/* Decorative dots */}
        <div className='flex gap-1.5 mt-8'>
          <div className='h-2 w-2 rounded-full bg-primary animate-pulse' />
          <div className='h-2 w-2 rounded-full bg-primary/60 animate-pulse' style={{ animationDelay: '150ms' }} />
          <div className='h-2 w-2 rounded-full bg-primary/30 animate-pulse' style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </Main>
  )
}
