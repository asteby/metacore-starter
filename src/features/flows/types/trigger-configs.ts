import { Zap, MessageCircle, Menu, AlertCircle, Hand, Webhook, Clock, Sparkles, Link2, FileText, MousePointer, Tag, TagIcon, Eye, Timer, List, DollarSign } from 'lucide-react'
import { TriggerConfig, TriggerType } from './flow-types'

export const TRIGGER_CONFIGS: Record<TriggerType, TriggerConfig> = {
    keyword: {
        type: 'keyword',
        label: 'Palabra Clave',
        description: 'Se activa cuando el usuario envía una palabra específica',
        icon: 'Zap',
        color: 'bg-orange-500',
        defaultVariables: [
            {
                name: 'trigger.keyword',
                type: 'string',
                value: '',
                description: 'Palabra clave que activó el flujo',
            },
            {
                name: 'trigger.message',
                type: 'string',
                value: '',
                description: 'Mensaje completo del usuario',
            },
            {
                name: 'contact.phone',
                type: 'string',
                value: '',
                description: 'Teléfono del contacto',
            },
            {
                name: 'contact.name',
                type: 'string',
                value: '',
                description: 'Nombre del contacto',
            },
        ],
        configFields: [
            {
                name: 'keyword',
                label: 'Palabra Clave',
                type: 'text',
                placeholder: 'Ej: hola, ayuda, menu',
                required: true,
            },
            {
                name: 'matchType',
                label: 'Tipo de Coincidencia',
                type: 'select',
                options: [
                    { value: 'exact', label: 'Exacta' },
                    { value: 'contains', label: 'Contiene' },
                    { value: 'starts', label: 'Comienza con' },
                    { value: 'ends', label: 'Termina con' },
                ],
                defaultValue: 'exact',
            },
            {
                name: 'caseSensitive',
                label: 'Sensible a Mayúsculas',
                type: 'select',
                options: [
                    { value: 'false', label: 'No' },
                    { value: 'true', label: 'Sí' },
                ],
                defaultValue: 'false',
            },
        ],
    },

    welcome: {
        type: 'welcome',
        label: 'Mensaje de Bienvenida',
        description: 'Se activa cuando un nuevo contacto inicia conversación',
        icon: 'MessageCircle',
        color: 'bg-blue-500',
        defaultVariables: [
            {
                name: 'contact.phone',
                type: 'string',
                value: '',
                description: 'Teléfono del contacto',
            },
            {
                name: 'contact.name',
                type: 'string',
                value: '',
                description: 'Nombre del contacto (si está disponible)',
            },
            {
                name: 'contact.isNew',
                type: 'boolean',
                value: true,
                description: 'Si es un contacto nuevo',
            },
        ],
        configFields: [
            {
                name: 'delay',
                label: 'Esperar antes de enviar (segundos)',
                type: 'number',
                defaultValue: 0,
            },
        ],
    },

    webhook: {
        type: 'webhook',
        label: 'Webhook HTTP',
        description: 'Se activa cuando se recibe una petición HTTP',
        icon: 'Webhook',
        color: 'bg-purple-500',
        defaultVariables: [
            {
                name: 'webhook.method',
                type: 'string',
                value: '',
                description: 'Método HTTP (GET, POST, etc)',
            },
            {
                name: 'webhook.body',
                type: 'object',
                value: {},
                description: 'Cuerpo de la petición',
            },
            {
                name: 'webhook.headers',
                type: 'object',
                value: {},
                description: 'Headers de la petición',
            },
            {
                name: 'webhook.query',
                type: 'object',
                value: {},
                description: 'Parámetros de query',
            },
        ],
        configFields: [
            {
                name: 'method',
                label: 'Método HTTP',
                type: 'select',
                options: [
                    { value: 'POST', label: 'POST' },
                    { value: 'GET', label: 'GET' },
                    { value: 'PUT', label: 'PUT' },
                    { value: 'PATCH', label: 'PATCH' },
                    { value: 'DELETE', label: 'DELETE' },
                ],
                defaultValue: 'POST',
            },
            {
                name: 'authenticationType',
                label: 'Autenticación',
                type: 'select',
                options: [
                    { value: 'none', label: 'Ninguna' },
                    { value: 'basic', label: 'Basic Auth' },
                    { value: 'bearer', label: 'Bearer Token' },
                    { value: 'api_key', label: 'API Key' },
                ],
                defaultValue: 'none',
            },
        ],
    },

    schedule: {
        type: 'schedule',
        label: 'Programado (Cron)',
        description: 'Se activa en un horario programado',
        icon: 'Clock',
        color: 'bg-indigo-500',
        defaultVariables: [
            {
                name: 'schedule.executionTime',
                type: 'date',
                value: '',
                description: 'Hora de ejecución',
            },
            {
                name: 'schedule.nextExecution',
                type: 'date',
                value: '',
                description: 'Próxima ejecución programada',
            },
        ],
        configFields: [
            {
                name: 'scheduleType',
                label: 'Tipo de Programación',
                type: 'select',
                options: [
                    { value: 'interval', label: 'Intervalo' },
                    { value: 'daily', label: 'Diario' },
                    { value: 'weekly', label: 'Semanal' },
                    { value: 'monthly', label: 'Mensual' },
                    { value: 'cron', label: 'Expresión Cron' },
                ],
                defaultValue: 'daily',
            },
            {
                name: 'time',
                label: 'Hora',
                type: 'time',
                placeholder: '09:00',
            },
            {
                name: 'cronExpression',
                label: 'Expresión Cron',
                type: 'text',
                placeholder: '0 9 * * *',
            },
        ],
    },

    form_submit: {
        type: 'form_submit',
        label: 'Envío de Formulario',
        description: 'Se activa cuando se envía un formulario',
        icon: 'FileText',
        color: 'bg-green-500',
        defaultVariables: [
            {
                name: 'form.id',
                type: 'string',
                value: '',
                description: 'ID del formulario',
            },
            {
                name: 'form.data',
                type: 'object',
                value: {},
                description: 'Datos del formulario',
            },
            {
                name: 'form.submittedBy',
                type: 'string',
                value: '',
                description: 'Usuario que envió el formulario',
            },
        ],
        configFields: [
            {
                name: 'formId',
                label: 'ID del Formulario',
                type: 'text',
                required: true,
            },
        ],
    },

    tag_added: {
        type: 'tag_added',
        label: 'Tag Agregado',
        description: 'Se activa cuando se agrega un tag a un contacto',
        icon: 'Tag',
        color: 'bg-pink-500',
        defaultVariables: [
            {
                name: 'tag.name',
                type: 'string',
                value: '',
                description: 'Nombre del tag',
            },
            {
                name: 'tag.id',
                type: 'string',
                value: '',
                description: 'ID del tag',
            },
            {
                name: 'contact.phone',
                type: 'string',
                value: '',
                description: 'Teléfono del contacto',
            },
        ],
        configFields: [
            {
                name: 'tagName',
                label: 'Nombre del Tag',
                type: 'text',
                required: true,
            },
        ],
    },

    payment_received: {
        type: 'payment_received',
        label: 'Pago Recibido',
        description: 'Se activa cuando se recibe un pago',
        icon: 'DollarSign',
        color: 'bg-emerald-500',
        defaultVariables: [
            {
                name: 'payment.amount',
                type: 'number',
                value: 0,
                description: 'Monto del pago',
            },
            {
                name: 'payment.currency',
                type: 'string',
                value: 'USD',
                description: 'Moneda del pago',
            },
            {
                name: 'payment.method',
                type: 'string',
                value: '',
                description: 'Método de pago',
            },
            {
                name: 'payment.id',
                type: 'string',
                value: '',
                description: 'ID de la transacción',
            },
        ],
        configFields: [
            {
                name: 'minAmount',
                label: 'Monto Mínimo',
                type: 'number',
                placeholder: '0',
            },
            {
                name: 'paymentMethods',
                label: 'Métodos de Pago',
                type: 'select',
                options: [
                    { value: 'any', label: 'Cualquiera' },
                    { value: 'card', label: 'Tarjeta' },
                    { value: 'transfer', label: 'Transferencia' },
                    { value: 'cash', label: 'Efectivo' },
                ],
                defaultValue: 'any',
            },
        ],
    },

    // Add remaining triggers with simpler configs
    menu: {
        type: 'menu',
        label: 'Menú Principal',
        description: 'Se activa desde el menú',
        icon: 'Menu',
        color: 'bg-cyan-500',
        defaultVariables: [],
        configFields: [],
    },

    fallback: {
        type: 'fallback',
        label: 'Sin Coincidencia',
        description: 'Se activa cuando no hay coincidencias',
        icon: 'AlertCircle',
        color: 'bg-amber-500',
        defaultVariables: [],
        configFields: [],
    },

    manual: {
        type: 'manual',
        label: 'Manual',
        description: 'Se activa manualmente',
        icon: 'Hand',
        color: 'bg-gray-500',
        defaultVariables: [],
        configFields: [],
    },

    event: {
        type: 'event',
        label: 'Evento del Sistema',
        description: 'Se activa por eventos del sistema',
        icon: 'Sparkles',
        color: 'bg-violet-500',
        defaultVariables: [],
        configFields: [
            {
                name: 'eventType',
                label: 'Tipo de Evento',
                type: 'text',
                required: true,
            },
        ],
    },

    api: {
        type: 'api',
        label: 'API',
        description: 'Se activa por llamada API',
        icon: 'Link2',
        color: 'bg-teal-500',
        defaultVariables: [],
        configFields: [],
    },

    button_click: {
        type: 'button_click',
        label: 'Click en Botón',
        description: 'Se activa cuando se hace click en botón',
        icon: 'MousePointer',
        color: 'bg-rose-500',
        defaultVariables: [],
        configFields: [
            {
                name: 'buttonId',
                label: 'ID del Botón',
                type: 'text',
                required: true,
            },
        ],
    },

    tag_removed: {
        type: 'tag_removed',
        label: 'Tag Removido',
        description: 'Se activa cuando se remueve un tag',
        icon: 'TagIcon',
        color: 'bg-red-500',
        defaultVariables: [],
        configFields: [],
    },

    variable_changed: {
        type: 'variable_changed',
        label: 'Variable Cambió',
        description: 'Se activa cuando cambia una variable',
        icon: 'Eye',
        color: 'bg-yellow-500',
        defaultVariables: [],
        configFields: [
            {
                name: 'variableName',
                label: 'Nombre de Variable',
                type: 'text',
                required: true,
            },
        ],
    },

    time_based: {
        type: 'time_based',
        label: 'Basado en Tiempo',
        description: 'Se activa en tiempo específico',
        icon: 'Timer',
        color: 'bg-blue-600',
        defaultVariables: [],
        configFields: [],
    },

    sequence_ended: {
        type: 'sequence_ended',
        label: 'Secuencia Finalizada',
        description: 'Se activa al finalizar una secuencia',
        icon: 'List',
        color: 'bg-slate-600',
        defaultVariables: [],
        configFields: [],
    },
}

// Icon mapping
export const TRIGGER_ICONS = {
    Zap,
    MessageCircle,
    Menu,
    AlertCircle,
    Hand,
    Webhook,
    Clock,
    Sparkles,
    Link2,
    FileText,
    MousePointer,
    Tag,
    TagIcon,
    Eye,
    Timer,
    List,
    DollarSign,
}
