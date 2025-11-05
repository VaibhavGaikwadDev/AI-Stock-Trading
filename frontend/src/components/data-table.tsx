"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconMail,
  IconShieldCheck,
  IconShieldOff,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { string, z } from "zod"
import axios from "axios"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

// Updated schema for users
export const schema = z.object({
  id: z.number(),
  user_id: z.string(),
  name: z.string(),
  email: z.string(),
  wallet_balance: z.number(),
  trial_remaining: z.number(),
  email_verified: z.boolean(),
  blocked: z.boolean(),
  created_at: z.string(),
})

type User = z.infer<typeof schema>

// API Base
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Fetch users
async function fetchUsers(search: string = "", limit: number = 10, page: number = 1): Promise<{ users: User[], total: number }> {
  const offset = (page - 1) * limit;
  const params = new URLSearchParams({ search, page: page.toString(), limit: limit.toString() });
  const token = localStorage.getItem("adminToken");
  const res = await axios.get(`${API_BASE}/users?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// Drag handle
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({ id });
  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

// Columns for users
const columns: ColumnDef<User>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div>{row.original.email}</div>,
  },
  {
    accessorKey: "user_id",
    header: "User ID",
    cell: ({ row }) => <div className="font-mono text-sm">{row.original.user_id}</div>,
  },
  {
    accessorKey: "wallet_balance",
    header: () => <div className="w-full text-left">Wallet Balance</div>,
    cell: ({ row }) => (
      <form 
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const newBalance = parseFloat(formData.get("balance") as string);
          try {
            const token = localStorage.getItem("adminToken");
            await axios.put(`${API_BASE}/users/${row.original.user_id}`, { wallet_balance: newBalance }, {
              headers: { Authorization: `Bearer ${token}` },
            });
            toast.success(`Updated balance for ${row.original.name}`);
          } catch (err: any) {
            toast.error("Failed to update balance");
          }
        }}
      >
        <Label htmlFor={`${row.original.id}-balance`} className="sr-only">
          Balance
        </Label>
        <Input
          className="h-8 w-20 border-transparent bg-transparent text-center shadow-none focus-visible:border"
          defaultValue={row.original.wallet_balance}
          id={`${row.original.id}-balance`}
          name="balance"
          type="number"
          step="0.01"
        />
      </form>
    ),
  },
  {
    accessorKey: "trial_remaining",
    header: () => <div className="w-full text-left">Trial Remaining</div>,
    cell: ({ row }) => (
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const newTrial = parseInt(formData.get("trial") as string);
          try {
            const token = localStorage.getItem("adminToken");
            await axios.put(`${API_BASE}/users/${row.original.user_id}`, { trial_remaining: newTrial }, {
              headers: { Authorization: `Bearer ${token}` },
            });
            toast.success(`Updated trial for ${row.original.name}`);
          } catch (err: any) {
            toast.error("Failed to update trial");
          }
        }}
      >
        <Label htmlFor={`${row.original.id}-trial`} className="sr-only">
          Trial
        </Label>
        <Input
          className="h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border"
          defaultValue={row.original.trial_remaining}
          id={`${row.original.id}-trial`}
          name="trial"
          type="number"
        />
      </form>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.blocked ? "destructive" : "outline"}>
        {row.original.email_verified ? <IconShieldCheck className="mr-1" /> : <IconShieldOff className="mr-1" />}
        {row.original.blocked ? "Blocked" : row.original.email_verified ? "Verified" : "Unverified"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={async () => {
              try {
                const token = localStorage.getItem("adminToken");
                await axios.put(`${API_BASE}/users/${row.original.user_id}`, { blocked: !row.original.blocked }, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                toast.success(`User ${row.original.blocked ? "unblocked" : "blocked"}`);
                window.location.reload(); // Refresh for simplicity
              } catch (err: any) {
                toast.error("Failed to toggle block");
              }
            }}
          >
            {row.original.blocked ? "Unblock" : "Block"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              if (confirm(`Delete ${row.original.name}?`)) {
                try {
                  const token = localStorage.getItem("adminToken");
                  await axios.delete(`${API_BASE}/users/${row.original.user_id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  toast.success("User deleted");
                  window.location.reload();
                } catch (err: any) {
                  toast.error("Failed to delete user");
                }
              }
            }}
          >
            Delete
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              try {
                const token = localStorage.getItem("adminToken");
                await axios.post(`${API_BASE}/admin/send-notification/${row.original.user_id}`, {}, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Low balance email sent");
              } catch (err: any) {
                toast.error("Failed to send email");
              }
            }}
          >
            <IconMail className="mr-2" />
            Send Low Balance Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

// DraggableRow
function DraggableRow({ row }: { row: Row<User> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({ id: row.original.id });
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
      ))}
    </TableRow>
  )
}

// Add User Dialog
function AddUserDialog() {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({ name: "", email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(`${API_BASE}/users`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User created, OTP sent");
      setOpen(false);
      window.location.reload();
    } catch (err: any) {
      toast.error("Failed to create user");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <IconPlus className="mr-1" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Enter details to create account (OTP will be sent).</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
          </div>
          <DialogFooter>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DataTable() {
  const [data, setData] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const sortableId = React.useId();
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor), useSensor(KeyboardSensor));

  const dataIds = React.useMemo<UniqueIdentifier[]>(() => data?.map(({ id }) => id) || [], [data]);

  // Fetch data
  React.useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        const search = String(columnFilters.find(f => f.id === "email")?.value || "");
        const { users, total } = await fetchUsers(search, pagination.pageSize, pagination.pageIndex + 1);
        setData(users);
      } catch (err) {
        toast.error("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, [pagination.pageIndex, pagination.pageSize, columnFilters]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    pageCount: Math.ceil(100 / pagination.pageSize), // Mock; use total from API
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((prevData) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(prevData, oldIndex, newIndex);
      });
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><IconLoader className="animate-spin" /></div>;
  }

  return (
    <Tabs defaultValue="outline" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Users</h2>
          <AddUserDialog />
        </div>
        <TabsList className="hidden @4xl/main:flex">
          <TabsTrigger value="outline">Users ({data.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="history">Analysis History</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <TabsContent value="outline" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="payments" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed">Payments Table (Integrate /api/admin/payments)</div>
      </TabsContent>
      <TabsContent value="history" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed">History Table (Integrate /api/stock-history)</div>
      </TabsContent>
    </Tabs>
  )
}

// TableCellViewer (placeholder for user details drawer)
function TableCellViewer({ item }: { item: User }) {
  const isMobile = useIsMobile();
  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.name}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.name}</DrawerTitle>
          <DrawerDescription>User Details</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="grid gap-2">
            <div className="font-medium">Email: {item.email}</div>
            <div>User ID: {item.user_id}</div>
            <div>Balance: ${item.wallet_balance}</div>
            <div>Trial: {item.trial_remaining}</div>
            <div>Status: {item.blocked ? "Blocked" : "Active"}</div>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}