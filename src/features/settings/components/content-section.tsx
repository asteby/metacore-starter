import { cn } from '@/lib/utils'

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
                <p className='text-sm text-muted-foreground'>{desc}</p>
            </div>
            <div>{children}</div>
        </div>
    )
}
