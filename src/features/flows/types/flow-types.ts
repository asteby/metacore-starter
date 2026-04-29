// Flow system types - Professional level like n8n/Make

export type VariableType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date' | 'json'

export interface FlowVariable {
    name: string
    type: VariableType
    value?: any
    description?: string
    source?: string // Which node created this variable
}

export interface FlowContext {
    variables: Record<string, FlowVariable>
    trigger: {
        type: string
        data: any
        timestamp: string
    }
    execution: {
        id: string
        startedAt: string
        status: 'running' | 'completed' | 'failed' | 'paused'
    }
}

// Default system variables available in all flows
export const SYSTEM_VARIABLES: FlowVariable[] = [
    {
        name: '$now',
        type: 'date',
        value: new Date().toISOString(),
        description: 'Fecha y hora actual',
    },
    {
        name: '$today',
        type: 'string',
        value: new Date().toISOString().split('T')[0],
        description: 'Fecha actual (YYYY-MM-DD)',
    },
    {
        name: '$trigger.data',
        type: 'object',
        value: {},
        description: 'Datos del disparador',
    },
    {
        name: '$trigger.type',
        type: 'string',
        value: '',
        description: 'Tipo de disparador',
    },
    {
        name: '$execution.id',
        type: 'string',
        value: '',
        description: 'ID de la ejecución actual',
    },
    {
        name: '$workflow.name',
        type: 'string',
        value: '',
        description: 'Nombre del flujo',
    },
    {
        name: '$workflow.id',
        type: 'string',
        value: '',
        description: 'ID del flujo',
    },
]

// Trigger types
export type TriggerType =
    | 'keyword'           // Palabra clave específica
    | 'welcome'          // Mensaje de bienvenida
    | 'menu'             // Menú principal
    | 'fallback'         // Sin coincidencia
    | 'manual'           // Activación manual
    | 'webhook'          // Webhook HTTP
    | 'schedule'         // Programado (cron)
    | 'event'            // Evento del sistema
    | 'api'              // Llamada API
    | 'form_submit'      // Envío de formulario
    | 'button_click'     // Click en botón
    | 'tag_added'        // Tag agregado al contacto
    | 'tag_removed'      // Tag removido del contacto
    | 'variable_changed' // Variable cambió de valor
    | 'time_based'       // Basado en tiempo específico
    | 'sequence_ended'   // Secuencia finalizada
    | 'payment_received' // Pago recibido

export interface TriggerConfig {
    type: TriggerType
    label: string
    description: string
    icon: string
    color: string
    defaultVariables: FlowVariable[]
    configFields: TriggerConfigField[]
}

export interface TriggerConfigField {
    name: string
    label: string
    type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'time' | 'cron' | 'json'
    placeholder?: string
    options?: { value: string; label: string }[]
    required?: boolean
    defaultValue?: any
}

// Node type definitions
export type FlowNodeType =
    // Triggers
    | 'trigger'
    // Actions
    | 'message'
    | 'email'
    | 'http_request'
    | 'set_variable'
    | 'transform_data'
    | 'wait'
    // Logic
    | 'condition'
    | 'switch'
    | 'loop'
    | 'filter'
    // AI
    | 'ai_chat'
    | 'ai_analyze'
    | 'ai_generate'
    // Integration
    | 'database'
    | 'webhook'
    | 'api_call'
    // Utilities
    | 'delay'
    | 'split'
    | 'merge'
    | 'error_handler'

export interface FlowNodeData {
    label: string
    description?: string
    config?: Record<string, any>
    variables?: FlowVariable[]
    outputVariables?: string[] // Variables que este nodo genera
    requiredVariables?: string[] // Variables que este nodo necesita
}

// Template system
export interface MessageTemplate {
    id: string
    name: string
    content: string
    variables: string[] // Variables used in the template
    category: 'greeting' | 'info' | 'action' | 'error' | 'custom'
}

export const DEFAULT_TEMPLATES: MessageTemplate[] = [
    {
        id: 'welcome',
        name: 'Bienvenida',
        content: '¡Hola {{contact.name}}! 👋 Bienvenido a {{business.name}}. ¿En qué puedo ayudarte hoy?',
        variables: ['contact.name', 'business.name'],
        category: 'greeting',
    },
    {
        id: 'appointment_confirm',
        name: 'Confirmar Cita',
        content: 'Hola {{contact.name}}, tu cita está programada para el {{appointment.date}} a las {{appointment.time}}. ¿Confirmas tu asistencia?',
        variables: ['contact.name', 'appointment.date', 'appointment.time'],
        category: 'info',
    },
    {
        id: 'payment_received',
        name: 'Pago Recibido',
        content: 'Hemos recibido tu pago de {{payment.amount}} {{payment.currency}}. Referencia: {{payment.id}}. ¡Gracias!',
        variables: ['payment.amount', 'payment.currency', 'payment.id'],
        category: 'action',
    },
    {
        id: 'error_generic',
        name: 'Error Genérico',
        content: 'Lo siento, ocurrió un error: {{error.message}}. Por favor, intenta nuevamente.',
        variables: ['error.message'],
        category: 'error',
    },
    {
        id: 'custom_data',
        name: 'Datos Personalizados',
        content: 'Información: {{data.field1}} - {{data.field2}}',
        variables: ['data.field1', 'data.field2'],
        category: 'custom',
    },
]

// Expression evaluator helpers
export interface Expression {
    raw: string
    variables: string[]
    isValid: boolean
}

export function parseExpression(expression: string): Expression {
    const variableRegex = /\{\{([^}]+)\}\}/g
    const matches = [...expression.matchAll(variableRegex)]
    const variables = matches.map(m => m[1].trim())

    return {
        raw: expression,
        variables,
        isValid: variables.length > 0,
    }
}

export function evaluateExpression(expression: string, context: Record<string, any>): string {
    let result = expression

    // Replace all {{variable}} with actual values
    const variableRegex = /\{\{([^}]+)\}\}/g
    result = result.replace(variableRegex, (match, variable) => {
        const trimmedVar = variable.trim()
        const value = getNestedProperty(context, trimmedVar)
        return value !== undefined ? String(value) : match
    })

    return result
}

function getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj)
}

// Variable manipulation functions
export const VARIABLE_FUNCTIONS = [
    {
        name: 'uppercase',
        description: 'Convertir a mayúsculas',
        example: '{{name.uppercase()}}',
        apply: (value: string) => value.toUpperCase(),
    },
    {
        name: 'lowercase',
        description: 'Convertir a minúsculas',
        example: '{{name.lowercase()}}',
        apply: (value: string) => value.toLowerCase(),
    },
    {
        name: 'trim',
        description: 'Eliminar espacios',
        example: '{{name.trim()}}',
        apply: (value: string) => value.trim(),
    },
    {
        name: 'length',
        description: 'Longitud de texto',
        example: '{{name.length()}}',
        apply: (value: string) => value.length,
    },
    {
        name: 'split',
        description: 'Separar texto',
        example: '{{text.split(",")}}',
        apply: (value: string, separator: string) => value.split(separator),
    },
    {
        name: 'replace',
        description: 'Reemplazar texto',
        example: '{{text.replace("old", "new")}}',
        apply: (value: string, search: string, replace: string) => value.replace(search, replace),
    },
    {
        name: 'format_date',
        description: 'Formatear fecha',
        example: '{{date.format_date("DD/MM/YYYY")}}',
        apply: (value: string, _format: string) => {
            // Simple date formatting
            const date = new Date(value)
            return date.toLocaleDateString('es-ES')
        },
    },
    {
        name: 'format_currency',
        description: 'Formatear moneda',
        example: '{{amount.format_currency("USD")}}',
        apply: (value: number, currency: string = 'USD') => {
            return new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency,
            }).format(value)
        },
    },
]
