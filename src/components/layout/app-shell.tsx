import { Outlet, Link, useLocation } from '@tanstack/react-router'
import { useAuthStore } from '@asteby/metacore-auth'
import {
  AppSidebar,
  AuthenticatedLayout,
  Header,
  NavUser,
  ProfileDropdown,
  type NavGroupData,
} from '@asteby/metacore-ui/layout'
import { getInitials } from '@asteby/metacore-ui/lib'
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@asteby/metacore-ui/primitives'
import {
  LayoutDashboard,
  Settings as SettingsIcon,
  LogOut,
  Store,
} from 'lucide-react'
import { ThemeSwitch } from './theme-switch'

const navGroups: NavGroupData[] = [
  {
    title: 'General',
    items: [
      {
        title: 'Dashboard',
        url: '/',
        icon: LayoutDashboard,
      },
      // Marketplace is wired by default so every starter-based app
      // inherits the addon catalog. Remove this entry (and the
      // marketplace route + feature folder) if your app doesn't expose
      // addons.
      {
        title: 'Marketplace',
        url: '/marketplace',
        icon: Store,
      },
      {
        title: 'Settings',
        url: '/settings',
        icon: SettingsIcon,
      },
    ],
  },
]

export function AppShell() {
  const location = useLocation()
  const auth = useAuthStore((s) => s.auth)
  const user = auth.user
    ? {
        name: auth.user.name,
        email: auth.user.email,
        avatar: auth.user.avatar,
      }
    : { name: 'Guest', email: '' }

  const onSignOut = () => {
    auth.reset()
    window.location.href = '/sign-in'
  }

  return (
    <AuthenticatedLayout
      sidebar={
        <AppSidebar
          navGroups={navGroups}
          currentHref={location.pathname}
          LinkComponent={Link}
          footer={
            <NavUser user={user} onSignOut={onSignOut}>
              <DropdownMenuItem asChild>
                <Link to='/settings'>
                  <SettingsIcon className='size-4' />
                  Settings
                </Link>
              </DropdownMenuItem>
            </NavUser>
          }
        />
      }
      headerChildren={
        <Header className='border-b'>
          <div className='ms-auto flex items-center gap-2'>
            <ThemeSwitch />
            <ProfileDropdown
              user={user}
              fallbackInitials={getInitials(user.name)}
            >
              <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to='/settings'>
                  <SettingsIcon className='size-4' />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onSignOut}>
                <LogOut className='size-4' />
                Sign out
              </DropdownMenuItem>
            </ProfileDropdown>
          </div>
        </Header>
      }
    >
      <Outlet />
    </AuthenticatedLayout>
  )
}
