import { Slot } from '@asteby/metacore-sdk/react'

/**
 * DashboardWidgetsSlot — thin wrapper around the SDK's <Slot> for the
 * canonical "dashboard.widgets" slot name. Addons contribute widgets via
 * `registry.registerSlot({ name: 'dashboard.widgets', component })`.
 */
export function DashboardWidgetsSlot(props: { payload?: Record<string, unknown> }) {
  return <Slot name='dashboard.widgets' payload={props.payload} />
}
