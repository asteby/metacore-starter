/** Shared types for the print template system */

export type PrintSize = 'ticket' | 'letter' | 'a4'

export interface PrintLineItem {
  qty: number
  description: string
  identifier?: string
  unit_price: number
  discount?: number // percentage 0-100
  total: number
}

export interface PrintPayment {
  method: string
  amount: number
  reference?: string
}

export interface PrintDocument {
  /** "Ticket de Venta", "Orden de Compra", "Nota de Almacén", etc. */
  title: string
  /** Document number e.g. POS-260328-0001 */
  number: string
  /** ISO date string */
  date: string
  /** Optional status badge */
  status?: string
  /** Who created/processed this */
  cashier?: string
  /** Customer or supplier name */
  party?: {
    label: string  // "Cliente", "Proveedor"
    name: string
    identifier?: string  // RFC, tax ID
    address?: string
    phone?: string
    email?: string
  }
  items: PrintLineItem[]
  /** Tax breakdown */
  tax?: {
    label: string  // "IVA (16%)"
    amount: number
    included?: boolean
  }
  subtotal: number
  total: number
  /** Payments (for POS tickets) */
  payments?: PrintPayment[]
  totalPaid?: number
  change?: number
  /** Notes at the bottom */
  notes?: string
  /** Fiscal / CFDI data */
  fiscal?: {
    uuid?: string
    regime?: string
    usage?: string
    stamp_date?: string
  }
  /** Custom footer message */
  footer?: string
  /** Session info (for POS) */
  session?: string
}

export interface PrintOrganization {
  name: string
  logo?: string
  address?: string
  phone?: string
  email?: string
  taxId?: string  // RFC
}
