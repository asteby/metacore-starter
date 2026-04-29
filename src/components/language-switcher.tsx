import { useTranslation } from 'react-i18next'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Languages } from 'lucide-react'

export function LanguageSwitcher() {
    const { i18n } = useTranslation()

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang)
        // Reload metadata if needed, or rely on react-query invalidation
        // For now, let's just let the metadata cache handled in backend (where env != production)
        // or the fact that metadata should be re-fetched on lang change.
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='h-9 w-9'>
                    <Languages className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all' />
                    <span className='sr-only'>Toggle language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => changeLanguage('en')}>
                    English {i18n.language === 'en' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('es')}>
                    Español {i18n.language === 'es' && '✓'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
