import { forwardRef } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { getStorageUrl } from '@/lib/utils'
import { formatCurrency } from '@/lib/currency-utils'
import type { PrintDocument, PrintSize, PrintOrganization } from './types'

interface PrintTemplateProps {
  document: PrintDocument
  size?: PrintSize
  /** Override org info (otherwise reads from auth store) */
  organization?: PrintOrganization
  /** Show a decorative copy label like "ORIGINAL" / "COPIA" */
  copyLabel?: string
}

/**
 * Professional, reusable print template for tickets, invoices, orders, etc.
 * Font sizes use em units — everything scales from the root baseFontSize
 * which adapts to the configured ticket_width (58/80/110mm).
 *
 * Usage:
 *   const { contentRef, handlePrint } = usePrint('ticket')
 *   <PrintTemplate ref={contentRef} document={doc} size="ticket" />
 *   <Button onClick={handlePrint}>Imprimir</Button>
 */
export const PrintTemplate = forwardRef<HTMLDivElement, PrintTemplateProps>(
  ({ document: doc, size = 'ticket', organization, copyLabel }, ref) => {
    const user = useAuthStore((s) => s.auth.user)
    const currencyCode = user?.currency_code || 'USD'

    const org: PrintOrganization = organization ?? {
      name: user?.organization_name || '',
      logo: user?.organization_logo
        ? getStorageUrl(user.organization_logo, 'organizations')
        : undefined,
    }

    const fmt = (amount: number) => formatCurrency(amount, currencyCode)

    const isTicket = size === 'ticket'
    const ticketWidth = user?.ticket_width || 80
    const width = isTicket ? `${ticketWidth}mm` : '210mm'
    // Adaptive base: 58mm→9px, 80mm→11px, 110mm→13px
    const baseFontSize = isTicket ? Math.round(9 + ((ticketWidth - 58) / 52) * 4) : 12
    const padding = isTicket ? `${Math.round(ticketWidth * 0.05)}mm` : '15mm'
    // Divider characters scale to width
    const dividerLen = isTicket ? Math.floor(ticketWidth / 2.2) : 0

    return (
      <div ref={ref} style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div
          style={{
            width,
            maxWidth: width,
            fontFamily: isTicket
              ? "'Courier New', Courier, monospace"
              : "'Segoe UI', system-ui, -apple-system, sans-serif",
            fontSize: `${baseFontSize}px`,
            lineHeight: isTicket ? '1.3' : '1.5',
            color: '#000',
            background: '#fff',
            padding,
          }}
        >
          {/* ── HEADER ── */}
          <div style={{ textAlign: 'center', marginBottom: isTicket ? '3mm' : '8mm' }}>
            {org.logo && (
              <img
                src={org.logo}
                alt={org.name}
                style={{
                  maxHeight: isTicket ? '40px' : '60px',
                  maxWidth: isTicket ? '60%' : '180px',
                  objectFit: 'contain',
                  marginBottom: '2mm',
                }}
                crossOrigin="anonymous"
              />
            )}
            <div style={{ fontWeight: 700, fontSize: '1.2em', letterSpacing: isTicket ? '0.5px' : '0' }}>
              {org.name}
            </div>
            {org.address && (
              <div style={{ fontSize: '0.82em', color: '#555', marginTop: '1px' }}>{org.address}</div>
            )}
            {org.phone && (
              <div style={{ fontSize: '0.82em', color: '#555' }}>Tel: {org.phone}</div>
            )}
            {org.taxId && (
              <div style={{ fontSize: '0.82em', color: '#555' }}>RFC: {org.taxId}</div>
            )}
          </div>

          <Divider isTicket={isTicket} len={dividerLen} />

          {/* ── DOCUMENT INFO ── */}
          <div style={{ marginBottom: isTicket ? '2mm' : '6mm' }}>
            <div
              style={{
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '1.1em',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '2mm',
              }}
            >
              {doc.title}
            </div>
            <InfoRow label="No." value={doc.number} isTicket={isTicket} />
            <InfoRow
              label="Fecha"
              value={new Date(doc.date).toLocaleString('es-MX', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
              isTicket={isTicket}
            />
            {doc.status && <InfoRow label="Estado" value={doc.status} isTicket={isTicket} />}
            {doc.cashier && <InfoRow label="Cajero" value={doc.cashier} isTicket={isTicket} />}
            {doc.session && <InfoRow label="Sesion" value={doc.session} isTicket={isTicket} />}
            {copyLabel && (
              <div style={{ textAlign: 'center', fontSize: '0.9em', fontWeight: 700, letterSpacing: '2px', marginTop: '1mm', color: '#888' }}>
                — {copyLabel} —
              </div>
            )}
          </div>

          {/* ── PARTY (Customer / Supplier) ── */}
          {doc.party && (
            <>
              <Divider isTicket={isTicket} len={dividerLen} />
              <div style={{ marginBottom: isTicket ? '2mm' : '6mm' }}>
                <InfoRow label={doc.party.label} value={doc.party.name} isTicket={isTicket} bold />
                {doc.party.identifier && <InfoRow label="RFC" value={doc.party.identifier} isTicket={isTicket} />}
                {doc.party.address && <InfoRow label="Dir." value={doc.party.address} isTicket={isTicket} />}
                {doc.party.phone && <InfoRow label="Tel." value={doc.party.phone} isTicket={isTicket} />}
              </div>
            </>
          )}

          {/* ── ITEMS ── */}
          <Divider isTicket={isTicket} len={dividerLen} double />
          {isTicket ? (
            <TicketItems items={doc.items} fmt={fmt} />
          ) : (
            <LetterItems items={doc.items} fmt={fmt} />
          )}
          <Divider isTicket={isTicket} len={dividerLen} double />

          {/* ── TOTALS ── */}
          <div style={{ marginBottom: isTicket ? '2mm' : '6mm' }}>
            <TotalRow label="Subtotal" value={fmt(doc.subtotal)} isTicket={isTicket} />
            {doc.tax && (
              <TotalRow
                label={`${doc.tax.label}${doc.tax.included ? ' incl.' : ''}`}
                value={fmt(doc.tax.amount)}
                isTicket={isTicket}
              />
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: '1.3em',
                marginTop: '1mm',
                paddingTop: '1mm',
                borderTop: '1px solid #000',
              }}
            >
              <span>TOTAL</span>
              <span>{fmt(doc.total)}</span>
            </div>
          </div>

          {/* ── PAYMENTS ── */}
          {doc.payments && doc.payments.length > 0 && (
            <>
              <Divider isTicket={isTicket} len={dividerLen} />
              <div style={{ marginBottom: isTicket ? '2mm' : '4mm' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1mm' }}>
                  Pagos
                </div>
                {doc.payments.map((p, i) => (
                  <div key={i}>
                    <TotalRow label={p.method} value={fmt(p.amount)} isTicket={isTicket} />
                    {p.reference && (
                      <div style={{ fontSize: '0.82em', color: '#666', textAlign: 'right' }}>
                        Ref: {p.reference}
                      </div>
                    )}
                  </div>
                ))}
                {doc.totalPaid != null && (
                  <TotalRow label="Total Pagado" value={fmt(doc.totalPaid)} isTicket={isTicket} bold />
                )}
                {doc.change != null && doc.change > 0 && (
                  <TotalRow label="Cambio" value={fmt(doc.change)} isTicket={isTicket} bold />
                )}
              </div>
            </>
          )}

          {/* ── FISCAL ── */}
          {doc.fiscal && doc.fiscal.uuid && (
            <>
              <Divider isTicket={isTicket} len={dividerLen} />
              <div style={{ fontSize: '0.72em', color: '#555', textAlign: 'center', marginBottom: '2mm', wordBreak: 'break-all' }}>
                <div style={{ fontWeight: 700, marginBottom: '1px' }}>CFDI</div>
                <div>UUID: {doc.fiscal.uuid}</div>
                {doc.fiscal.stamp_date && <div>Timbrado: {doc.fiscal.stamp_date}</div>}
                {doc.fiscal.regime && <div>Regimen: {doc.fiscal.regime}</div>}
              </div>
            </>
          )}

          {/* ── NOTES ── */}
          {doc.notes && (
            <>
              <Divider isTicket={isTicket} len={dividerLen} />
              <div style={{ fontSize: '0.82em', color: '#444', marginBottom: '2mm', whiteSpace: 'pre-wrap' }}>
                {doc.notes}
              </div>
            </>
          )}

          {/* ── FOOTER ── */}
          <Divider isTicket={isTicket} len={dividerLen} />
          <div style={{ textAlign: 'center', fontSize: '0.82em', color: '#888', marginTop: '2mm', paddingBottom: isTicket ? '4mm' : '0' }}>
            {doc.footer || 'Gracias por su compra'}
            <div style={{ fontSize: '0.85em', marginTop: '1mm', color: '#aaa' }}>
              Impreso: {new Date().toLocaleString('es-MX')}
            </div>
          </div>
        </div>
      </div>
    )
  }
)

PrintTemplate.displayName = 'PrintTemplate'

/* ────────────────── Internal sub-components ────────────────── */

function Divider({ isTicket, double, len }: { isTicket: boolean; double?: boolean; len: number }) {
  if (isTicket) {
    const char = double ? '=' : '-'
    return (
      <div style={{ textAlign: 'center', fontSize: '1em', color: '#999', margin: '1mm 0', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {char.repeat(len)}
      </div>
    )
  }
  return (
    <hr style={{ border: 'none', borderTop: double ? '2px solid #333' : '1px solid #ddd', margin: '4mm 0' }} />
  )
}

function InfoRow({ label, value, isTicket: _isTicket, bold }: { label: string; value: string; isTicket: boolean; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', fontWeight: bold ? 700 : 400, lineHeight: '1.4' }}>
      <span style={{ color: '#666', flexShrink: 0 }}>{label}:</span>
      <span style={{ textAlign: 'right', marginLeft: '4px' }}>{value}</span>
    </div>
  )
}

function TotalRow({ label, value, isTicket: _isTicket, bold }: { label: string; value: string; isTicket: boolean; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1em', fontWeight: bold ? 700 : 400, lineHeight: '1.5' }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function TicketItems({ items, fmt }: { items: PrintDocument['items']; fmt: (n: number) => string }) {
  return (
    <div style={{ marginBottom: '1mm' }}>
      {items.map((item, i) => (
        <div key={i} style={{ marginBottom: '1.5mm' }}>
          <div style={{ fontSize: '0.9em', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.description}
          </div>
          {item.identifier && (
            <div style={{ fontSize: '0.72em', color: '#888' }}>{item.identifier}</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em' }}>
            <span>
              {item.qty} x {fmt(item.unit_price)}
              {item.discount ? ` (-${item.discount}%)` : ''}
            </span>
            <span style={{ fontWeight: 600 }}>{fmt(item.total)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function LetterItems({ items, fmt }: { items: PrintDocument['items']; fmt: (n: number) => string }) {
  const thStyle: React.CSSProperties = {
    fontSize: '0.85em',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#555',
    padding: '4px 6px',
    borderBottom: '2px solid #333',
    textAlign: 'left',
  }
  const tdStyle: React.CSSProperties = {
    fontSize: '0.92em',
    padding: '4px 6px',
    borderBottom: '1px solid #eee',
    verticalAlign: 'top',
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2mm' }}>
      <thead>
        <tr>
          <th style={{ ...thStyle, width: '8%', textAlign: 'center' }}>Cant</th>
          <th style={thStyle}>Descripcion</th>
          <th style={{ ...thStyle, width: '18%', textAlign: 'right' }}>P. Unit</th>
          <th style={{ ...thStyle, width: '10%', textAlign: 'center' }}>Dto.</th>
          <th style={{ ...thStyle, width: '18%', textAlign: 'right' }}>Total</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={i}>
            <td style={{ ...tdStyle, textAlign: 'center' }}>{item.qty}</td>
            <td style={tdStyle}>
              <div style={{ fontWeight: 500 }}>{item.description}</div>
              {item.identifier && <div style={{ fontSize: '0.8em', color: '#888' }}>{item.identifier}</div>}
            </td>
            <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(item.unit_price)}</td>
            <td style={{ ...tdStyle, textAlign: 'center' }}>{item.discount ? `${item.discount}%` : '\u2014'}</td>
            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(item.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
