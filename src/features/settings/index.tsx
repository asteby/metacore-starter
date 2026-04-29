import { Outlet } from '@tanstack/react-router'
import { Separator } from '@asteby/metacore-ui/primitives'
import { Bell, Palette, UserCog } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SidebarNav, type NavItem } from './components/sidebar-nav'

export function Settings() {
  const { t } = useTranslation()

  const profileItems: NavItem[] = [
    {
      title: t('common.profile'),
      href: '/settings',
      icon: <UserCog size={18} />,
    },
    {
      title: t('common.appearance'),
      href: '/settings/appearance',
      icon: <Palette size={18} />,
    },
    {
      title: t('common.notifications'),
      href: '/settings/notifications',
      icon: <Bell size={18} />,
    },
  ]

  const sidebarNavGroups = [
    {
      title: t('common.profile'),
      items: profileItems,
    },
  ]

  return (
    <div className='px-4 py-6 @7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl'>
      <div className='space-y-0.5'>
        <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
          {t('common.settings')}
        </h1>
        <p className='text-muted-foreground'>{t('common.manage_account')}</p>
      </div>
      <Separator className='my-4 lg:my-6' />
      <div className='flex flex-col lg:flex-row lg:space-x-12'>
        <aside className='mb-4 shrink-0 lg:sticky lg:top-0 lg:mb-0 lg:w-1/5 lg:self-start'>
          <SidebarNav items={sidebarNavGroups} />
        </aside>
        <div className='min-w-0 flex-1'>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
