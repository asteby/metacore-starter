import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Plus,
  Save,
  ShieldCheck,
  Pencil,
  Trash2,
  Users,
  ChevronsUpDown,
  Check,
  Loader2,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useModules,
  useRoles,
  useRolePermissions,
  useSyncAllRolePermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from './api/permissions-api'
import type { Role, ModulePermissions } from './api/permissions-api'
import { ModuleActionsPanel } from './components/module-actions-panel'
import { RoleFormDialog } from './components/role-form-dialog'
import { cn } from '@/lib/utils'

// Group modules by navigation category for hierarchical display
const MODULE_GROUPS: Record<string, string[]> = {
  sales: [
    'customers', 'sales_orders', 'invoices', 'payments', 'sales_returns',
    'price_lists', 'pos_sales', 'pos_sessions', 'pos_payment_methods', 'pos_payment_sub_methods',
  ],
  purchases: ['suppliers', 'purchase_orders', 'goods_receipts', 'supplier_invoices'],
  inventory: [
    'products', 'categories', 'brands', 'warehouses', 'stock_levels',
    'inventory_adjustments', 'warehouse_transfers',
  ],
  finance: [
    'accounts', 'journal_entries', 'taxes', 'bank_accounts', 'cost_centers',
    'fiscal_periods', 'payment_terms',
  ],
  hr: ['employees', 'departments', 'positions', 'payroll_periods'],
  system: [
    'users', 'roles', 'permissions', 'branches', 'audit_logs',
    'sequences', 'settings', 'unit_of_measures',
  ],
}

const GROUP_LABELS: Record<string, string> = {
  sales: 'permissions.group_sales',
  purchases: 'permissions.group_purchases',
  inventory: 'permissions.group_inventory',
  finance: 'permissions.group_finance',
  hr: 'permissions.group_hr',
  system: 'permissions.group_system',
  other: 'permissions.group_other',
}

export function Permissions() {
  const { t } = useTranslation()

  const { data: roles = [] } = useRoles()
  const { data: modules = [] } = useModules()

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [selectedModuleKey, setSelectedModuleKey] = useState<string | null>(null)
  const [localPermissions, setLocalPermissions] = useState<string[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [moduleOpen, setModuleOpen] = useState(false)
  const [roleFormOpen, setRoleFormOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null)

  const {
    data: serverPermissions = [],
    isLoading: permissionsLoading,
  } = useRolePermissions(selectedRoleId)

  const syncPermissions = useSyncAllRolePermissions()
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()
  const deleteRole = useDeleteRole()

  useEffect(() => {
    setLocalPermissions(serverPermissions)
    setHasChanges(false)
  }, [serverPermissions])

  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(roles[0].id)
    }
  }, [roles, selectedRoleId])

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  )

  const selectedModule = useMemo(
    () => modules.find((m) => m.key === selectedModuleKey) ?? null,
    [modules, selectedModuleKey]
  )

  // Build module lookup for group label
  const moduleGroupLabel = useMemo(() => {
    const map: Record<string, string> = {}
    for (const [groupKey, keys] of Object.entries(MODULE_GROUPS)) {
      for (const key of keys) {
        map[key] = t(GROUP_LABELS[groupKey] || groupKey)
      }
    }
    return map
  }, [t])

  // Group modules for combobox display
  const groupedModules = useMemo(() => {
    const assigned = new Set(Object.values(MODULE_GROUPS).flat())
    const groups: { key: string; label: string; modules: ModulePermissions[] }[] = []

    for (const [groupKey, moduleKeys] of Object.entries(MODULE_GROUPS)) {
      const groupModules = moduleKeys
        .map((key) => modules.find((m) => m.key === key))
        .filter(Boolean) as ModulePermissions[]
      if (groupModules.length > 0) {
        groups.push({ key: groupKey, label: GROUP_LABELS[groupKey] || groupKey, modules: groupModules })
      }
    }

    const otherModules = modules.filter((m) => !assigned.has(m.key))
    if (otherModules.length > 0) {
      groups.push({ key: 'other', label: GROUP_LABELS.other, modules: otherModules })
    }
    return groups
  }, [modules])

  const handleToggleAction = useCallback(
    (moduleKey: string, action: string, checked: boolean) => {
      const permKey = `${moduleKey}.${action}`
      setLocalPermissions((prev) =>
        checked ? [...prev, permKey] : prev.filter((p) => p !== permKey)
      )
      setHasChanges(true)
    },
    []
  )

  const handleSelectAll = useCallback(
    (moduleKey: string) => {
      const mod = modules.find((m) => m.key === moduleKey)
      if (!mod) return
      const allPerms = mod.actions.map((a) => `${moduleKey}.${a}`)
      setLocalPermissions((prev) => {
        const without = prev.filter((p) => !p.startsWith(`${moduleKey}.`))
        return [...without, ...allPerms]
      })
      setHasChanges(true)
    },
    [modules]
  )

  const handleDeselectAll = useCallback((moduleKey: string) => {
    setLocalPermissions((prev) => prev.filter((p) => !p.startsWith(`${moduleKey}.`)))
    setHasChanges(true)
  }, [])

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return
    try {
      await syncPermissions.mutateAsync({ roleId: selectedRoleId, permissions: localPermissions })
      setHasChanges(false)
      toast.success(t('permissions.saved_successfully'))
    } catch {
      toast.error(t('permissions.save_error'))
    }
  }

  const handleSaveRole = async (data: { name: string; label: string; description: string }) => {
    try {
      if (editingRole) {
        await updateRole.mutateAsync({ id: editingRole.id, ...data })
        toast.success(t('permissions.role_updated'))
      } else {
        await createRole.mutateAsync(data)
        toast.success(t('permissions.role_created'))
      }
      setRoleFormOpen(false)
      setEditingRole(null)
    } catch {
      toast.error(t('permissions.role_save_error'))
    }
  }

  const handleDeleteRole = async () => {
    if (!deleteRoleId) return
    try {
      await deleteRole.mutateAsync(deleteRoleId)
      if (selectedRoleId === deleteRoleId) setSelectedRoleId(null)
      toast.success(t('permissions.role_deleted'))
    } catch {
      toast.error(t('permissions.role_delete_error'))
    } finally {
      setDeleteRoleId(null)
    }
  }

  const getModulePermCount = (moduleKey: string) =>
    localPermissions.filter((p) => p.startsWith(`${moduleKey}.`)).length

  return (
    <div className='flex flex-col h-full p-6 gap-4 overflow-hidden'>
      {/* Header */}
      <div className='flex items-center justify-between shrink-0'>
        <div className='flex items-center gap-3'>
          <ShieldCheck className='h-7 w-7 text-primary' />
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>{t('permissions.title')}</h1>
            <p className='text-sm text-muted-foreground'>{t('permissions.description')}</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => { setEditingRole(null); setRoleFormOpen(true) }}>
            <Plus className='mr-2 h-4 w-4' />
            {t('permissions.new_role')}
          </Button>
          <Button onClick={handleSavePermissions} disabled={!hasChanges || syncPermissions.isPending}>
            {syncPermissions.isPending
              ? <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              : <Save className='mr-2 h-4 w-4' />}
            {t('permissions.save_permissions')}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className='flex-1 min-h-0 grid grid-cols-12 gap-4'>
        {/* Left Panel */}
        <div className='col-span-4 xl:col-span-3 flex flex-col gap-4 min-h-0'>
          {/* Role Combobox */}
          <Card className='shrink-0'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base flex items-center gap-2'>
                <Users className='h-4 w-4' />
                {t('permissions.role')}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    role='combobox'
                    aria-expanded={roleOpen}
                    className='w-full justify-between'
                  >
                    <span className='truncate'>
                      {selectedRole?.label || selectedRole?.name || t('permissions.select_role_hint')}
                    </span>
                    <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-[--radix-popover-trigger-width] p-0' align='start'>
                  <Command>
                    <CommandInput placeholder={t('permissions.search_roles')} />
                    <CommandList>
                      <CommandEmpty>{t('permissions.no_roles_found')}</CommandEmpty>
                      <CommandGroup>
                        {roles.map((role) => (
                          <CommandItem
                            key={role.id}
                            value={role.label || role.name}
                            onSelect={() => {
                              setSelectedRoleId(role.id)
                              setSelectedModuleKey(null)
                              setRoleOpen(false)
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', selectedRoleId === role.id ? 'opacity-100' : 'opacity-0')} />
                            {role.color && (
                              <div className='h-3 w-3 rounded-full shrink-0' style={{ backgroundColor: role.color }} />
                            )}
                            <div className='flex flex-col'>
                              <span>{role.label || role.name}</span>
                              {role.description && (
                                <span className='text-xs text-muted-foreground'>{role.description}</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Role actions */}
              {selectedRole && (
                <>
                  <Separator />
                  <div className='flex items-center gap-2'>
                    <span className='text-xs text-muted-foreground'>{t('permissions.actions')}</span>
                    <div className='flex gap-1 ml-auto'>
                      <Button
                        variant='ghost' size='sm' className='h-7 px-2 text-xs'
                        onClick={() => { setEditingRole(selectedRole); setRoleFormOpen(true) }}
                      >
                        <Pencil className='h-3 w-3 mr-1' />
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant='ghost' size='sm'
                        className='h-7 px-2 text-xs text-destructive hover:text-destructive'
                        onClick={() => setDeleteRoleId(selectedRole.id)}
                      >
                        <Trash2 className='h-3 w-3' />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Module Combobox */}
          <Card className='shrink-0'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base flex items-center gap-2'>
                <Package className='h-4 w-4' />
                {t('permissions.module')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Popover open={moduleOpen} onOpenChange={setModuleOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    role='combobox'
                    aria-expanded={moduleOpen}
                    className='w-full justify-between'
                    disabled={!selectedRoleId}
                  >
                    <span className='truncate'>
                      {selectedModule
                        ? `${moduleGroupLabel[selectedModule.key] || t('permissions.group_other')} > ${selectedModule.label}`
                        : t('permissions.select_module_hint_short')}
                    </span>
                    <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-[--radix-popover-trigger-width] p-0' align='start'>
                  <Command>
                    <CommandInput placeholder={t('permissions.search_modules')} />
                    <CommandList>
                      <CommandEmpty>{t('permissions.no_modules_found')}</CommandEmpty>
                      {groupedModules.map((group, gi) => (
                        <div key={group.key}>
                          {gi > 0 && <CommandSeparator />}
                          <CommandGroup heading={t(group.label)}>
                            {group.modules.map((mod) => {
                              const permCount = getModulePermCount(mod.key)
                              const totalActions = mod.actions.length
                              return (
                                <CommandItem
                                  key={mod.key}
                                  value={`${t(group.label)} ${mod.label} ${mod.key}`}
                                  onSelect={() => {
                                    setSelectedModuleKey(mod.key)
                                    setModuleOpen(false)
                                  }}
                                >
                                  <Check className={cn('mr-2 h-4 w-4', selectedModuleKey === mod.key ? 'opacity-100' : 'opacity-0')} />
                                  <span className='flex-1 truncate'>{mod.label}</span>
                                  <Badge
                                    variant={permCount === totalActions ? 'default' : permCount > 0 ? 'secondary' : 'outline'}
                                    className='text-[10px] h-5 min-w-[2rem] justify-center ml-2'
                                  >
                                    {permCount}/{totalActions}
                                  </Badge>
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </div>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Actions */}
        <Card className='col-span-8 xl:col-span-9 min-h-0 flex flex-col'>
          <CardContent className='flex-1 min-h-0 p-6 overflow-auto'>
            {!selectedRoleId ? (
              <div className='flex items-center justify-center h-full text-muted-foreground'>
                <div className='text-center space-y-2'>
                  <Users className='h-12 w-12 mx-auto opacity-30' />
                  <p>{t('permissions.select_role_hint')}</p>
                </div>
              </div>
            ) : permissionsLoading ? (
              <div className='flex items-center justify-center h-full'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
              </div>
            ) : (
              <div className='space-y-6'>
                {/* Selected role info */}
                <div className='flex items-center gap-3 pb-2'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
                    <Users className='h-5 w-5 text-primary' />
                  </div>
                  <div>
                    <h2 className='font-semibold'>{selectedRole?.label || selectedRole?.name}</h2>
                    <p className='text-sm text-muted-foreground'>
                      {selectedRole?.description || t('permissions.no_description')}
                    </p>
                  </div>
                  {hasChanges && (
                    <Badge variant='secondary' className='ml-auto'>
                      {t('permissions.unsaved_changes')}
                    </Badge>
                  )}
                </div>

                <Separator />

                <ModuleActionsPanel
                  module={selectedModule}
                  rolePermissions={localPermissions}
                  onToggleAction={handleToggleAction}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <RoleFormDialog
        open={roleFormOpen}
        onOpenChange={setRoleFormOpen}
        role={editingRole}
        onSave={handleSaveRole}
        loading={createRole.isPending || updateRole.isPending}
      />

      <AlertDialog open={!!deleteRoleId} onOpenChange={(open) => !open && setDeleteRoleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('permissions.delete_role_confirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('permissions.delete_role_warning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRole}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
