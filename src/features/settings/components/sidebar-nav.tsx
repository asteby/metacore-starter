import { useState, type JSX } from 'react'
import { useLocation, useNavigate, Link } from '@tanstack/react-router'
import { cn } from '@asteby/metacore-ui/lib'
import {
  buttonVariants,
  ScrollArea,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@asteby/metacore-ui/primitives'

export interface NavItem {
  href: string
  title: string
  icon: JSX.Element
}

type SidebarNavProps = React.HTMLAttributes<HTMLElement> & {
  items: {
    title?: string
    items: NavItem[]
  }[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [val, setVal] = useState(pathname ?? '/settings')

  const handleSelect = (e: string) => {
    setVal(e)
    navigate({ to: e })
  }

  return (
    <>
      <div className='p-1 md:hidden'>
        <Select value={val} onValueChange={handleSelect}>
          <SelectTrigger className='h-12 sm:w-48'>
            <SelectValue placeholder='Theme' />
          </SelectTrigger>
          <SelectContent>
            {items.map((group, i) => (
              <SelectGroup key={i}>
                {group.title && <SelectLabel>{group.title}</SelectLabel>}
                {group.items.map((item) => (
                  <SelectItem key={item.href} value={item.href}>
                    <div className='flex gap-x-4 px-2 py-1'>
                      <span className='scale-125'>{item.icon}</span>
                      <span className='text-md'>{item.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea
        orientation='horizontal'
        type='hover'
        className='bg-background hidden w-full min-w-40 px-1 py-2 md:block'
      >
        <nav
          className={cn('flex flex-col space-y-6 py-1', className)}
          {...props}
        >
          {items.map((group, i) => (
            <div key={i} className='flex flex-col space-y-1'>
              {group.title && (
                <h4 className='text-muted-foreground mb-2 px-2 text-sm font-semibold tracking-tight uppercase'>
                  {group.title}
                </h4>
              )}
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    pathname === item.href
                      ? 'bg-muted hover:bg-accent'
                      : 'hover:bg-accent text-muted-foreground hover:underline',
                    'justify-start font-medium'
                  )}
                >
                  <span className='me-2'>{item.icon}</span>
                  {item.title}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </>
  )
}
