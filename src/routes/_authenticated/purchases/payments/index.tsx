import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/purchases/payments/')({
  component: () => (
    <Navigate to="/m/$model" params={{ model: 'purchase_payments' }} />
  ),
})
