import { Outlet } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Bell, Palette, UserCog } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { SidebarNav, NavItem } from './components/sidebar-nav'

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
        <p className='text-muted-foreground'>
          {t('common.manage_account')}
        </p>
      </div>
      <Separator className='my-4 lg:my-6' />
      <div className='flex flex-col lg:flex-row lg:space-x-12'>
        <aside className='lg:w-1/5 shrink-0 mb-4 lg:mb-0 lg:sticky lg:top-0 lg:self-start'>
          <SidebarNav items={sidebarNavGroups} />
        </aside>
        <div className='flex-1 min-w-0'>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
