import { cn } from '@asteby/metacore-ui/lib'

interface ContentSectionProps {
  title: string
  desc: string
  children: React.ReactNode
  className?: string
}

export function ContentSection({
  title,
  desc,
  children,
  className,
}: ContentSectionProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h3 className='text-lg font-medium'>{title}</h3>
        <p className='text-muted-foreground text-sm'>{desc}</p>
      </div>
      <div>{children}</div>
    </div>
  )
}
