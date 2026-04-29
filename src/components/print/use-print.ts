import { useCallback, useRef } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import type { PrintSize } from './types'

/**
 * Hook that opens a print-ready iframe and triggers browser print dialog.
 * Reads print config from user profile (ticket_width, print_copies).
 */
export function usePrint(size: PrintSize = 'ticket') {
  const contentRef = useRef<HTMLDivElement>(null)
  const ticketWidth = useAuthStore((s) => s.auth.user?.ticket_width) || 80
  const copies = useAuthStore((s) => s.auth.user?.print_copies) || 1

  const printOnce = useCallback(() => {
    return new Promise<void>((resolve) => {
      const el = contentRef.current
      if (!el) { resolve(); return }

      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.top = '-10000px'
      iframe.style.left = '-10000px'
      iframe.style.width = '0'
      iframe.style.height = '0'
      document.body.appendChild(iframe)

      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (!doc) {
        document.body.removeChild(iframe)
        resolve()
        return
      }

      const widthMm = size === 'ticket' ? `${ticketWidth}mm` : '100%'
      const pageSize = size === 'ticket' ? `${ticketWidth}mm auto` : size === 'a4' ? 'A4' : 'letter'

      doc.open()
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            @page { size: ${pageSize}; margin: 0; }
            html, body { width: ${widthMm}; margin: 0; padding: 0; }
          </style>
        </head>
        <body>${el.innerHTML}</body>
        </html>
      `)
      doc.close()

      const images = doc.querySelectorAll('img')
      const imagePromises = Array.from(images).map(
        (img) =>
          new Promise<void>((r) => {
            if (img.complete) return r()
            img.onload = () => r()
            img.onerror = () => r()
          })
      )

      Promise.all(imagePromises).then(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => {
          document.body.removeChild(iframe)
          resolve()
        }, 1000)
      })
    })
  }, [size, ticketWidth])

  const handlePrint = useCallback(async () => {
    for (let i = 0; i < copies; i++) {
      await printOnce()
    }
  }, [copies, printOnce])

  return { contentRef, handlePrint }
}
