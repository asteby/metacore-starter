import { DynamicTable } from '@/components/dynamic-table'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'

export default function ContactsPage() {
    const { t } = useTranslation()

    return (
        <div className='p-6 space-y-6'>
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className='text-3xl font-bold tracking-tight'>{t('contacts.title')}</h2>
                    <p className='text-muted-foreground'>
                        {t('contacts.description')}
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('contacts.directory_title')}</CardTitle>
                    <CardDescription>
                        {t('contacts.directory_description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DynamicTable model="contacts" />
                </CardContent>
            </Card>
        </div>
    )
}
