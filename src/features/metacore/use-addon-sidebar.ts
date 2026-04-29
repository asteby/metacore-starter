import { useMemo } from 'react'
import { useNavigation as useMetacoreNavigation } from '@asteby/metacore-sdk/react'
import type { NavGroup as AddonNavGroup, NavItem as AddonNavItem } from '@asteby/metacore-sdk'
import { resolveIcon } from '@/hooks/use-navigation'
import type { NavGroup as SidebarNavGroup, NavItem as SidebarNavItem } from '@/hooks/use-navigation'

export type { SidebarNavGroup, SidebarNavItem }

function toSidebarItem(item: AddonNavItem): SidebarNavItem {
  const url = item.url ?? '#'
  const icon = item.icon ? resolveIcon(item.icon) : undefined
  const children = item.items?.length
    ? item.items.map((child): SidebarNavItem => ({
        title: child.title,
        url: child.url ?? '#',
        icon: child.icon ? resolveIcon(child.icon) : undefined,
      }))
    : undefined
  const base: SidebarNavItem = {
    title: item.title,
    url,
    icon,
  }
  if (children) base.items = children
  return base
}

function toSidebarGroup(group: AddonNavGroup): SidebarNavGroup {
  return {
    title: group.title,
    items: group.items.map(toSidebarItem),
  }
}

/**
 * Returns the list of sidebar groups contributed by installed addons
 * (manifest.navigation), translated into ops' sidebar shape.
 */
export function useAddonSidebar(): SidebarNavGroup[] {
  const nav = useMetacoreNavigation()
  return useMemo(() => nav.map(toSidebarGroup), [nav])
}

/**
 * Helper: given ops' static groups, splice the addon-contributed groups
 * immediately before the last group (typically "System"/"Admin").
 */
export function mergeWithAddonGroups(
  staticGroups: SidebarNavGroup[],
  addonGroups: SidebarNavGroup[],
): SidebarNavGroup[] {
  if (addonGroups.length === 0) return staticGroups
  if (staticGroups.length === 0) return addonGroups
  return [
    ...staticGroups.slice(0, staticGroups.length - 1),
    ...addonGroups,
    staticGroups[staticGroups.length - 1],
  ]
}
