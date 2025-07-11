import { ReactNode, MouseEvent, CSSProperties } from 'react';

// Core table types
export interface TableColumn<T = any> {
  id: string;
  header: string | ReactNode | ((props: HeaderProps) => ReactNode);
  accessor?: string | ((row: T) => any);
  
  // Display
  cell?: (props: CellProps<T>) => ReactNode;
  footer?: (props: FooterProps) => ReactNode;
  
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
  cellClassName?: string | ((row: T) => string);
  
  // Metadata
  dataType?: 'string' | 'number' | 'date' | 'boolean' | 'custom';
  format?: (value: any) => string;
  exportFormat?: (value: any) => string;
}

export interface DataTableProps<T = any> {
  // Data
  data: T[];
  loading?: boolean;
  error?: string | null;
  
  // Columns
  columns: TableColumn<T>[];
  visibleColumns?: string[];
  onColumnVisibilityChange?: (columns: string[]) => void;
  
  // Selection
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  isRowSelectable?: (row: T) => boolean;
  getRowId?: (row: T) => string;
  
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
  rowActions?: RowAction<T>[];
  bulkActions?: BulkAction<T>[];
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
  containerHeight?: string | number;
  
  // Customization
  emptyMessage?: string;
  emptyIcon?: React.ComponentType<{ className?: string }>;
  loadingRows?: number;
  className?: string;
  containerClassName?: string;
  
  // Callbacks
  onRowClick?: (row: T, event: MouseEvent) => void;
  onRowDoubleClick?: (row: T, event: MouseEvent) => void;
  onRowContextMenu?: (row: T, event: MouseEvent) => void;
  onRefresh?: () => void;
  
  // Advanced
  rowClassName?: (row: T) => string;
  cellClassName?: (row: T, column: TableColumn<T>) => string;
  expandableRows?: boolean;
  renderExpandedRow?: (row: T) => ReactNode;
  
  // Export
  exportable?: boolean;
  onExport?: (format: ExportFormat, options: ExportOptions) => void;
}

export interface SortConfig {
  column: string;
  order: 'asc' | 'desc';
  priority?: number;
}

export interface TableFilter {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'boolean';
  options?: FilterOption[];
  placeholder?: string;
  defaultValue?: any;
  column?: string;
  operator?: FilterOperator;
}

export interface FilterOption {
  value: any;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'notIn';

export interface RowAction<T = any> {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (row: T) => void | Promise<void>;
  show?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  loading?: (row: T) => boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  confirmable?: boolean;
  confirmMessage?: string | ((row: T) => string);
}

export interface BulkAction<T = any> {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (selectedIds: string[], rows: T[]) => void | Promise<void>;
  show?: (selectedIds: string[], rows: T[]) => boolean;
  disabled?: (selectedIds: string[], rows: T[]) => boolean;
  loading?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  confirmable?: boolean;
  confirmMessage?: string | ((count: number) => string);
  position?: 'top' | 'bottom' | 'both';
}

export interface HeaderProps {
  column: TableColumn;
  table: any;
}

export interface CellProps<T = any> {
  row: T;
  value: any;
  column: TableColumn<T>;
  rowIndex: number;
}

export interface FooterProps {
  column: TableColumn;
  table: any;
}

export interface ExportFormat {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  extension: string;
  mimeType: string;
  options?: FormatOption[];
}

export interface FormatOption {
  id: string;
  label: string;
  type: 'text' | 'select' | 'boolean' | 'number';
  options?: { value: any; label: string }[];
  defaultValue?: any;
}

export interface ExportOptions {
  format: string;
  columns?: string[];
  includeHeaders?: boolean;
  filteredOnly?: boolean;
  selectedOnly?: boolean;
  formatOptions?: Record<string, any>;
}

// Row state
export interface RowState<T = any> {
  id: string;
  data: T;
  selected: boolean;
  expanded: boolean;
  index: number;
}

// Table state
export interface TableState<T = any> {
  sorting: SortConfig[];
  columnFilters: Record<string, any>;
  columnVisibility: Record<string, boolean>;
  rowSelection: Record<string, boolean>;
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  globalFilter: string;
  expandedRows: Record<string, boolean>;
}

// Virtual item for virtual scrolling
export interface VirtualItem {
  index: number;
  start: number;
  size: number;
  end: number;
  key: string | number;
}