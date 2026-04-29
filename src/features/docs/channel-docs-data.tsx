// =======================================
// Documentation Data — Client-Facing Only
// Covers: API Token usage, Webhook events, code examples
// NO internal setup, NO env vars, NO server config
// =======================================

import i18n from '@/i18n/i18n'

export interface ApiEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    path: string
    description: string
    requiresAuth: 'token' | 'jwt'
}

export interface WebhookEvent {
    name: string
    description: string
}

export interface CodeExample {
    title: string
    language: string
    code: string
}

export interface DocsData {
    apiIntro: string
    tokenInfo: {
        prefix: string
        maxPerDevice: number
        scopes: string[]
        expirations: string[]
        authMethods: { title: string; header: string; example: string }[]
    }
    apiEndpoints: ApiEndpoint[]
    webhookIntro: string
    webhookEvents: WebhookEvent[]
    webhookPayloadExample: string
    webhookVerificationCode: string
    codeExamples: CodeExample[]
}

const t = (key: string, options?: any): string => i18n.t(key, options) as string

const replaceDomain = (str: string, baseUrl: string) =>
    str.replace(/https?:\/\/tu-dominio\.com/g, baseUrl)

export const getDocsData = (baseUrl: string = window.location.origin): DocsData => ({
    // ===== API Token Overview =====
    apiIntro: t('docs.data.api_intro'),

    // ===== Token Details =====
    tokenInfo: {
        prefix: 'lnk_',
        maxPerDevice: 5,
        scopes: ['messages:send', 'messages:read', 'conversations:read'],
        expirations: t('docs.data.token_expirations', { returnObjects: true }) as unknown as string[],
        authMethods: [
            {
                title: t('docs.data.auth_method_1_title'),
                header: 'Authorization',
                example: 'Bearer lnk_tu_token_aqui',
            },
            {
                title: t('docs.data.auth_method_2_title'),
                header: 'X-API-Key',
                example: 'lnk_tu_token_aqui',
            },
            {
                title: t('docs.data.auth_method_3_title'),
                header: 'api_key',
                example: '?api_key=lnk_tu_token_aqui',
            },
        ],
    },

    // ===== API Endpoints =====
    apiEndpoints: [
        {
            method: 'GET',
            path: '/api/v1/device/info',
            description: t('docs.data.endpoint_device_info'),
            requiresAuth: 'token',
        },
        {
            method: 'POST',
            path: '/api/v1/device/send',
            description: t('docs.data.endpoint_send'),
            requiresAuth: 'token',
        },
        {
            method: 'GET',
            path: '/api/v1/device/conversations',
            description: t('docs.data.endpoint_conversations'),
            requiresAuth: 'token',
        },
        {
            method: 'GET',
            path: '/api/v1/device/conversations/:id/messages',
            description: t('docs.data.endpoint_messages'),
            requiresAuth: 'token',
        },
        {
            method: 'GET',
            path: '/api/v1/device/contacts',
            description: t('docs.data.endpoint_contacts_list'),
            requiresAuth: 'token',
        },
        {
            method: 'POST',
            path: '/api/v1/device/contacts',
            description: t('docs.data.endpoint_contacts_create'),
            requiresAuth: 'token',
        },
        {
            method: 'GET',
            path: '/api/v1/device/status',
            description: t('docs.data.endpoint_status'),
            requiresAuth: 'token',
        },
        {
            method: 'POST',
            path: '/api/v1/device/send-bulk',
            description: t('docs.data.endpoint_send_bulk'),
            requiresAuth: 'token',
        },
    ],

    // ===== Webhooks =====
    webhookIntro: t('docs.data.webhook_intro'),

    webhookEvents: [
        { name: 'message.incoming', description: t('docs.data.webhook_event_incoming') },
        { name: 'message.sent', description: t('docs.data.webhook_event_sent') },
        { name: 'message.delivered', description: t('docs.data.webhook_event_delivered') },
        { name: 'message.read', description: t('docs.data.webhook_event_read') },
        { name: 'conversation.created', description: t('docs.data.webhook_event_conversation') },
        { name: 'device.connected', description: t('docs.data.webhook_event_connected') },
        { name: 'device.disconnected', description: t('docs.data.webhook_event_disconnected') },
        { name: 'contact.created', description: t('docs.data.webhook_event_contact') },
    ],

    webhookPayloadExample: t('docs.data.webhook_payload_example'),

    webhookVerificationCode: t('docs.data.webhook_verification_code'),

    // ===== Code Examples =====
    codeExamples: [
        {
            title: t('docs.data.example_send_text_title'),
            language: 'bash',
            code: replaceDomain(t('docs.data.example_send_text_code'), baseUrl),
        },
        {
            title: t('docs.data.example_send_image_title'),
            language: 'bash',
            code: replaceDomain(t('docs.data.example_send_image_code'), baseUrl),
        },
        {
            title: t('docs.data.example_send_js_title'),
            language: 'javascript',
            code: replaceDomain(t('docs.data.example_send_js_code'), baseUrl),
        },
        {
            title: t('docs.data.example_device_info_title'),
            language: 'bash',
            code: replaceDomain(t('docs.data.example_device_info_code'), baseUrl),
        },
        {
            title: t('docs.data.example_conversations_title'),
            language: 'bash',
            code: replaceDomain(t('docs.data.example_conversations_code'), baseUrl),
        },
        {
            title: t('docs.data.example_webhook_title'),
            language: 'javascript',
            code: t('docs.data.example_webhook_code'),
        },
    ],
})

// For backwards compatibility
export const docsData = getDocsData(window.location.origin)
