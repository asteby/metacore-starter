import { useTranslation } from 'react-i18next'
import {
  List,
  Plus,
  Download,
  Upload,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Ban,
  Send,
  Printer,
  UserPlus,
  ToggleLeft,
  ToggleRight,
  CreditCard,
  MinusCircle,
  Copy,
  Cog,
  X,
  Check,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ModulePermissions } from '../api/permissions-api'

const ACTION_ICON_MAP: Record<string, React.ElementType> = {
  index: List,
  create: Plus,
  export: Download,
  import: Upload,
  'action.view': Eye,
  'action.edit': Pencil,
  'action.delete': Trash2,
  'action.approve': CheckCircle,
  'action.reject': XCircle,
  'action.cancel': Ban,
  'action.send': Send,
  'action.print': Printer,
  'action.assign': UserPlus,
  'action.activate': ToggleLeft,
  'action.deactivate': ToggleRight,
  'action.pay': CreditCard,
  'action.void': MinusCircle,
  'action.duplicate': Copy,
}

function getActionIcon(actionKey: string): React.ElementType {
  if (ACTION_ICON_MAP[actionKey]) return ACTION_ICON_MAP[actionKey]

  const lower = actionKey.toLowerCase()
  if (lower.includes('approv') || lower.includes('accept') || lower.includes('confirm'))
    return CheckCircle
  if (lower.includes('reject') || lower.includes('deny')) return XCircle
  if (lower.includes('cancel') || lower.includes('void') || lower.includes('anular'))
    return Ban
  if (lower.includes('pay') || lower.includes('pagar')) return CreditCard
  if (lower.includes('send') || lower.includes('enviar')) return Send
  if (lower.includes('print') || lower.includes('imprimir')) return Printer
  if (lower.includes('assign') || lower.includes('asignar')) return UserPlus
  if (lower.includes('edit') || lower.includes('editar')) return Pencil
  if (lower.includes('view') || lower.includes('ver')) return Eye
  if (lower.includes('delete') || lower.includes('eliminar')) return Trash2
  if (lower.includes('duplicate') || lower.includes('duplicar')) return Copy
  if (lower.includes('export') || lower.includes('descargar')) return Download

  return Cog
}

interface ModuleActionsPanelProps {
  module: ModulePermissions | null
  rolePermissions: string[]
  onToggleAction: (module: string, action: string, checked: boolean) => void
  onSelectAll: (module: string) => void
  onDeselectAll: (module: string) => void
}

export function ModuleActionsPanel({
  module,
  rolePermissions,
  onToggleAction,
  onSelectAll,
  onDeselectAll,
}: ModuleActionsPanelProps) {
  const { t } = useTranslation()

  if (!module) {
    return (
      <div className='flex items-center justify-center h-full text-muted-foreground'>
        <div className='text-center space-y-2'>
          <Cog className='h-12 w-12 mx-auto opacity-30' />
          <p>{t('permissions.select_module_hint')}</p>
        </div>
      </div>
    )
  }

  const checkedCount = module.actions.filter((a) =>
    rolePermissions.includes(`${module.key}.${a}`)
  ).length
  const totalCount = module.actions.length
  const allChecked = checkedCount === totalCount

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
            <Cog className='h-5 w-5 text-primary' />
          </div>
          <div>
            <h3 className='font-semibold text-lg'>
              {t('permissions.allowed_actions')}
            </h3>
            <p className='text-sm text-muted-foreground'>
              {t('permissions.configure_module_permissions')}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Badge
            variant={allChecked ? 'default' : 'secondary'}
            className='text-xs'
          >
            {checkedCount}/{totalCount}
          </Badge>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={() => onSelectAll(module.key)}
            title={t('permissions.select_all')}
          >
            <Check className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={() => onDeselectAll(module.key)}
            title={t('permissions.deselect_all')}
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Actions Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
        {module.actions.map((action) => {
          const permKey = `${module.key}.${action}`
          const isChecked = rolePermissions.includes(permKey)
          const label =
            module.actionLabels[action] ||
            action.replace('action.', '').replace(/_/g, ' ')
          const IconComponent = getActionIcon(action)

          return (
            <label
              key={action}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50 ${
                isChecked ? 'border-primary/50 bg-primary/5' : ''
              }`}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={(checked) =>
                  onToggleAction(module.key, action, !!checked)
                }
              />
              <IconComponent className='h-4 w-4 shrink-0 text-muted-foreground' />
              <span className='text-sm font-medium capitalize'>{label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
