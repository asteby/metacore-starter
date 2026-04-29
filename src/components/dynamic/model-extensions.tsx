import React from 'react'
import { SessionBar } from '@/features/pos/components/session-bar'

/**
 * Model Extension Registry
 *
 * Inject custom UI into dynamic model views without breaking the
 * dynamic architecture. Any model can register a header, toolbar,
 * or footer component that auto-renders in /m/$model pages.
 */

export interface ModelExtension {
  /** Rendered above the table (e.g. SessionBar for cashier queue) */
  header?: React.ComponentType
  /** Rendered in the toolbar next to export/import */
  toolbarActions?: React.ComponentType
  /** Rendered below the table */
  footer?: React.ComponentType
  /** Hide the default "Crear" button */
  hideCreate?: boolean
}

const registry: Record<string, ModelExtension> = {
  pos_cashier_queue: {
    header: SessionBar,
    hideCreate: true,
  },
}

export function getModelExtension(model: string): ModelExtension | null {
  return registry[model] ?? null
}
