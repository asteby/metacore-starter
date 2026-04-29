import { registerActionComponent } from '@/components/dynamic/action-registry'
import { StampFiscalModal } from './stamp-fiscal-modal'
import { CancelFiscalModal } from './cancel-fiscal-modal'

/**
 * Register compiled modal components for fiscal_mexico addon.
 * These override the generic form modal with purpose-built UIs
 * for CFDI stamping and cancellation.
 *
 * Called at app startup — backend controls visibility via metadata.
 * Actions only appear when the addon is installed and enabled.
 */
export function registerFiscalMexico() {
    registerActionComponent('invoices', 'stamp_fiscal', StampFiscalModal)
    registerActionComponent('invoices', 'cancel_fiscal', CancelFiscalModal)
}
