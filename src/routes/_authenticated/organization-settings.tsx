import { createFileRoute } from '@tanstack/react-router'
import { SettingsOrganization } from '@/features/settings/organization'

export const Route = createFileRoute('/_authenticated/organization-settings')({
    component: OrganizationSettingsPage,
})

function OrganizationSettingsPage() {
    return (
        <div className='px-4 py-6 sm:px-6 lg:px-8'>
            <SettingsOrganization />
        </div>
    )
}
