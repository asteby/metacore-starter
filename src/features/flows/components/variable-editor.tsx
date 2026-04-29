import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Code2, Plus, X, Sparkles, FileCode, Copy, Check } from 'lucide-react'
import { FlowVariable, SYSTEM_VARIABLES, VARIABLE_FUNCTIONS, parseExpression } from '../types/flow-types'

interface VariableEditorProps {
    value: string
    onChange: (value: string) => void
    availableVariables?: FlowVariable[]
    placeholder?: string
    multiline?: boolean
    label?: string
}

export function VariableEditor({
    value,
    onChange,
    availableVariables = [],
    placeholder = 'Escribe o usa variables...',
    multiline = false,
    label,
}: VariableEditorProps) {
    const [showVariables, setShowVariables] = useState(false)
    const [copied, setCopied] = useState(false)

    const allVariables = [...SYSTEM_VARIABLES, ...availableVariables]

    const insertVariable = useCallback((variableName: string) => {
        const template = `{{${variableName}}}`
        const newValue = value + template
        onChange(newValue)
        setShowVariables(false)
    }, [value, onChange])

    const insertFunction = useCallback((functionName: string) => {
        const template = `{{variable.${functionName}()}}`
        const newValue = value + template
        onChange(newValue)
        setShowVariables(false)
    }, [value, onChange])

    const expression = parseExpression(value)

    const copyToClipboard = useCallback(() => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }, [value])

    return (
        <div className="space-y-2">
            {label && <Label>{label}</Label>}

            <div className="flex gap-2">
                {multiline ? (
                    <Textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        rows={4}
                        className="font-mono text-sm"
                    />
                ) : (
                    <Input
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="font-mono text-sm"
                    />
                )}

                <Popover open={showVariables} onOpenChange={setShowVariables}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" title="Insertar variable">
                            <Code2 className="w-4 h-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                    <FileCode className="w-4 h-4" />
                                    Variables Disponibles
                                </h4>
                                <ScrollArea className="h-48">
                                    <div className="space-y-1">
                                        {allVariables.map((variable) => (
                                            <button
                                                key={variable.name}
                                                onClick={() => insertVariable(variable.name)}
                                                className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <code className="font-mono text-xs text-primary">
                                                        {variable.name}
                                                    </code>
                                                    <Badge variant="outline" className="text-xs">
                                                        {variable.type}
                                                    </Badge>
                                                </div>
                                                {variable.description && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {variable.description}
                                                    </p>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Funciones
                                </h4>
                                <ScrollArea className="h-32">
                                    <div className="space-y-1">
                                        {VARIABLE_FUNCTIONS.map((func) => (
                                            <button
                                                key={func.name}
                                                onClick={() => insertFunction(func.name)}
                                                className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm transition-colors"
                                            >
                                                <code className="font-mono text-xs text-purple-600 dark:text-purple-400">
                                                    {func.example}
                                                </code>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {func.description}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {value && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={copyToClipboard}
                        title="Copiar"
                    >
                        {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </Button>
                )}
            </div>

            {/* Show detected variables */}
            {expression.variables.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground">Variables:</span>
                    {expression.variables.map((variable, index) => (
                        <Badge key={index} variant="secondary" className="text-xs font-mono">
                            {variable}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    )
}

interface VariableManagerProps {
    variables: FlowVariable[]
    onChange: (variables: FlowVariable[]) => void
}

export function VariableManager({ variables, onChange }: VariableManagerProps) {
    const [newVariable, setNewVariable] = useState<Partial<FlowVariable>>({
        name: '',
        type: 'string',
        value: '',
        description: '',
    })

    const addVariable = useCallback(() => {
        if (!newVariable.name) return

        const variable: FlowVariable = {
            name: newVariable.name,
            type: newVariable.type as any,
            value: newVariable.value,
            description: newVariable.description,
        }

        onChange([...variables, variable])
        setNewVariable({ name: '', type: 'string', value: '', description: '' })
    }, [newVariable, variables, onChange])

    const removeVariable = useCallback((index: number) => {
        onChange(variables.filter((_, i) => i !== index))
    }, [variables, onChange])

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <h4 className="font-semibold text-sm">Variables del Nodo</h4>

                {variables.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No hay variables definidas
                    </p>
                ) : (
                    <div className="space-y-2">
                        {variables.map((variable, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-2 p-3 rounded-lg border bg-card"
                            >
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <code className="font-mono text-sm text-primary">
                                            {variable.name}
                                        </code>
                                        <Badge variant="outline" className="text-xs">
                                            {variable.type}
                                        </Badge>
                                    </div>
                                    {variable.description && (
                                        <p className="text-xs text-muted-foreground">
                                            {variable.description}
                                        </p>
                                    )}
                                    <code className="text-xs text-muted-foreground font-mono block">
                                        = {typeof variable.value === 'object'
                                            ? JSON.stringify(variable.value)
                                            : String(variable.value)}
                                    </code>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeVariable(index)}
                                    className="h-8 w-8"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-3 p-4 rounded-lg border bg-muted/50">
                <h4 className="font-semibold text-sm">Nueva Variable</h4>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label className="text-xs">Nombre</Label>
                        <Input
                            value={newVariable.name}
                            onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                            placeholder="my_variable"
                            className="h-8 text-sm font-mono"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs">Tipo</Label>
                        <Select
                            value={newVariable.type}
                            onValueChange={(type) => setNewVariable({ ...newVariable, type: type as any })}
                        >
                            <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="string">String</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="boolean">Boolean</SelectItem>
                                <SelectItem value="object">Object</SelectItem>
                                <SelectItem value="array">Array</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="json">JSON</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs">Valor</Label>
                    <Input
                        value={newVariable.value}
                        onChange={(e) => setNewVariable({ ...newVariable, value: e.target.value })}
                        placeholder="Valor inicial"
                        className="h-8 text-sm"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-xs">Descripción</Label>
                    <Input
                        value={newVariable.description}
                        onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
                        placeholder="Descripción opcional"
                        className="h-8 text-sm"
                    />
                </div>

                <Button
                    onClick={addVariable}
                    size="sm"
                    className="w-full"
                    disabled={!newVariable.name}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Variable
                </Button>
            </div>
        </div>
    )
}
