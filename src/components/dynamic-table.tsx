import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    type SortingState,
    type ColumnFiltersState,
    type VisibilityState,
} from '@tanstack/react-table'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    ArrowUpDown,
    MoreHorizontal,
    Plus,
    Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface DynamicTableProps {
    model: string
}

export function DynamicTable({ model }: DynamicTableProps) {
    const [data, setData] = useState<any[]>([])
    const [metadata, setMetadata] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})

    useEffect(() => {
        fetchMetadata()
        fetchData()
    }, [model])

    const fetchMetadata = async () => {
        try {
            const response = await api.get(`/metadata/table/${model}`)
            setMetadata(response.data)
        } catch (error) {
            console.error('Error fetching metadata:', error)
        }
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            // Use /me endpoint by default for user-scoped data
            const response = await api.get(`/data/${model}/me`)
            const json = response.data
            // Wrap in array if single object, or use data property if paginated
            const tableData = json.data || (Array.isArray(json) ? json : [])
            setData(tableData)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Generate columns from metadata
    const columns: ColumnDef<any>[] = metadata?.columns?.map((col: any) => ({
        accessorKey: col.key,
        header: ({ column }: { column: any }) => {
            if (!col.sortable) return col.label
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    {col.label}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }: { row: any }) => {
            const value = row.getValue(col.key)

            if (col.type === 'date') {
                return value ? format(new Date(value as string), 'PPP') : '-'
            }

            if (col.cellStyle === 'badge') {
                return <Badge variant={value === 'active' ? 'default' : 'secondary'}>{value as string}</Badge>
            }

            // Handle nested objects (like user.name)
            if (col.key.includes('.')) {
                const keys = col.key.split('.')
                let current = row.original
                for (const key of keys) {
                    if (current && current[key]) {
                        current = current[key]
                    } else {
                        return '-'
                    }
                }
                return current
            }

            return value
        },
    })) || []

    // Add Actions Column
    if (columns.length > 0 && metadata?.enable_crud_actions) {
        columns.push({
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(row.original.id)}
                            >
                                Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        })
    }

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    if (loading && !metadata) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="w-full">
            <div className="flex items-center py-4 justify-between">
                <Input
                    placeholder={metadata?.search_placeholder || "Search..."}
                    value={(table.getColumn(metadata?.search_columns?.[0] || 'name')?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn(metadata?.search_columns?.[0] || 'name')?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                {metadata?.enable_crud_actions && (
                    <Button><Plus className='mr-2 h-4 w-4' /> Create New</Button>
                )}
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    {loading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : "No results."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}
