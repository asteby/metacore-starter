import * as React from 'react'
import { registerActionComponent } from '@/components/dynamic/action-registry'
import { api } from '@/lib/api'

// ── Bundled addons (compiled into the app) ──────────────────────────────────

import { registerFiscalMexico } from './fiscal_mexico'

// ── Global bridge for external addon bundles ────────────────────────────────

/**
 * Expose registerActionComponent globally so external addon bundles
 * (loaded via <script>) can register their compiled modals.
 *
 * An addon's frontend.js calls:
 *   window.__addon.registerComponent("invoices", "stamp_dian", MyComponent)
 */
declare global {
    interface Window {
        __addon: {
            registerComponent: typeof registerActionComponent
            React: typeof React
        }
    }
}

// ── Dynamic addon loader ────────────────────────────────────────────────────

const loadedAddons = new Set<string>()

/**
 * Load an external addon's frontend.js bundle from the backend.
 * The script is injected as a <script> tag and executes immediately,
 * calling window.__addon.registerComponent() to register its modals.
 */
function loadExternalAddon(addonKey: string): Promise<void> {
    if (loadedAddons.has(addonKey)) return Promise.resolve()

    return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = `/api/addons/${addonKey}/frontend.js`
        script.async = true
        script.onload = () => {
            loadedAddons.add(addonKey)
            resolve()
        }
        script.onerror = () => reject(new Error(`Failed to load addon: ${addonKey}`))
        document.head.appendChild(script)
    })
}

/**
 * Fetch installed addons from the backend and dynamically load
 * any that have a frontend.js bundle available.
 */
async function loadInstalledAddonBundles() {
    try {
        // Only fetch if user is authenticated
        const token = localStorage.getItem('auth_token')
        if (!token) return

        const res = await api.get('/addons/installed')
        if (!res.data?.success) return

        const installed = res.data.data as Array<{
            addon_key: string
            status: string
            has_frontend: boolean
        }>

        const loads = installed
            .filter((a) => a.status === 'enabled' && a.has_frontend)
            .map((a) => loadExternalAddon(a.addon_key).catch(() => {
                console.warn(`[addons] Failed to load frontend for ${a.addon_key}`)
            }))

        await Promise.allSettled(loads)
    } catch {
        // Silent fail — addons are optional
    }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Initialize the addon system:
 * 1. Expose global bridge for external addon scripts
 * 2. Register bundled addons (compiled into the app)
 * 3. Load external addon bundles from installed addons
 */
export function registerAddons() {
    // 1. Expose bridge — external scripts use this to register components
    window.__addon = {
        registerComponent: registerActionComponent,
        React,
    }

    // 2. Bundled addons (always available, backend controls visibility)
    registerFiscalMexico()

    // 3. Load external addon bundles (async, non-blocking)
    loadInstalledAddonBundles()
}
