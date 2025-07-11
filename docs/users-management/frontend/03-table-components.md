# Users Management - Table Components Detailed Specification

## Overview
This document provides comprehensive specifications for all table-related components in the Users Management feature, including data display, filtering, sorting, pagination, and bulk operations.

## Table of Contents
1. [UserTable Component](#usertable-component)
2. [TableHeader Component](#tableheader-component)
3. [TableRow Component](#tablerow-component)
4. [TableCell Component](#tablecell-component)
5. [TablePagination Component](#tablepagination-component)
6. [TableFilters Component](#tablefilters-component)
7. [BulkActions Component](#bulkactions-component)
8. [ColumnSelector Component](#columnselector-component)
9. [ExportMenu Component](#exportmenu-component)
10. [TableSkeleton Component](#tableskeleton-component)

---

## 1. UserTable Component

### 1.1 Complete TypeScript Interface
```typescript
interface UserTableProps {
  // Data
  users: User[];
  loading?: boolean;
  error?: string | null;
  
  // Columns
  columns: TableColumn[];
  visibleColumns?: string[];
  onColumnVisibilityChange?: (columns: string[]) => void;
  
  // Selection
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  isRowSelectable?: (user: User) => boolean;
  
  // Sorting
  sortable?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string, order: 'asc' | 'desc') => void;
  multiSort?: boolean;
  sortConfigs?: SortConfig[];
  
  // Pagination
  paginated?: boolean;
  page?: number;
  pageSize?: number;
  totalItems?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  
  // Filtering
  showFilters?: boolean;
  filters?: TableFilter[];
  activeFilters?: Record<string, any>;
  onFilterChange?: (filters: Record<string, any>) => void;
  quickFilter?: boolean;
  
  // Actions
  rowActions?: RowAction[];
  bulkActions?: BulkAction[];
  showActionsColumn?: boolean;
  actionsColumnWidth?: string;
  
  // Display options
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  responsive?: boolean;
  stickyHeader?: boolean;
  stickyFirstColumn?: boolean;
  
  // Virtual scrolling
  virtual?: boolean;
  rowHeight?: number;
  overscan?: number;
  
  // Customization
  emptyMessage?: string;
  emptyIcon?: IconType;
  loadingRows?: number;
  className?: string;
  containerClassName?: string;
  
  // Callbacks
  onRowClick?: (user: User, event: React.MouseEvent) => void;
  onRowDoubleClick?: (user: User, event: React.MouseEvent) => void;
  onRowContextMenu?: (user: User, event: React.MouseEvent) => void;
  onRefresh?: () => void;
  
  // Advanced
  rowClassName?: (user: User) => string;
  cellClassName?: (user: User, column: TableColumn) => string;
  expandableRows?: boolean;
  renderExpandedRow?: (user: User) => React.ReactNode;
  
  // Export
  exportable?: boolean;
  onExport?: (format: ExportFormat, options: ExportOptions) => void;
}

interface TableColumn {
  id: string;
  header: string | React.ReactNode;
  accessor: string | ((row: User) => any);
  
  // Display
  cell?: (props: CellProps<User>) => React.ReactNode;
  header?: (props: HeaderProps) => React.ReactNode;
  footer?: (props: FooterProps) => React.ReactNode;
  
  // Sizing
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  
  // Behavior
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  hidden?: boolean;
  locked?: boolean;
  
  // Styling
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  
  // Metadata
  dataType?: 'string' | 'number' | 'date' | 'boolean' | 'custom';
  format?: (value: any) => string;
  exportFormat?: (value: any) => string;
}

interface SortConfig {
  column: string;
  order: 'asc' | 'desc';
  priority?: number;
}

interface TableFilter {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'boolean';
  options?: FilterOption[];
  placeholder?: string;
  defaultValue?: any;
  column?: string;
  operator?: FilterOperator;
}

interface RowAction {
  id: string;
  label: string;
  icon?: IconType;
  onClick: (user: User) => void;
  show?: (user: User) => boolean;
  disabled?: (user: User) => boolean;
  loading?: (user: User) => boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  confirmable?: boolean;
  confirmMessage?: string | ((user: User) => string);
}

interface BulkAction {
  id: string;
  label: string;
  icon?: IconType;
  onClick: (selectedIds: string[], users: User[]) => void;
  show?: (selectedIds: string[], users: User[]) => boolean;
  disabled?: (selectedIds: string[], users: User[]) => boolean;
  loading?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  confirmable?: boolean;
  confirmMessage?: string | ((count: number) => string);
  position?: 'top' | 'bottom' | 'both';
}
```

### 1.2 Column Definitions Example
```typescript
const userTableColumns: TableColumn[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
        aria-label="Select all users"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onChange={row.getToggleSelectedHandler()}
        aria-label={`Select ${row.original.fullName}`}
      />
    ),
    width: '40px',
    locked: true,
  },
  {
    id: 'user',
    header: 'User',
    accessor: 'fullName',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar
          src={row.original.avatar}
          alt={row.original.fullName}
          fallback={row.original.initials}
          size="sm"
          status={row.original.isOnline ? 'online' : 'offline'}
        />
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">
            {row.original.fullName}
          </span>
          <span className="text-sm text-gray-500">
            {row.original.email}
          </span>
        </div>
      </div>
    ),
    sortable: true,
    filterable: true,
    minWidth: '200px',
  },
  {
    id: 'role',
    header: 'Role',
    accessor: 'role',
    cell: ({ value }) => (
      <RoleBadge role={value} size="sm" />
    ),
    sortable: true,
    filterable: true,
    width: '150px',
    filterOptions: [
      { value: 'admin', label: 'Administrator' },
      { value: 'sales_manager', label: 'Sales Manager' },
      { value: 'finance_manager', label: 'Finance Manager' },
      { value: 'operations_manager', label: 'Operations Manager' },
    ],
  },
  {
    id: 'department',
    header: 'Department',
    accessor: 'department',
    cell: ({ value }) => (
      <DepartmentTag department={value} showIcon />
    ),
    sortable: true,
    filterable: true,
    width: '180px',
  },
  {
    id: 'accessLevel',
    header: 'Access Level',
    accessor: 'accessLevel',
    cell: ({ value }) => (
      <AccessLevelBadge level={value} showDescription />
    ),
    sortable: true,
    filterable: true,
    width: '140px',
    align: 'center',
  },
  {
    id: 'status',
    header: 'Status',
    accessor: 'status',
    cell: ({ value, row }) => (
      <StatusBadge
        status={value}
        reason={row.original.statusReason}
        showTooltip
      />
    ),
    sortable: true,
    filterable: true,
    width: '120px',
  },
  {
    id: 'lastActive',
    header: 'Last Active',
    accessor: 'lastLoginAt',
    cell: ({ value }) => (
      <TimeAgo date={value} />
    ),
    sortable: true,
    width: '140px',
    dataType: 'date',
  },
  {
    id: 'createdAt',
    header: 'Created',
    accessor: 'createdAt',
    cell: ({ value }) => (
      <span className="text-sm text-gray-500">
        {formatDate(value, 'MMM d, yyyy')}
      </span>
    ),
    sortable: true,
    width: '120px',
    dataType: 'date',
  },
  {
    id: 'actions',
    header: () => (
      <span className="sr-only">Actions</span>
    ),
    cell: ({ row }) => (
      <RowActionsMenu
        actions={rowActions}
        row={row.original}
        size="sm"
      />
    ),
    width: '80px',
    align: 'center',
    locked: true,
  },
];
```

### 1.3 Main Implementation
```typescript
export const UserTable: React.FC<UserTableProps> = ({
  users,
  loading = false,
  error = null,
  columns,
  selectionMode = 'multiple',
  // ... other props
}) => {
  // Table instance using TanStack Table
  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: selectionMode !== 'none',
    enableMultiRowSelection: selectionMode === 'multiple',
  });

  // Virtual scrolling
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => rowHeight,
    overscan: overscan ?? 5,
    enabled: virtual,
  });

  if (error) {
    return (
      <ErrorState
        title="Failed to load users"
        message={error}
        onRetry={onRefresh}
        icon={ExclamationIcon}
      />
    );
  }

  return (
    <div className={containerClassName}>
      {/* Toolbar */}
      {(showFilters || bulkActions || exportable) && (
        <TableToolbar
          selectedCount={Object.keys(rowSelection).length}
          totalCount={users.length}
          filters={filters}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
          bulkActions={bulkActions}
          onExport={onExport}
          onRefresh={onRefresh}
        />
      )}

      {/* Table Container */}
      <div
        ref={tableContainerRef}
        className={clsx(
          'overflow-auto',
          { 'max-h-[600px]': virtual },
          className
        )}
      >
        <table
          className={clsx(
            'min-w-full divide-y divide-gray-200',
            {
              'table-fixed': columns.some(col => col.width),
              'border': bordered,
              'table-striped': striped,
            }
          )}
        >
          <TableHeader
            table={table}
            stickyHeader={stickyHeader}
            onColumnResize={handleColumnResize}
          />
          
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <TableSkeleton
                columns={columns.length}
                rows={loadingRows ?? pageSize ?? 10}
              />
            ) : rows.length === 0 ? (
              <TableEmptyState
                columns={columns.length}
                message={emptyMessage}
                icon={emptyIcon}
              />
            ) : virtual ? (
              // Virtual rows
              virtualRows.map(virtualRow => {
                const row = rows[virtualRow.index];
                return (
                  <TableRow
                    key={row.id}
                    row={row}
                    virtualRow={virtualRow}
                    onRowClick={onRowClick}
                    rowClassName={rowClassName}
                  />
                );
              })
            ) : (
              // Regular rows
              rows.map(row => (
                <TableRow
                  key={row.id}
                  row={row}
                  onRowClick={onRowClick}
                  rowClassName={rowClassName}
                />
              ))
            )}
          </tbody>
          
          {/* Table Footer */}
          {columns.some(col => col.footer) && (
            <TableFooter table={table} />
          )}
        </table>
      </div>

      {/* Pagination */}
      {paginated && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          pageSizeOptions={pageSizeOptions}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
};
```

---

## 2. TableHeader Component

### 2.1 Interface
```typescript
interface TableHeaderProps {
  table: Table<User>;
  stickyHeader?: boolean;
  resizable?: boolean;
  onColumnResize?: (columnId: string, width: number) => void;
  sortIndicatorPosition?: 'left' | 'right';
  className?: string;
}
```

### 2.2 Implementation with Sorting & Resizing
```typescript
export const TableHeader: React.FC<TableHeaderProps> = ({
  table,
  stickyHeader,
  resizable,
  onColumnResize,
  sortIndicatorPosition = 'right',
  className,
}) => {
  return (
    <thead
      className={clsx(
        'bg-gray-50',
        {
          'sticky top-0 z-10': stickyHeader,
        },
        className
      )}
    >
      {table.getHeaderGroups().map(headerGroup => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map(header => {
            const column = header.column;
            const canSort = column.getCanSort();
            const isSorted = column.getIsSorted();
            
            return (
              <th
                key={header.id}
                className={clsx(
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  {
                    'cursor-pointer select-none': canSort,
                    'hover:bg-gray-100': canSort,
                  },
                  column.columnDef.headerClassName
                )}
                style={{
                  width: header.getSize(),
                  minWidth: column.columnDef.minWidth,
                  maxWidth: column.columnDef.maxWidth,
                }}
                onClick={canSort ? column.getToggleSortingHandler() : undefined}
              >
                <div className="flex items-center justify-between">
                  {sortIndicatorPosition === 'left' && (
                    <SortIndicator column={column} />
                  )}
                  
                  <span className="flex-1">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </span>
                  
                  {sortIndicatorPosition === 'right' && (
                    <SortIndicator column={column} />
                  )}
                  
                  {resizable && !column.columnDef.locked && (
                    <ColumnResizer
                      header={header}
                      onResize={onColumnResize}
                    />
                  )}
                </div>
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
};

// Sort Indicator Component
const SortIndicator: React.FC<{ column: Column<User> }> = ({ column }) => {
  const isSorted = column.getIsSorted();
  
  if (!column.getCanSort()) return null;
  
  return (
    <span className="ml-2 flex-none">
      {isSorted === 'asc' ? (
        <ChevronUpIcon className="h-4 w-4" />
      ) : isSorted === 'desc' ? (
        <ChevronDownIcon className="h-4 w-4" />
      ) : (
        <SelectorIcon className="h-4 w-4 text-gray-400" />
      )}
    </span>
  );
};

// Column Resizer Component
const ColumnResizer: React.FC<{
  header: Header<User>;
  onResize?: (columnId: string, width: number) => void;
}> = ({ header, onResize }) => {
  const [isResizing, setIsResizing] = useState(false);
  
  return (
    <div
      className={clsx(
        'absolute right-0 top-0 h-full w-1 cursor-col-resize',
        {
          'bg-blue-500': isResizing,
          'hover:bg-gray-300': !isResizing,
        }
      )}
      onMouseDown={(e) => {
        header.getResizeHandler()(e);
        setIsResizing(true);
      }}
      onMouseUp={() => {
        setIsResizing(false);
        if (onResize) {
          onResize(header.column.id, header.getSize());
        }
      }}
      onTouchStart={header.getResizeHandler()}
    />
  );
};
```

---

## 3. TableRow Component

### 3.1 Interface
```typescript
interface TableRowProps {
  row: Row<User>;
  virtualRow?: VirtualItem;
  onRowClick?: (user: User, event: React.MouseEvent) => void;
  onRowDoubleClick?: (user: User, event: React.MouseEvent) => void;
  onRowContextMenu?: (user: User, event: React.MouseEvent) => void;
  rowClassName?: (user: User) => string;
  expandable?: boolean;
  striped?: boolean;
  hoverable?: boolean;
}
```

### 3.2 Implementation with Interactions
```typescript
export const TableRow: React.FC<TableRowProps> = memo(({
  row,
  virtualRow,
  onRowClick,
  onRowDoubleClick,
  onRowContextMenu,
  rowClassName,
  expandable,
  striped,
  hoverable = true,
}) => {
  const user = row.original;
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    // Don't trigger row click if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select')) return;
    
    onRowClick?.(user, e);
  }, [user, onRowClick]);
  
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    onRowDoubleClick?.(user, e);
  }, [user, onRowDoubleClick]);
  
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onRowContextMenu?.(user, e);
  }, [user, onRowContextMenu]);
  
  const rowClasses = clsx(
    'group',
    {
      'hover:bg-gray-50': hoverable,
      'bg-gray-50': striped && row.index % 2 === 1,
      'bg-blue-50': row.getIsSelected(),
      'opacity-50': user.status === 'inactive',
      'cursor-pointer': onRowClick,
    },
    rowClassName?.(user)
  );
  
  return (
    <>
      <tr
        className={rowClasses}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        style={virtualRow ? {
          height: `${virtualRow.size}px`,
          transform: `translateY(${virtualRow.start}px)`,
        } : undefined}
      >
        {row.getVisibleCells().map(cell => (
          <TableCell
            key={cell.id}
            cell={cell}
            isSelected={row.getIsSelected()}
          />
        ))}
      </tr>
      
      {expandable && isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan={row.getVisibleCells().length} className="px-6 py-4">
            <ExpandedRowContent user={user} />
          </td>
        </tr>
      )}
    </>
  );
});

TableRow.displayName = 'TableRow';
```

---

## 4. TableCell Component

### 4.1 Interface
```typescript
interface TableCellProps {
  cell: Cell<User>;
  isSelected?: boolean;
  editable?: boolean;
  onEdit?: (value: any) => void;
  className?: string;
}
```

### 4.2 Implementation with Inline Editing
```typescript
export const TableCell: React.FC<TableCellProps> = ({
  cell,
  isSelected,
  editable,
  onEdit,
  className,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(cell.getValue());
  
  const handleDoubleClick = useCallback(() => {
    if (editable && !cell.column.columnDef.locked) {
      setIsEditing(true);
    }
  }, [editable, cell.column.columnDef.locked]);
  
  const handleSave = useCallback(() => {
    onEdit?.(editValue);
    setIsEditing(false);
  }, [editValue, onEdit]);
  
  const handleCancel = useCallback(() => {
    setEditValue(cell.getValue());
    setIsEditing(false);
  }, [cell]);
  
  return (
    <td
      className={clsx(
        'px-6 py-4 whitespace-nowrap text-sm',
        {
          'text-gray-900': !isSelected,
          'text-blue-900': isSelected,
          'font-medium': cell.column.id === 'name',
        },
        cell.column.columnDef.cellClassName,
        className
      )}
      style={{
        textAlign: cell.column.columnDef.align,
      }}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <InlineEditor
          value={editValue}
          onChange={setEditValue}
          onSave={handleSave}
          onCancel={handleCancel}
          type={cell.column.columnDef.dataType}
        />
      ) : (
        flexRender(cell.column.columnDef.cell, cell.getContext())
      )}
    </td>
  );
};
```

---

## 5. TablePagination Component

### 5.1 Complete Interface
```typescript
interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages?: number;
  pageSizeOptions?: number[];
  
  // Callbacks
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  
  // Display options
  showPageSize?: boolean;
  showPageJumper?: boolean;
  showTotal?: boolean;
  showFirstLast?: boolean;
  
  // Limits
  maxPageButtons?: number;
  
  // Styling
  variant?: 'simple' | 'full';
  size?: 'sm' | 'md' | 'lg';
  position?: 'left' | 'center' | 'right' | 'between';
  className?: string;
  
  // Labels
  labels?: {
    page?: string;
    of?: string;
    items?: string;
    perPage?: string;
    showing?: string;
    to?: string;
    results?: string;
    first?: string;
    previous?: string;
    next?: string;
    last?: string;
  };
}
```

### 5.2 Full Implementation
```typescript
export const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  pageSize,
  totalItems,
  totalPages = Math.ceil(totalItems / pageSize),
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  showPageSize = true,
  showPageJumper = false,
  showTotal = true,
  showFirstLast = true,
  maxPageButtons = 7,
  variant = 'full',
  size = 'md',
  position = 'between',
  className,
  labels = {},
}) => {
  const {
    page: pageLabel = 'Page',
    of: ofLabel = 'of',
    items: itemsLabel = 'items',
    perPage: perPageLabel = 'per page',
    showing: showingLabel = 'Showing',
    to: toLabel = 'to',
    results: resultsLabel = 'results',
    first: firstLabel = 'First',
    previous: previousLabel = 'Previous',
    next: nextLabel = 'Next',
    last: lastLabel = 'Last',
  } = labels;
  
  // Calculate page numbers to display
  const getPageNumbers = () => {
    const delta = Math.floor(maxPageButtons / 2);
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number;
    
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      }
    }
    
    range.forEach((i, index) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });
    
    return rangeWithDots;
  };
  
  // Calculate showing range
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);
  
  if (variant === 'simple') {
    return (
      <div className={clsx('flex items-center gap-4', className)}>
        <Button
          variant="ghost"
          size={size}
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          icon={ChevronLeftIcon}
        >
          {previousLabel}
        </Button>
        
        <span className="text-sm text-gray-700">
          {pageLabel} {page} {ofLabel} {totalPages}
        </span>
        
        <Button
          variant="ghost"
          size={size}
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          icon={ChevronRightIcon}
          iconPosition="right"
        >
          {nextLabel}
        </Button>
      </div>
    );
  }
  
  return (
    <div
      className={clsx(
        'flex items-center',
        {
          'justify-start': position === 'left',
          'justify-center': position === 'center',
          'justify-end': position === 'right',
          'justify-between': position === 'between',
        },
        className
      )}
    >
      {/* Total and page size */}
      <div className="flex items-center gap-4">
        {showTotal && (
          <span className="text-sm text-gray-700">
            {showingLabel} {startItem} {toLabel} {endItem} {ofLabel} {totalItems} {resultsLabel}
          </span>
        )}
        
        {showPageSize && (
          <Select
            value={pageSize}
            onChange={(value) => onPageSizeChange(Number(value))}
            options={pageSizeOptions.map(size => ({
              value: size,
              label: `${size} ${perPageLabel}`,
            }))}
            size={size}
            className="w-32"
          />
        )}
      </div>
      
      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {showFirstLast && (
          <Button
            variant="ghost"
            size={size}
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            icon={ChevronDoubleLeftIcon}
            iconOnly
            ariaLabel={firstLabel}
          />
        )}
        
        <Button
          variant="ghost"
          size={size}
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          icon={ChevronLeftIcon}
          iconOnly
          ariaLabel={previousLabel}
        />
        
        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNumber, index) => (
            pageNumber === '...' ? (
              <span key={`dots-${index}`} className="px-3 text-gray-500">
                ...
              </span>
            ) : (
              <Button
                key={pageNumber}
                variant={pageNumber === page ? 'primary' : 'ghost'}
                size={size}
                onClick={() => onPageChange(pageNumber as number)}
                className="min-w-[40px]"
              >
                {pageNumber}
              </Button>
            )
          ))}
        </div>
        
        <Button
          variant="ghost"
          size={size}
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          icon={ChevronRightIcon}
          iconOnly
          ariaLabel={nextLabel}
        />
        
        {showFirstLast && (
          <Button
            variant="ghost"
            size={size}
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            icon={ChevronDoubleRightIcon}
            iconOnly
            ariaLabel={lastLabel}
          />
        )}
        
        {/* Page jumper */}
        {showPageJumper && (
          <PageJumper
            currentPage={page}
            totalPages={totalPages}
            onJump={onPageChange}
            size={size}
          />
        )}
      </div>
    </div>
  );
};
```

---

## 6. TableFilters Component

### 6.1 Complete Interface
```typescript
interface TableFiltersProps {
  filters: TableFilter[];
  activeFilters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  onClearFilters: () => void;
  
  // Display options
  layout?: 'horizontal' | 'vertical' | 'grid';
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchDebounce?: number;
  
  // Advanced filters
  showAdvanced?: boolean;
  advancedFilters?: TableFilter[];
  savedFilters?: SavedFilter[];
  onSaveFilter?: (name: string, filters: Record<string, any>) => void;
  onLoadFilter?: (filter: SavedFilter) => void;
  
  // Styling
  variant?: 'inline' | 'dropdown' | 'sidebar';
  className?: string;
}

interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, any>;
  isDefault?: boolean;
  createdAt: Date;
  createdBy: string;
}
```

### 6.2 Implementation with Multiple Layouts
```typescript
export const TableFilters: React.FC<TableFiltersProps> = ({
  filters,
  activeFilters,
  onFilterChange,
  onClearFilters,
  layout = 'horizontal',
  showSearch = true,
  searchPlaceholder = 'Search...',
  searchDebounce = 300,
  showAdvanced = false,
  advancedFilters = [],
  savedFilters = [],
  onSaveFilter,
  onLoadFilter,
  variant = 'inline',
  className,
}) => {
  const [search, setSearch] = useState(activeFilters.search || '');
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  const [saveFilterModalOpen, setSaveFilterModalOpen] = useState(false);
  
  // Debounced search
  const debouncedSearch = useDebounce(search, searchDebounce);
  
  useEffect(() => {
    if (debouncedSearch !== activeFilters.search) {
      onFilterChange({ ...activeFilters, search: debouncedSearch });
    }
  }, [debouncedSearch]);
  
  const handleFilterChange = (filterId: string, value: any) => {
    const newFilters = { ...activeFilters };
    
    if (value === null || value === undefined || value === '') {
      delete newFilters[filterId];
    } else {
      newFilters[filterId] = value;
    }
    
    onFilterChange(newFilters);
  };
  
  const activeFilterCount = Object.keys(activeFilters).filter(
    key => key !== 'search' && activeFilters[key] !== null
  ).length;
  
  if (variant === 'dropdown') {
    return (
      <Dropdown
        trigger={
          <Button variant="outline" icon={FilterIcon}>
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
        }
        className="w-80"
      >
        <FilterPanel
          filters={filters}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          onClearFilters={onClearFilters}
        />
      </Dropdown>
    );
  }
  
  if (variant === 'sidebar') {
    return (
      <div className={clsx('border-r border-gray-200 p-4', className)}>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all
            </button>
          )}
        </div>
        
        <FilterPanel
          filters={filters}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          layout="vertical"
        />
      </div>
    );
  }
  
  // Inline variant
  return (
    <div className={clsx('space-y-4', className)}>
      <div
        className={clsx('flex', {
          'flex-row items-center gap-4': layout === 'horizontal',
          'flex-col gap-4': layout === 'vertical',
          'grid grid-cols-2 gap-4': layout === 'grid',
        })}
      >
        {/* Search */}
        {showSearch && (
          <div className="flex-1 max-w-md">
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              icon={SearchIcon}
              clearable
              onClear={() => setSearch('')}
            />
          </div>
        )}
        
        {/* Quick filters */}
        {filters.map(filter => (
          <FilterInput
            key={filter.id}
            filter={filter}
            value={activeFilters[filter.id]}
            onChange={(value) => handleFilterChange(filter.id, value)}
          />
        ))}
        
        {/* Filter actions */}
        <div className="flex items-center gap-2">
          {showAdvanced && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedPanel(!showAdvancedPanel)}
            >
              Advanced
              <ChevronDownIcon
                className={clsx('ml-1 h-4 w-4 transition-transform', {
                  'rotate-180': showAdvancedPanel,
                })}
              />
            </Button>
          )}
          
          {savedFilters.length > 0 && (
            <SavedFiltersDropdown
              savedFilters={savedFilters}
              onLoad={onLoadFilter}
              onSave={() => setSaveFilterModalOpen(true)}
            />
          )}
          
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              icon={XIcon}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
      
      {/* Advanced filters panel */}
      {showAdvanced && showAdvancedPanel && (
        <AdvancedFiltersPanel
          filters={advancedFilters}
          activeFilters={activeFilters}
          onChange={handleFilterChange}
        />
      )}
      
      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <ActiveFilterChips
          filters={[...filters, ...advancedFilters]}
          activeFilters={activeFilters}
          onRemove={handleFilterChange}
        />
      )}
    </div>
  );
};
```

---

## 7. BulkActions Component

### 7.1 Interface
```typescript
interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  actions: BulkAction[];
  
  // Display
  position?: 'top' | 'bottom' | 'floating';
  showSelectAll?: boolean;
  showSelectedCount?: boolean;
  
  // Callbacks
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  
  // Styling
  variant?: 'bar' | 'dropdown' | 'inline';
  className?: string;
}
```

### 7.2 Implementation
```typescript
export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  totalCount,
  actions,
  position = 'top',
  showSelectAll = true,
  showSelectedCount = true,
  onSelectAll,
  onDeselectAll,
  variant = 'bar',
  className,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  
  const handleAction = async (action: BulkAction) => {
    if (action.confirmable) {
      const confirmed = await confirm({
        title: `Confirm ${action.label}`,
        message: action.confirmMessage || `Are you sure you want to ${action.label.toLowerCase()} ${selectedCount} items?`,
        confirmLabel: action.label,
        variant: action.variant,
      });
      
      if (!confirmed) return;
    }
    
    setLoadingAction(action.id);
    
    try {
      await action.onClick(selectedIds, selectedUsers);
      toast.success(`${action.label} completed successfully`);
    } catch (error) {
      toast.error(`Failed to ${action.label.toLowerCase()}`);
    } finally {
      setLoadingAction(null);
    }
  };
  
  if (selectedCount === 0) return null;
  
  if (variant === 'dropdown') {
    return (
      <Dropdown
        trigger={
          <Button variant="outline" icon={DotsHorizontalIcon}>
            Bulk Actions ({selectedCount})
          </Button>
        }
      >
        {actions.map(action => (
          <DropdownItem
            key={action.id}
            icon={action.icon}
            onClick={() => handleAction(action)}
            disabled={action.disabled?.(selectedIds, selectedUsers)}
            loading={loadingAction === action.id}
          >
            {action.label}
          </DropdownItem>
        ))}
      </Dropdown>
    );
  }
  
  if (variant === 'bar') {
    return (
      <div
        className={clsx(
          'flex items-center justify-between p-4 bg-blue-50 border-b border-blue-200',
          {
            'fixed bottom-0 left-0 right-0 z-20': position === 'floating',
          },
          className
        )}
      >
        <div className="flex items-center gap-4">
          {showSelectedCount && (
            <span className="text-sm font-medium text-blue-900">
              {selectedCount} selected
              {showSelectAll && selectedCount < totalCount && (
                <>
                  {' '}
                  <button
                    onClick={onSelectAll}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Select all {totalCount}
                  </button>
                </>
              )}
            </span>
          )}
          
          <button
            onClick={onDeselectAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear selection
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {actions.map(action => (
            <Button
              key={action.id}
              variant={action.variant || 'secondary'}
              size="sm"
              icon={action.icon}
              onClick={() => handleAction(action)}
              disabled={action.disabled?.(selectedIds, selectedUsers)}
              loading={loadingAction === action.id}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }
  
  // Inline variant
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      {actions.map(action => (
        <Button
          key={action.id}
          variant={action.variant || 'ghost'}
          size="sm"
          icon={action.icon}
          onClick={() => handleAction(action)}
          disabled={action.disabled?.(selectedIds, selectedUsers)}
          loading={loadingAction === action.id}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
};
```

---

## 8. ColumnSelector Component

### 8.1 Interface
```typescript
interface ColumnSelectorProps {
  columns: TableColumn[];
  visibleColumns: string[];
  onChange: (columns: string[]) => void;
  
  // Groups
  groups?: ColumnGroup[];
  
  // Display
  showReset?: boolean;
  showSelectAll?: boolean;
  maxHeight?: string;
  
  // Persistence
  saveKey?: string;
  
  // Styling
  variant?: 'dropdown' | 'modal' | 'sidebar';
  className?: string;
}

interface ColumnGroup {
  id: string;
  label: string;
  columns: string[];
  defaultVisible?: boolean;
}
```

### 8.2 Implementation
```typescript
export const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  columns,
  visibleColumns,
  onChange,
  groups = [],
  showReset = true,
  showSelectAll = true,
  maxHeight = '400px',
  saveKey,
  variant = 'dropdown',
  className,
}) => {
  const [search, setSearch] = useState('');
  const [localVisible, setLocalVisible] = useState(visibleColumns);
  
  // Filter columns
  const filteredColumns = columns.filter(col =>
    col.header.toLowerCase().includes(search.toLowerCase())
  );
  
  // Group columns
  const groupedColumns = groups.map(group => ({
    ...group,
    columns: filteredColumns.filter(col => group.columns.includes(col.id)),
  }));
  
  const ungroupedColumns = filteredColumns.filter(
    col => !groups.some(group => group.columns.includes(col.id))
  );
  
  const handleToggle = (columnId: string) => {
    const newVisible = localVisible.includes(columnId)
      ? localVisible.filter(id => id !== columnId)
      : [...localVisible, columnId];
    
    setLocalVisible(newVisible);
    onChange(newVisible);
    
    if (saveKey) {
      localStorage.setItem(`${saveKey}-columns`, JSON.stringify(newVisible));
    }
  };
  
  const handleToggleGroup = (group: ColumnGroup) => {
    const groupColumnIds = group.columns.map(col => col.id);
    const allVisible = groupColumnIds.every(id => localVisible.includes(id));
    
    const newVisible = allVisible
      ? localVisible.filter(id => !groupColumnIds.includes(id))
      : [...new Set([...localVisible, ...groupColumnIds])];
    
    setLocalVisible(newVisible);
    onChange(newVisible);
  };
  
  const handleSelectAll = () => {
    const allIds = columns.map(col => col.id);
    setLocalVisible(allIds);
    onChange(allIds);
  };
  
  const handleDeselectAll = () => {
    const requiredIds = columns.filter(col => col.locked).map(col => col.id);
    setLocalVisible(requiredIds);
    onChange(requiredIds);
  };
  
  const handleReset = () => {
    const defaultIds = columns
      .filter(col => !col.hidden)
      .map(col => col.id);
    setLocalVisible(defaultIds);
    onChange(defaultIds);
  };
  
  const content = (
    <div className="p-4">
      <div className="mb-4">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search columns..."
          size="sm"
          icon={SearchIcon}
        />
      </div>
      
      <div
        className="space-y-2 overflow-y-auto"
        style={{ maxHeight }}
      >
        {/* Grouped columns */}
        {groupedColumns.map(group => (
          <div key={group.id} className="space-y-1">
            <div className="flex items-center">
              <Checkbox
                checked={group.columns.every(col =>
                  localVisible.includes(col.id)
                )}
                indeterminate={
                  group.columns.some(col => localVisible.includes(col.id)) &&
                  !group.columns.every(col => localVisible.includes(col.id))
                }
                onChange={() => handleToggleGroup(group)}
                label={group.label}
                className="font-medium"
              />
            </div>
            
            <div className="ml-6 space-y-1">
              {group.columns.map(column => (
                <ColumnCheckbox
                  key={column.id}
                  column={column}
                  checked={localVisible.includes(column.id)}
                  onChange={() => handleToggle(column.id)}
                />
              ))}
            </div>
          </div>
        ))}
        
        {/* Ungrouped columns */}
        {ungroupedColumns.length > 0 && (
          <div className="space-y-1">
            {groups.length > 0 && (
              <div className="font-medium text-gray-700 mb-1">Other</div>
            )}
            {ungroupedColumns.map(column => (
              <ColumnCheckbox
                key={column.id}
                column={column}
                checked={localVisible.includes(column.id)}
                onChange={() => handleToggle(column.id)}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-4 flex items-center justify-between border-t pt-4">
        <div className="flex gap-2">
          {showSelectAll && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
              >
                Deselect All
              </Button>
            </>
          )}
        </div>
        
        {showReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
  
  if (variant === 'dropdown') {
    return (
      <Dropdown
        trigger={
          <Button variant="ghost" icon={ViewColumnsIcon} size="sm">
            Columns
          </Button>
        }
        className="w-80"
      >
        {content}
      </Dropdown>
    );
  }
  
  if (variant === 'modal') {
    return (
      <>
        <Button
          variant="ghost"
          icon={ViewColumnsIcon}
          size="sm"
          onClick={() => setModalOpen(true)}
        >
          Columns
        </Button>
        
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Select Columns"
          size="md"
        >
          {content}
        </Modal>
      </>
    );
  }
  
  // Sidebar variant
  return <div className={className}>{content}</div>;
};
```

---

## 9. ExportMenu Component

### 9.1 Interface
```typescript
interface ExportMenuProps {
  onExport: (format: ExportFormat, options: ExportOptions) => void;
  
  // Formats
  formats?: ExportFormat[];
  
  // Options
  allowColumnSelection?: boolean;
  allowFilteredOnly?: boolean;
  allowFormatOptions?: boolean;
  
  // Current state
  totalRows?: number;
  filteredRows?: number;
  selectedRows?: number;
  columns?: TableColumn[];
  
  // Styling
  variant?: 'dropdown' | 'modal';
  className?: string;
}

interface ExportFormat {
  id: string;
  label: string;
  icon?: IconType;
  extension: string;
  mimeType: string;
  options?: FormatOption[];
}

interface ExportOptions {
  format: string;
  columns?: string[];
  includeHeaders?: boolean;
  filteredOnly?: boolean;
  selectedOnly?: boolean;
  formatOptions?: Record<string, any>;
}
```

### 9.2 Implementation
```typescript
export const ExportMenu: React.FC<ExportMenuProps> = ({
  onExport,
  formats = defaultFormats,
  allowColumnSelection = true,
  allowFilteredOnly = true,
  allowFormatOptions = true,
  totalRows = 0,
  filteredRows = 0,
  selectedRows = 0,
  columns = [],
  variant = 'dropdown',
  className,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(formats[0]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.filter(col => !col.hidden).map(col => col.id)
  );
  const [options, setOptions] = useState<ExportOptions>({
    format: formats[0].id,
    columns: selectedColumns,
    includeHeaders: true,
    filteredOnly: false,
    selectedOnly: false,
    formatOptions: {},
  });
  
  const handleExport = () => {
    onExport(selectedFormat, options);
    setModalOpen(false);
    
    toast.success(`Export started. Your ${selectedFormat.label} file will download shortly.`);
  };
  
  const getRowCount = () => {
    if (options.selectedOnly && selectedRows > 0) return selectedRows;
    if (options.filteredOnly && filteredRows > 0) return filteredRows;
    return totalRows;
  };
  
  if (variant === 'dropdown') {
    return (
      <Dropdown
        trigger={
          <Button variant="outline" size="sm" icon={DownloadIcon}>
            Export
          </Button>
        }
        className="w-48"
      >
        {formats.map(format => (
          <DropdownItem
            key={format.id}
            icon={format.icon}
            onClick={() => {
              if (allowColumnSelection || allowFilteredOnly || allowFormatOptions) {
                setSelectedFormat(format);
                setModalOpen(true);
              } else {
                onExport(format, {
                  format: format.id,
                  columns: columns.map(col => col.id),
                  includeHeaders: true,
                });
              }
            }}
          >
            Export as {format.label}
          </DropdownItem>
        ))}
      </Dropdown>
    );
  }
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        icon={DownloadIcon}
        onClick={() => setModalOpen(true)}
        className={className}
      >
        Export
      </Button>
      
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Export Data"
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExport}
              icon={DownloadIcon}
            >
              Export {getRowCount()} rows
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Format selection */}
          <FormField label="Export Format" required>
            <RadioGroup
              value={selectedFormat.id}
              onChange={(id) => setSelectedFormat(
                formats.find(f => f.id === id)!
              )}
            >
              {formats.map(format => (
                <Radio
                  key={format.id}
                  value={format.id}
                  label={format.label}
                  description={`Export as ${format.extension} file`}
                  icon={format.icon}
                />
              ))}
            </RadioGroup>
          </FormField>
          
          {/* Row selection */}
          <FormField label="Rows to Export">
            <RadioGroup
              value={
                options.selectedOnly ? 'selected' :
                options.filteredOnly ? 'filtered' : 'all'
              }
              onChange={(value) => {
                setOptions({
                  ...options,
                  selectedOnly: value === 'selected',
                  filteredOnly: value === 'filtered',
                });
              }}
            >
              <Radio
                value="all"
                label={`All rows (${totalRows})`}
              />
              {filteredRows < totalRows && (
                <Radio
                  value="filtered"
                  label={`Filtered rows (${filteredRows})`}
                  disabled={!allowFilteredOnly}
                />
              )}
              {selectedRows > 0 && (
                <Radio
                  value="selected"
                  label={`Selected rows (${selectedRows})`}
                />
              )}
            </RadioGroup>
          </FormField>
          
          {/* Column selection */}
          {allowColumnSelection && (
            <FormField label="Columns to Export">
              <ColumnSelector
                columns={columns.filter(col => col.id !== 'select' && col.id !== 'actions')}
                visibleColumns={selectedColumns}
                onChange={setSelectedColumns}
                variant="inline"
                showReset={false}
              />
            </FormField>
          )}
          
          {/* Format options */}
          {allowFormatOptions && selectedFormat.options && (
            <FormField label="Format Options">
              {selectedFormat.options.map(option => (
                <FormatOption
                  key={option.id}
                  option={option}
                  value={options.formatOptions[option.id]}
                  onChange={(value) => setOptions({
                    ...options,
                    formatOptions: {
                      ...options.formatOptions,
                      [option.id]: value,
                    },
                  })}
                />
              ))}
            </FormField>
          )}
          
          {/* Additional options */}
          <FormField>
            <Checkbox
              checked={options.includeHeaders}
              onChange={(checked) => setOptions({
                ...options,
                includeHeaders: checked,
              })}
              label="Include column headers"
            />
          </FormField>
        </div>
      </Modal>
    </>
  );
};

// Default export formats
const defaultFormats: ExportFormat[] = [
  {
    id: 'csv',
    label: 'CSV',
    icon: DocumentTextIcon,
    extension: '.csv',
    mimeType: 'text/csv',
    options: [
      {
        id: 'delimiter',
        label: 'Delimiter',
        type: 'select',
        options: [
          { value: ',', label: 'Comma (,)' },
          { value: ';', label: 'Semicolon (;)' },
          { value: '\t', label: 'Tab' },
          { value: '|', label: 'Pipe (|)' },
        ],
        defaultValue: ',',
      },
    ],
  },
  {
    id: 'excel',
    label: 'Excel',
    icon: TableIcon,
    extension: '.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    options: [
      {
        id: 'sheetName',
        label: 'Sheet Name',
        type: 'text',
        defaultValue: 'Users',
      },
    ],
  },
  {
    id: 'json',
    label: 'JSON',
    icon: CodeIcon,
    extension: '.json',
    mimeType: 'application/json',
    options: [
      {
        id: 'pretty',
        label: 'Pretty Print',
        type: 'boolean',
        defaultValue: true,
      },
    ],
  },
  {
    id: 'pdf',
    label: 'PDF',
    icon: DocumentIcon,
    extension: '.pdf',
    mimeType: 'application/pdf',
    options: [
      {
        id: 'orientation',
        label: 'Orientation',
        type: 'select',
        options: [
          { value: 'portrait', label: 'Portrait' },
          { value: 'landscape', label: 'Landscape' },
        ],
        defaultValue: 'portrait',
      },
    ],
  },
];
```

---

## 10. TableSkeleton Component

### 10.1 Interface
```typescript
interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  
  // Column widths
  columnWidths?: string[];
  
  // Features
  showCheckbox?: boolean;
  showActions?: boolean;
  
  // Animation
  animation?: 'pulse' | 'wave' | 'none';
  speed?: 'slow' | 'normal' | 'fast';
  
  // Styling
  className?: string;
}
```

### 10.2 Implementation
```typescript
export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  columns = 5,
  rows = 10,
  columnWidths,
  showCheckbox = false,
  showActions = false,
  animation = 'pulse',
  speed = 'normal',
  className,
}) => {
  const actualColumns = columns + (showCheckbox ? 1 : 0) + (showActions ? 1 : 0);
  
  const animationClass = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  }[animation];
  
  const speedClass = {
    slow: 'animation-duration-slow',
    normal: '',
    fast: 'animation-duration-fast',
  }[speed];
  
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className={className}>
          {showCheckbox && (
            <td className="px-6 py-4">
              <div
                className={clsx(
                  'h-4 w-4 bg-gray-200 rounded',
                  animationClass,
                  speedClass
                )}
              />
            </td>
          )}
          
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-6 py-4">
              <div className="space-y-2">
                {colIndex === 0 ? (
                  // First column - simulate user info
                  <div className="flex items-center gap-3">
                    <div
                      className={clsx(
                        'h-8 w-8 bg-gray-200 rounded-full',
                        animationClass,
                        speedClass
                      )}
                    />
                    <div className="space-y-1">
                      <div
                        className={clsx(
                          'h-4 bg-gray-200 rounded',
                          animationClass,
                          speedClass
                        )}
                        style={{ width: columnWidths?.[colIndex] || '120px' }}
                      />
                      <div
                        className={clsx(
                          'h-3 bg-gray-200 rounded',
                          animationClass,
                          speedClass
                        )}
                        style={{ width: columnWidths?.[colIndex] || '180px' }}
                      />
                    </div>
                  </div>
                ) : (
                  // Other columns
                  <div
                    className={clsx(
                      'h-4 bg-gray-200 rounded',
                      animationClass,
                      speedClass
                    )}
                    style={{
                      width: columnWidths?.[colIndex] || `${60 + Math.random() * 60}px`
                    }}
                  />
                )}
              </div>
            </td>
          ))}
          
          {showActions && (
            <td className="px-6 py-4">
              <div
                className={clsx(
                  'h-8 w-8 bg-gray-200 rounded',
                  animationClass,
                  speedClass
                )}
              />
            </td>
          )}
        </tr>
      ))}
    </>
  );
};

// Shimmer animation
const shimmerKeyframes = `
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }
`;

const shimmerStyles = `
  .animate-shimmer {
    background: linear-gradient(
      90deg,
      #f0f0f0 25%,
      #e0e0e0 50%,
      #f0f0f0 75%
    );
    background-size: 1000px 100%;
    animation: shimmer 2s infinite;
  }
  
  .animation-duration-slow {
    animation-duration: 3s;
  }
  
  .animation-duration-fast {
    animation-duration: 1s;
  }
`;
```

---

## Complete Table Usage Example

```typescript
const UsersTablePage = () => {
  const {
    users,
    loading,
    error,
    filters,
    activeFilters,
    sorting,
    pagination,
    selectedRows,
    handleFilterChange,
    handleSort,
    handlePageChange,
    handleSelectionChange,
    handleExport,
    handleBulkAction,
    refreshData,
  } = useUsersTable();
  
  const columns = useMemo(() => userTableColumns, []);
  
  const rowActions: RowAction[] = [
    {
      id: 'view',
      label: 'View Details',
      icon: EyeIcon,
      onClick: (user) => router.push(`/users/${user.id}`),
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: PencilIcon,
      onClick: (user) => openEditModal(user),
      show: (user) => hasPermission('users.edit'),
    },
    {
      id: 'reset-password',
      label: 'Reset Password',
      icon: KeyIcon,
      onClick: (user) => handleResetPassword(user),
      show: (user) => user.status === 'active',
    },
    {
      id: 'deactivate',
      label: 'Deactivate',
      icon: BanIcon,
      onClick: (user) => handleDeactivate(user),
      show: (user) => user.status === 'active',
      variant: 'danger',
      confirmable: true,
    },
  ];
  
  const bulkActions: BulkAction[] = [
    {
      id: 'export',
      label: 'Export Selected',
      icon: DownloadIcon,
      onClick: (ids) => handleExport('csv', { selectedOnly: true }),
    },
    {
      id: 'update-role',
      label: 'Update Role',
      icon: UsersIcon,
      onClick: (ids) => openBulkRoleModal(ids),
      show: () => hasPermission('users.update-role'),
    },
    {
      id: 'deactivate',
      label: 'Deactivate',
      icon: BanIcon,
      onClick: (ids) => handleBulkDeactivate(ids),
      variant: 'danger',
      confirmable: true,
      confirmMessage: (count) => `Are you sure you want to deactivate ${count} users?`,
    },
  ];
  
  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        description="Manage user accounts and permissions"
        actions={
          <Button
            variant="primary"
            icon={PlusIcon}
            onClick={() => router.push('/users/new')}
          >
            Add User
          </Button>
        }
      />
      
      <UserTable
        users={users}
        loading={loading}
        error={error}
        columns={columns}
        
        // Selection
        selectionMode="multiple"
        selectedRows={selectedRows}
        onSelectionChange={handleSelectionChange}
        
        // Sorting
        sortable
        sortBy={sorting.column}
        sortOrder={sorting.order}
        onSort={handleSort}
        
        // Pagination
        paginated
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalItems={pagination.total}
        onPageChange={handlePageChange}
        onPageSizeChange={(size) => handlePageChange(1, size)}
        
        // Filtering
        showFilters
        filters={filters}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        
        // Actions
        rowActions={rowActions}
        bulkActions={bulkActions}
        
        // Display
        striped
        hoverable
        stickyHeader
        
        // Export
        exportable
        onExport={handleExport}
        
        // Other
        onRefresh={refreshData}
        emptyMessage="No users found. Create your first user to get started."
        className="shadow-sm"
      />
    </div>
  );
};
```

## Performance Considerations

1. **Virtual Scrolling**: For large datasets (1000+ rows)
2. **Memoization**: All components use React.memo
3. **Lazy Loading**: Column data loaded on demand
4. **Debouncing**: Search and filter inputs debounced
5. **Pagination**: Server-side pagination for large datasets
6. **Column Virtualization**: For tables with many columns
7. **Optimistic Updates**: Immediate UI updates before server confirmation

## Accessibility

1. **Keyboard Navigation**: Full table navigation with arrow keys
2. **Screen Reader Support**: Proper ARIA labels and live regions
3. **Focus Management**: Logical focus flow through table
4. **High Contrast Mode**: Supported with proper borders
5. **Mobile Support**: Responsive design with horizontal scroll