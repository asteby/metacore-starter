import { useState, useEffect, useCallback } from 'react'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DynamicTable } from '@/components/dynamic/dynamic-table'
import { CreateDeviceDialog } from './components/create-device-dialog'
import { EditDeviceDialog } from './components/edit-device-dialog'
import { ViewDeviceDialog } from './components/view-device-dialog'
import { ReconnectDeviceDialog } from './components/reconnect-device-dialog'
import { api } from '@/lib/api'

// Define search params for this route
interface DevicesSearchParams {
  reconnect?: string
}

export const Route = createFileRoute('/_authenticated/devices/')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): DevicesSearchParams => {
    return {
      reconnect: typeof search.reconnect === 'string' ? search.reconnect : undefined,
    }
  },
})

function RouteComponent() {
  const { t } = useTranslation()
  const search = useSearch({ from: '/_authenticated/devices/' })
  const [refreshKey, setRefreshKey] = useState(0)
  const [editingDevice, setEditingDevice] = useState<any | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewingDevice, setViewingDevice] = useState<any | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [reconnectDevice, setReconnectDevice] = useState<any | null>(null)
  const [reconnectDialogOpen, setReconnectDialogOpen] = useState(false)

  // Handle reconnect parameter from URL
  useEffect(() => {
    const fetchAndOpenReconnect = async () => {
      if (search.reconnect) {
        try {
          const response = await api.get(`/data/devices/me/${search.reconnect}`)
          if (response.data.success && response.data.data) {
            setReconnectDevice(response.data.data)
            setReconnectDialogOpen(true)
          }
        } catch (error) {
          console.error('Failed to fetch device for reconnect:', error)
        }

        // Clean up URL parameter after processing
        window.history.replaceState({}, '', window.location.pathname)
      }
    }

    fetchAndOpenReconnect()
  }, [search.reconnect])

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])

  const handleAction = (action: string, row: any) => {
    if (action === 'edit') {
      setEditingDevice(row)
      setEditDialogOpen(true)
    } else if (action === 'view') {
      setViewingDevice(row)
      setViewDialogOpen(true)
    } else if (action === 'reconnect') {
      setReconnectDevice(row)
      setReconnectDialogOpen(true)
    }
    // Delete is handled internally by DynamicTable
  }

  return (
    <div className='flex flex-col h-full p-8 gap-4 overflow-hidden'>
      <div className='flex items-center justify-between shrink-0'>
        <h1 className='text-2xl font-bold tracking-tight'>{t('devices.title')}</h1>
        <CreateDeviceDialog onSuccess={handleRefresh} />
      </div>
      <div className='flex-1 min-h-0'>
        <DynamicTable
          model="devices"
          endpoint="/data/devices/me"
          refreshTrigger={refreshKey}
          onAction={handleAction}
          defaultFilters={{ type: 'NOT_IN:simulator' }}
        />
      </div>

      {/* Edit Device Modal */}
      <EditDeviceDialog
        device={editingDevice}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleRefresh}
      />

      {/* View Device Modal */}
      <ViewDeviceDialog
        device={viewingDevice}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />

      {/* Reconnect Device Modal */}
      <ReconnectDeviceDialog
        device={reconnectDevice}
        open={reconnectDialogOpen}
        onOpenChange={setReconnectDialogOpen}
        onSuccess={handleRefresh}
      />
    </div>
  )
}
