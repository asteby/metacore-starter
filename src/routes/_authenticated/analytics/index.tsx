import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { DatePicker } from '@/components/date-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts'
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  Download,
  Database,
  Check,
  ChevronsUpDown,
  Search,
  Play,
} from 'lucide-react'

export const Route = createFileRoute('/_authenticated/analytics/')({
  component: AnalyticsPage,
})

// ─── Types ────────────────────────────────────────────────

interface ChartDef {
  id: string
  title: string
  type: string
  size: string
  query: {
    type: string
    column?: string
    options?: Array<{ value: string; label: string }>
  }
  colors?: string[]
}

interface FilterDef {
  key: string
  label: string
  type: string
  column: string
  options?: Array<{ value: string; label: string }>
  searchEndpoint?: string
}

interface AnalyticsData {
  metadata: {
    title: string
    description?: string
    charts: ChartDef[]
    filters: FilterDef[]
    dateColumn: string
  }
  charts: Record<string, unknown>
  summary: {
    total_records: number
    previous_period_count?: number
    change_percent?: number
  }
}

interface ModuleOption {
  value: string
  label: string
  description?: string
}

interface TimelinePoint {
  period: string
  count: number
}

interface TimelineAggPoint {
  period: string
  total: number
  count: number
}

interface DistPoint {
  label: string
  value: number
}

interface StatsData {
  sum: number
  avg: number
  min: number
  max: number
  count: number
}

// ─── Constants ────────────────────────────────────────────

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
]

const CHART_TYPES = ['line', 'bar', 'bar_h', 'area', 'doughnut'] as const
type ChartType = (typeof CHART_TYPES)[number]

const CHART_TYPE_LABELS: Record<ChartType, string> = {
  line: 'Línea',
  bar: 'Barras',
  bar_h: 'Barras H.',
  area: 'Área',
  doughnut: 'Dona',
}

const PERIOD_OPTIONS = [
  { value: 'day', label: 'analytics.period_day' },
  { value: 'week', label: 'analytics.period_week' },
  { value: 'month', label: 'analytics.period_month' },
]

const PRESET_RANGES = [
  { value: '7d', label: '7d', days: 7 },
  { value: '30d', label: '30d', days: 30 },
  { value: '90d', label: '90d', days: 90 },
  { value: '1y', label: '1 año', days: 365 },
  { value: 'all', label: 'Todo', days: 0 },
]

function formatDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

function exportCSV(chartData: unknown, title: string) {
  if (!chartData) return
  let csv = ''
  if (Array.isArray(chartData)) {
    if (chartData.length === 0) return
    const keys = Object.keys(chartData[0])
    csv = keys.join(',') + '\n'
    csv += chartData
      .map((row) =>
        keys.map((k) => (row as Record<string, unknown>)[k]).join(',')
      )
      .join('\n')
  } else if (typeof chartData === 'object' && chartData !== null) {
    const obj = chartData as Record<string, unknown>
    csv = Object.keys(obj).join(',') + '\n'
    csv += Object.values(obj).join(',')
  }
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.replace(/\s+/g, '_')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Search Filter Component ─────────────────────────────

function SearchFilter({
  filter,
  value,
  onChange,
}: {
  filter: FilterDef
  value: string
  onChange: (v: string) => void
}) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [localValue, setLocalValue] = useState(value)
  const [results, setResults] = useState<Array<{ value: string; label: string }>>([])
  const [open, setOpen] = useState(false)

  const doSearch = useCallback(
    (query: string) => {
      if (!filter.searchEndpoint || query.length < 2) {
        setResults([])
        return
      }
      api
        .get(`${filter.searchEndpoint}?q=${encodeURIComponent(query)}`)
        .then((res) => {
          if (res.data.success && Array.isArray(res.data.data)) {
            setResults(res.data.data)
          }
        })
        .catch(() => setResults([]))
    },
    [filter.searchEndpoint]
  )

  const handleInput = (v: string) => {
    setLocalValue(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(v), 350)
  }

  return (
    <div className='flex flex-col gap-1.5'>
      <label className='text-xs font-medium text-muted-foreground'>
        {filter.label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            className='w-[200px] justify-between font-normal text-sm'
          >
            <span className='truncate'>
              {value || filter.label}
            </span>
            <Search className='ml-2 h-3.5 w-3.5 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[260px] p-0' align='start'>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={`Buscar ${filter.label.toLowerCase()}...`}
              value={localValue}
              onValueChange={handleInput}
            />
            <CommandList>
              <CommandEmpty>Sin resultados</CommandEmpty>
              <CommandGroup>
                {value && (
                  <CommandItem
                    onSelect={() => {
                      onChange('')
                      setLocalValue('')
                      setOpen(false)
                    }}
                  >
                    <span className='text-muted-foreground'>Limpiar filtro</span>
                  </CommandItem>
                )}
                {results.map((r) => (
                  <CommandItem
                    key={r.value}
                    value={r.value}
                    onSelect={() => {
                      onChange(r.value)
                      setLocalValue(r.label)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${value === r.value ? 'opacity-100' : 'opacity-0'}`}
                    />
                    {r.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ─── Multiselect Filter Component ─────────────────────────

function MultiselectFilter({
  filter,
  selected,
  onChange,
}: {
  filter: FilterDef
  selected: string[]
  onChange: (vals: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const options = filter.options || []
  const total = options.length

  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((v) => v !== val))
    } else {
      onChange([...selected, val])
    }
  }

  return (
    <div className='flex flex-col gap-1.5'>
      <label className='text-xs font-medium text-muted-foreground'>
        {filter.label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            className='w-[180px] justify-between font-normal text-sm'
          >
            <span className='truncate'>{filter.label}</span>
            <Badge variant='secondary' className='ml-2 text-xs px-1.5 py-0'>
              {selected.length}/{total}
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[220px] p-2' align='start'>
          <div className='flex flex-col gap-1 max-h-[240px] overflow-y-auto'>
            {options.map((opt) => (
              <label
                key={String(opt.value)}
                className='flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer'
              >
                <Checkbox
                  checked={selected.includes(String(opt.value))}
                  onCheckedChange={() => toggle(String(opt.value))}
                />
                <span className='truncate'>{opt.label}</span>
              </label>
            ))}
            {options.length === 0 && (
              <p className='text-xs text-muted-foreground px-2 py-1'>
                Sin opciones
              </p>
            )}
          </div>
          {selected.length > 0 && (
            <Button
              variant='ghost'
              size='sm'
              className='mt-1 w-full text-xs'
              onClick={() => onChange([])}
            >
              Limpiar selección
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────

function AnalyticsPage() {
  const { t } = useTranslation()
  const [modules, setModules] = useState<ModuleOption[]>([])
  const [selectedModule, setSelectedModule] = useState<string>('')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [modulesLoading, setModulesLoading] = useState(true)
  const [period, setPeriod] = useState('day')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d
  })
  const [dateTo, setDateTo] = useState<Date | undefined>(() => new Date())
  const [activePreset, setActivePreset] = useState<string>('30d')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [multiselectFilters, setMultiselectFilters] = useState<
    Record<string, string[]>
  >({})
  const [chartTypeOverrides, setChartTypeOverrides] = useState<
    Record<string, ChartType>
  >({})
  const [moduleOpen, setModuleOpen] = useState(false)

  useEffect(() => {
    api
      .get('/analytics/modules')
      .then((res) => {
        if (res.data.success) setModules(res.data.data)
      })
      .catch(console.error)
      .finally(() => setModulesLoading(false))
  }, [])

  const fetchData = useCallback(async () => {
    if (!selectedModule) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('date_from', formatDateStr(dateFrom))
      if (dateTo) params.set('date_to', formatDateStr(dateTo))
      params.set('period', period)
      for (const [k, v] of Object.entries(filters)) {
        if (v) params.set(`f_${k}`, v)
      }
      for (const [k, vals] of Object.entries(multiselectFilters)) {
        if (vals.length > 0) params.set(`f_${k}`, vals.join(','))
      }
      const res = await api.get(
        `/analytics/${selectedModule}/data?${params}`
      )
      if (res.data.success) setData(res.data.data)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedModule, dateFrom, dateTo, period, filters, multiselectFilters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleModuleChange = (v: string) => {
    setSelectedModule(v)
    setFilters({})
    setMultiselectFilters({})
    setChartTypeOverrides({})
    setData(null)
  }

  const handlePreset = (preset: string) => {
    setActivePreset(preset)
    if (preset === 'all') {
      setDateFrom(undefined)
      setDateTo(undefined)
      return
    }
    const entry = PRESET_RANGES.find((r) => r.value === preset)
    if (entry && entry.days > 0) {
      const from = new Date()
      from.setDate(from.getDate() - entry.days)
      setDateFrom(from)
      setDateTo(new Date())
    }
  }

  const handleDateFromChange = (d: Date | undefined) => {
    setDateFrom(d)
    setActivePreset('')
  }

  const handleDateToChange = (d: Date | undefined) => {
    setDateTo(d)
    setActivePreset('')
  }

  const selectedMod = modules.find((m) => m.value === selectedModule)
  const selectedLabel = selectedMod?.label

  return (
    <div className='flex flex-col gap-6 p-6'>
      {/* Header */}
      <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            {t('analytics.page_title')}
          </h1>
          <p className='text-sm text-muted-foreground'>
            {t('analytics.page_description')}
          </p>
        </div>
        {selectedModule && (
          <Button
            variant='outline'
            size='sm'
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            {t('analytics.refresh')}
          </Button>
        )}
      </div>

      {/* Controls */}
      <Card>
        <CardContent className='flex flex-col gap-4 pt-6'>
          {/* Row 1: Module + Load button */}
          <div className='flex flex-wrap items-end gap-4'>
            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-medium text-muted-foreground'>
                {t('analytics.module')}
              </label>
              <Popover open={moduleOpen} onOpenChange={setModuleOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    role='combobox'
                    aria-expanded={moduleOpen}
                    className='w-[260px] justify-between font-normal'
                    disabled={modulesLoading}
                  >
                    {selectedLabel || t('analytics.select_module')}
                    <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-[260px] p-0' align='start'>
                  <Command>
                    <CommandInput
                      placeholder={t('analytics.search_module')}
                    />
                    <CommandList>
                      <CommandEmpty>{t('analytics.no_modules')}</CommandEmpty>
                      <CommandGroup>
                        {modules.map((m) => (
                          <CommandItem
                            key={m.value}
                            value={m.label}
                            onSelect={() => {
                              handleModuleChange(m.value)
                              setModuleOpen(false)
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${selectedModule === m.value ? 'opacity-100' : 'opacity-0'}`}
                            />
                            {m.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Button
              onClick={fetchData}
              disabled={!selectedModule || loading}
              className='gap-2'
            >
              <Play className='h-4 w-4' />
              {t('analytics.load_analytics')}
            </Button>
          </div>

          {/* Row 2: Date range + period + filters */}
          <div className='flex flex-wrap items-end gap-4'>
            {/* Date From */}
            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-medium text-muted-foreground'>
                {t('analytics.date_from')}
              </label>
              <DatePicker
                selected={dateFrom}
                onSelect={handleDateFromChange}
                placeholder={t('analytics.date_from')}
              />
            </div>

            {/* Date To */}
            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-medium text-muted-foreground'>
                {t('analytics.date_to')}
              </label>
              <DatePicker
                selected={dateTo}
                onSelect={handleDateToChange}
                placeholder={t('analytics.date_to')}
              />
            </div>

            {/* Quick Preset Buttons */}
            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-medium text-muted-foreground'>
                {t('analytics.quick_ranges')}
              </label>
              <div className='flex gap-1'>
                {PRESET_RANGES.map((r) => (
                  <Button
                    key={r.value}
                    variant={activePreset === r.value ? 'default' : 'outline'}
                    size='sm'
                    className='h-9 px-2.5 text-xs'
                    onClick={() => handlePreset(r.value)}
                  >
                    {r.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Period / Group by */}
            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-medium text-muted-foreground'>
                {t('analytics.group_by')}
              </label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className='w-[130px]'>
                  <BarChart3 className='mr-2 h-4 w-4 opacity-50' />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {t(p.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Dynamic filters */}
          {data?.metadata?.filters && data.metadata.filters.length > 0 && (
            <div className='flex flex-wrap items-end gap-4 border-t pt-4'>
              {data.metadata.filters.map((f) => {
                if (f.type === 'search') {
                  return (
                    <SearchFilter
                      key={f.key}
                      filter={f}
                      value={filters[f.column] || ''}
                      onChange={(v) =>
                        setFilters((prev) => ({ ...prev, [f.column]: v }))
                      }
                    />
                  )
                }

                if (
                  f.type === 'multiselect' ||
                  f.type === 'select' ||
                  f.type === 'status'
                ) {
                  return (
                    <MultiselectFilter
                      key={f.key}
                      filter={f}
                      selected={multiselectFilters[f.column] || []}
                      onChange={(vals) =>
                        setMultiselectFilters((prev) => ({
                          ...prev,
                          [f.column]: vals,
                        }))
                      }
                    />
                  )
                }

                return null
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module Title + Description */}
      {data && selectedMod && !loading && (
        <div className='flex flex-col gap-1'>
          <h2 className='text-xl font-semibold'>
            {data.metadata.title || selectedMod.label}
          </h2>
          {data.metadata.description && (
            <p className='text-sm text-muted-foreground'>
              {data.metadata.description}
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!selectedModule && !loading && (
        <Card>
          <CardContent className='flex h-72 flex-col items-center justify-center gap-3 text-muted-foreground'>
            <Database className='h-16 w-16 opacity-20' />
            <p className='text-lg font-medium'>
              {t('analytics.select_module_prompt')}
            </p>
            <p className='text-sm'>{t('analytics.select_module_hint')}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className='flex h-64 items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <>
          {/* Summary */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-medium text-muted-foreground'>
                  {selectedLabel} — {t('analytics.total_records')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-3xl font-bold tabular-nums'>
                  {data.summary.total_records?.toLocaleString() ?? 0}
                </p>
              </CardContent>
            </Card>

            {data.summary.change_percent !== undefined && (
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>
                    {t('analytics.vs_previous')}
                  </CardTitle>
                </CardHeader>
                <CardContent className='flex items-center gap-3'>
                  {data.summary.change_percent >= 0 ? (
                    <TrendingUp className='h-6 w-6 text-emerald-500' />
                  ) : (
                    <TrendingDown className='h-6 w-6 text-red-500' />
                  )}
                  <p
                    className={`text-3xl font-bold tabular-nums ${data.summary.change_percent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {data.summary.change_percent >= 0 ? '+' : ''}
                    {data.summary.change_percent.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            )}

            {data.summary.previous_period_count !== undefined && (
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>
                    {t('analytics.previous_period')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-3xl font-bold tabular-nums'>
                    {data.summary.previous_period_count?.toLocaleString() ?? 0}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Charts */}
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {data.metadata.charts?.map((chart) => {
              const effectiveType =
                chartTypeOverrides[chart.id] || (chart.type as ChartType)
              const allowedTypes: ChartType[] =
                chart.query.type === 'stats'
                  ? ['bar', 'bar_h']
                  : ['line', 'bar', 'bar_h', 'area', 'doughnut']

              const sizeClass =
                chart.size === 'lg'
                  ? 'lg:col-span-2'
                  : ''

              return (
                <Card key={chart.id} className={sizeClass}>
                  <CardHeader className='flex flex-row items-center justify-between pb-2'>
                    <CardTitle className='text-base font-semibold'>
                      {chart.title}
                    </CardTitle>
                    <div className='flex flex-wrap items-center gap-1'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='h-7 gap-1 text-xs'
                        onClick={() =>
                          exportCSV(data.charts[chart.id], chart.title)
                        }
                      >
                        <Download className='h-3 w-3' />
                        {t('analytics.export')}
                      </Button>
                      {allowedTypes.length > 1 &&
                        allowedTypes.map((ct) => (
                          <Button
                            key={ct}
                            variant={
                              effectiveType === ct ? 'default' : 'outline'
                            }
                            size='sm'
                            className='h-7 text-xs px-2'
                            onClick={() =>
                              setChartTypeOverrides((prev) => ({
                                ...prev,
                                [chart.id]: ct,
                              }))
                            }
                          >
                            {CHART_TYPE_LABELS[ct]}
                          </Button>
                        ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <RenderChart
                      chartDef={chart}
                      chartType={effectiveType}
                      data={data.charts[chart.id]}
                      colors={
                        chart.colors?.length ? chart.colors : COLORS
                      }
                    />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Dynamic Chart Renderer ───────────────────────────────

function RenderChart({
  chartDef,
  chartType,
  data,
  colors,
}: {
  chartDef: ChartDef
  chartType: ChartType
  data: unknown
  colors: string[]
}) {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className='flex h-[280px] items-center justify-center text-sm text-muted-foreground'>
        Sin datos para este gráfico
      </div>
    )
  }

  if (chartDef.query.type === 'stats') {
    return (
      <StatsChart
        data={data as StatsData}
        colors={colors}
        horizontal={chartType === 'bar_h'}
      />
    )
  }

  if (chartDef.query.type === 'timeline') {
    const d = data as TimelinePoint[]
    switch (chartType) {
      case 'area':
        return <AreaChartView data={d} colors={colors} />
      case 'bar':
        return (
          <BarChartView
            data={d}
            dataKey='count'
            nameKey='period'
            colors={colors}
          />
        )
      case 'bar_h':
        return (
          <HorizontalBarChartView
            data={d.map((p) => ({ label: p.period, value: p.count }))}
            colors={colors}
          />
        )
      case 'doughnut':
        return (
          <PieChartView
            data={d.map((p) => ({ label: p.period, value: p.count }))}
            colors={colors}
          />
        )
      default:
        return <LineChartView data={d} colors={colors} />
    }
  }

  if (chartDef.query.type === 'timeline_agg') {
    const d = data as TimelineAggPoint[]
    const mapped = d.map((p) => ({
      period: p.period,
      count: p.total,
    }))
    switch (chartType) {
      case 'area':
        return <AreaChartView data={mapped} colors={colors} dataKey='count' label='Total' />
      case 'bar':
        return (
          <BarChartView
            data={mapped}
            dataKey='count'
            nameKey='period'
            colors={colors}
          />
        )
      case 'bar_h':
        return (
          <HorizontalBarChartView
            data={mapped.map((p) => ({ label: p.period, value: p.count }))}
            colors={colors}
          />
        )
      case 'doughnut':
        return (
          <PieChartView
            data={mapped.map((p) => ({ label: p.period, value: p.count }))}
            colors={colors}
          />
        )
      default:
        return <LineChartView data={mapped} colors={colors} dataKey='count' label='Total' />
    }
  }

  if (chartDef.query.type === 'distribution') {
    const d = data as DistPoint[]
    switch (chartType) {
      case 'line':
        return (
          <LineChartView
            data={d.map((p) => ({ period: p.label, count: p.value }))}
            colors={colors}
          />
        )
      case 'area':
        return (
          <AreaChartView
            data={d.map((p) => ({ period: p.label, count: p.value }))}
            colors={colors}
          />
        )
      case 'bar':
        return (
          <BarChartView
            data={d}
            dataKey='value'
            nameKey='label'
            colors={colors}
          />
        )
      case 'bar_h':
        return <HorizontalBarChartView data={d} colors={colors} />
      default:
        return <PieChartView data={d} colors={colors} />
    }
  }

  return (
    <div className='flex h-[280px] items-center justify-center text-sm text-muted-foreground'>
      Gráfico no disponible
    </div>
  )
}

// ─── Reusable Chart Components ────────────────────────────

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  color: 'hsl(var(--popover-foreground))',
}

function LineChartView({
  data,
  colors,
  dataKey = 'count',
  label = 'Cantidad',
}: {
  data: TimelinePoint[]
  colors: string[]
  dataKey?: string
  label?: string
}) {
  return (
    <div className='h-[280px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
          <XAxis
            dataKey='period'
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(v: string) =>
              v.length === 10 ? v.slice(5) : v
            }
          />
          <YAxis
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={45}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type='monotone'
            dataKey={dataKey}
            name={label}
            stroke={colors[0]}
            strokeWidth={2.5}
            dot={{ r: 3, fill: colors[0] }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function AreaChartView({
  data,
  colors,
  dataKey = 'count',
  label = 'Cantidad',
}: {
  data: TimelinePoint[]
  colors: string[]
  dataKey?: string
  label?: string
}) {
  return (
    <div className='h-[280px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
          <XAxis
            dataKey='period'
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(v: string) =>
              v.length === 10 ? v.slice(5) : v
            }
          />
          <YAxis
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={45}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type='monotone'
            dataKey={dataKey}
            name={label}
            stroke={colors[0]}
            fill={colors[0]}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function BarChartView({
  data,
  dataKey,
  nameKey,
  colors,
}: {
  data: unknown[]
  dataKey: string
  nameKey: string
  colors: string[]
}) {
  return (
    <div className='h-[280px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
          <XAxis
            dataKey={nameKey}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(v: string) =>
              typeof v === 'string' && v.length > 12
                ? v.slice(0, 12) + '\u2026'
                : v
            }
          />
          <YAxis
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={50}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey={dataKey} name='Cantidad' radius={[6, 6, 0, 0]}>
            {(data as Record<string, unknown>[]).map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function HorizontalBarChartView({
  data,
  colors,
}: {
  data: DistPoint[]
  colors: string[]
}) {
  return (
    <div className='h-[320px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart
          data={data}
          layout='vertical'
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray='3 3'
            className='stroke-border'
            horizontal={false}
          />
          <XAxis
            type='number'
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            type='category'
            dataKey='label'
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={100}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(v: string) =>
              typeof v === 'string' && v.length > 16
                ? v.slice(0, 16) + '\u2026'
                : v
            }
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey='value' name='Cantidad' radius={[0, 6, 6, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function PieChartView({
  data,
  colors,
}: {
  data: DistPoint[]
  colors: string[]
}) {
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className='h-[280px] relative'>
      <ResponsiveContainer width='100%' height='100%'>
        <PieChart>
          <Pie
            data={data}
            cx='50%'
            cy='45%'
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey='value'
            nameKey='label'
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [Number(value).toLocaleString(), '']}
          />
          <Legend
            verticalAlign='bottom'
            height={36}
            formatter={(value: string) => (
              <span className='text-sm text-foreground'>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <div
        className='absolute inset-0 flex items-center justify-center pointer-events-none'
        style={{ bottom: '50px' }}
      >
        <div className='text-center'>
          <p className='text-xl font-bold tabular-nums'>
            {total.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}

function StatsChart({
  data,
  colors,
  horizontal = false,
}: {
  data: StatsData
  colors: string[]
  horizontal?: boolean
}) {
  const chartData = [
    { name: 'Total', value: data.sum },
    { name: 'Promedio', value: Math.round(data.avg * 100) / 100 },
    { name: 'Mín', value: data.min },
    { name: 'Máx', value: data.max },
  ]

  if (horizontal) {
    return (
      <div className='h-[280px]'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart
            data={chartData}
            layout='vertical'
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray='3 3'
              className='stroke-border'
              horizontal={false}
            />
            <XAxis
              type='number'
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(v: number) =>
                typeof v === 'number'
                  ? v.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })
                  : String(v)
              }
            />
            <YAxis
              type='category'
              dataKey='name'
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={70}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [
                Number(value).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                }),
                '',
              ]}
            />
            <Bar dataKey='value' radius={[0, 6, 6, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className='h-[280px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
          <XAxis
            dataKey='name'
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={60}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(v: number) =>
              typeof v === 'number'
                ? v.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })
                : String(v)
            }
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [
              Number(value).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              }),
              '',
            ]}
          />
          <Bar dataKey='value' radius={[6, 6, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
