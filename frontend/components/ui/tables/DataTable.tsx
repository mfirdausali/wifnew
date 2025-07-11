import React, { useMemo, useState, useRef, useCallback, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { TablePagination } from './TablePagination';
import { TableFilters } from './TableFilters';
import { TableActions } from './TableActions';
import { TableEmpty } from './TableEmpty';
import { TableLoading } from './TableLoading';
import { Checkbox } from '../atoms/Checkbox';
import type { DataTableProps, RowState, TableState } from './DataTable.types';
import styles from './DataTable.module.css';

export const DataTable = memo(<T extends Record<string, any>>({
  // Data
  data = [],
  loading = false,
  error = null,
  
  // Columns
  columns = [],
  visibleColumns,
  onColumnVisibilityChange,
  
  // Selection
  selectionMode = 'none',
  selectedRows = [],
  onSelectionChange,
  isRowSelectable,
  getRowId = (row: T) => row.id || row._id || JSON.stringify(row),
  
  // Sorting
  sortable = false,
  sortBy,
  sortOrder = 'asc',
  onSort,
  multiSort = false,
  sortConfigs = [],
  
  // Pagination
  paginated = false,
  page = 1,
  pageSize = 10,
  totalItems,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  
  // Filtering
  showFilters = false,
  filters = [],
  activeFilters = {},
  onFilterChange,
  quickFilter = false,
  
  // Actions
  rowActions = [],
  bulkActions = [],
  showActionsColumn = true,
  actionsColumnWidth = '80px',
  
  // Display options
  striped = false,
  bordered = false,
  hoverable = true,
  compact = false,
  responsive = true,
  stickyHeader = false,
  stickyFirstColumn = false,
  
  // Virtual scrolling
  virtual = false,
  rowHeight = 48,
  overscan = 5,
  containerHeight = 600,
  
  // Customization
  emptyMessage = 'No data found',
  emptyIcon,
  loadingRows = 10,
  className,
  containerClassName,
  
  // Callbacks
  onRowClick,
  onRowDoubleClick,
  onRowContextMenu,
  onRefresh,
  
  // Advanced
  rowClassName,
  cellClassName,
  expandableRows = false,
  renderExpandedRow,
  
  // Export
  exportable = false,
  onExport,
}: DataTableProps<T>) => {
  // State
  const [internalSelection, setInternalSelection] = useState<Record<string, boolean>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [columnOrder, setColumnOrder] = useState<string[]>(columns.map(col => col.id));
  const [columnSizes, setColumnSizes] = useState<Record<string, number>>({});

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // Computed values
  const visibleColumnIds = useMemo(() => {
    if (visibleColumns) return visibleColumns;
    return columns.filter(col => !col.hidden).map(col => col.id);
  }, [columns, visibleColumns]);

  const visibleColumnsData = useMemo(() => {
    return columns.filter(col => visibleColumnIds.includes(col.id));
  }, [columns, visibleColumnIds]);

  // Add checkbox column if selection is enabled
  const tableColumns = useMemo(() => {
    const cols = [...visibleColumnsData];
    
    if (selectionMode !== 'none') {
      cols.unshift({
        id: 'select',
        header: selectionMode === 'multiple' ? ({ table }: any) => (
          <Checkbox
            checked={isAllRowsSelected()}
            indeterminate={isSomeRowsSelected()}
            onChange={(checked) => handleSelectAll(checked)}
            aria-label="Select all rows"
          />
        ) : '',
        cell: ({ row }: any) => (
          <Checkbox
            checked={isRowSelected(row)}
            disabled={!canSelectRow(row)}
            onChange={(checked) => handleSelectRow(row, checked)}
            aria-label={`Select row ${getRowId(row)}`}
          />
        ),
        width: '40px',
        locked: true,
        sortable: false,
        filterable: false,
      });
    }

    if (showActionsColumn && rowActions.length > 0) {
      cols.push({
        id: 'actions',
        header: '',
        cell: ({ row }: any) => (
          <TableActions
            actions={rowActions}
            row={row}
            size="sm"
          />
        ),
        width: actionsColumnWidth,
        locked: true,
        sortable: false,
        filterable: false,
        align: 'center',
      });
    }

    return cols;
  }, [visibleColumnsData, selectionMode, showActionsColumn, rowActions]);

  // Selection handlers
  const selection = selectedRows.length > 0 ? 
    selectedRows.reduce((acc, id) => ({ ...acc, [id]: true }), {}) : 
    internalSelection;

  const isRowSelected = useCallback((row: T) => {
    const rowId = getRowId(row);
    return !!selection[rowId];
  }, [selection, getRowId]);

  const canSelectRow = useCallback((row: T) => {
    return isRowSelectable ? isRowSelectable(row) : true;
  }, [isRowSelectable]);

  const isAllRowsSelected = useCallback(() => {
    const selectableRows = data.filter(row => canSelectRow(row));
    return selectableRows.length > 0 && selectableRows.every(row => isRowSelected(row));
  }, [data, canSelectRow, isRowSelected]);

  const isSomeRowsSelected = useCallback(() => {
    const selectableRows = data.filter(row => canSelectRow(row));
    const selectedCount = selectableRows.filter(row => isRowSelected(row)).length;
    return selectedCount > 0 && selectedCount < selectableRows.length;
  }, [data, canSelectRow, isRowSelected]);

  const handleSelectRow = useCallback((row: T, checked: boolean) => {
    const rowId = getRowId(row);
    const newSelection = { ...selection };
    
    if (selectionMode === 'single') {
      // Clear all selections for single mode
      Object.keys(newSelection).forEach(key => delete newSelection[key]);
    }
    
    if (checked) {
      newSelection[rowId] = true;
    } else {
      delete newSelection[rowId];
    }

    const selectedIds = Object.keys(newSelection);
    
    if (onSelectionChange) {
      onSelectionChange(selectedIds);
    } else {
      setInternalSelection(newSelection);
    }
  }, [selection, selectionMode, getRowId, onSelectionChange]);

  const handleSelectAll = useCallback((checked: boolean) => {
    const newSelection: Record<string, boolean> = {};
    
    if (checked) {
      data.forEach(row => {
        if (canSelectRow(row)) {
          newSelection[getRowId(row)] = true;
        }
      });
    }

    const selectedIds = Object.keys(newSelection);
    
    if (onSelectionChange) {
      onSelectionChange(selectedIds);
    } else {
      setInternalSelection(newSelection);
    }
  }, [data, canSelectRow, getRowId, onSelectionChange]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortable || !sortBy) return data;

    const sorted = [...data];
    sorted.sort((a, b) => {
      const column = columns.find(col => col.id === sortBy);
      if (!column) return 0;

      let aVal = column.accessor ? 
        (typeof column.accessor === 'string' ? a[column.accessor] : column.accessor(a)) : 
        a[column.id];
      let bVal = column.accessor ? 
        (typeof column.accessor === 'string' ? b[column.accessor] : column.accessor(b)) : 
        b[column.id];

      // Handle null/undefined
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Convert to comparable values based on dataType
      if (column.dataType === 'number') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      } else if (column.dataType === 'date') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [data, sortable, sortBy, sortOrder, columns]);

  // Filtering
  const filteredData = useMemo(() => {
    if (!showFilters || Object.keys(activeFilters).length === 0) return sortedData;

    return sortedData.filter(row => {
      return Object.entries(activeFilters).every(([filterId, filterValue]) => {
        if (filterValue == null || filterValue === '') return true;

        const filter = filters.find(f => f.id === filterId);
        if (!filter) return true;

        const column = columns.find(col => col.id === (filter.column || filterId));
        if (!column) return true;

        const rowValue = column.accessor ? 
          (typeof column.accessor === 'string' ? row[column.accessor] : column.accessor(row)) : 
          row[column.id];

        // Apply filter based on type and operator
        switch (filter.type) {
          case 'text':
            return String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'select':
            return rowValue === filterValue;
          case 'multiselect':
            return Array.isArray(filterValue) && filterValue.includes(rowValue);
          case 'number':
            return Number(rowValue) === Number(filterValue);
          case 'boolean':
            return Boolean(rowValue) === Boolean(filterValue);
          default:
            return true;
        }
      });
    });
  }, [sortedData, showFilters, activeFilters, filters, columns]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!paginated) return filteredData;

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, paginated, page, pageSize]);

  const displayData = paginatedData;

  // Virtual scrolling
  const rowVirtualizer = useVirtualizer({
    count: displayData.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => rowHeight,
    overscan,
    enabled: virtual,
  });

  const virtualRows = virtual ? rowVirtualizer.getVirtualItems() : [];
  const totalSize = virtual ? rowVirtualizer.getTotalSize() : undefined;

  // Handlers
  const handleSort = useCallback((columnId: string) => {
    if (!sortable) return;

    const column = columns.find(col => col.id === columnId);
    if (!column || !column.sortable) return;

    const newOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';
    
    if (onSort) {
      onSort(columnId, newOrder);
    }
  }, [sortable, columns, sortBy, sortOrder, onSort]);

  const handleColumnResize = useCallback((columnId: string, width: number) => {
    setColumnSizes(prev => ({ ...prev, [columnId]: width }));
  }, []);

  const handleRowExpand = useCallback((rowId: string) => {
    setExpandedRows(prev => ({ ...prev, [rowId]: !prev[rowId] }));
  }, []);

  // Container classes
  const containerClasses = cn(
    styles.container,
    {
      [styles.responsive]: responsive,
      [styles.bordered]: bordered,
    },
    containerClassName
  );

  const tableClasses = cn(
    styles.table,
    {
      [styles.striped]: striped,
      [styles.hoverable]: hoverable,
      [styles.compact]: compact,
      [styles.stickyHeader]: stickyHeader,
      [styles.stickyFirstColumn]: stickyFirstColumn,
    },
    className
  );

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        {onRefresh && (
          <button onClick={onRefresh} className={styles.retryButton}>
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* Filters */}
      {showFilters && (
        <TableFilters
          filters={filters}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
          showSearch={quickFilter}
          className={styles.filters}
        />
      )}

      {/* Bulk Actions */}
      {bulkActions.length > 0 && Object.keys(selection).length > 0 && (
        <TableActions
          actions={bulkActions}
          selectedIds={Object.keys(selection)}
          selectedRows={data.filter(row => selection[getRowId(row)])}
          variant="bulk"
          position="top"
        />
      )}

      {/* Table Container */}
      <div
        ref={tableContainerRef}
        className={styles.tableContainer}
        style={virtual ? { height: containerHeight, overflow: 'auto' } : undefined}
      >
        <table ref={tableRef} className={tableClasses}>
          <TableHeader
            columns={tableColumns}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            stickyHeader={stickyHeader}
            onColumnResize={handleColumnResize}
          />
          
          <tbody className={styles.tbody}>
            {loading ? (
              <TableLoading
                columns={tableColumns.length}
                rows={loadingRows}
              />
            ) : displayData.length === 0 ? (
              <TableEmpty
                columns={tableColumns.length}
                message={emptyMessage}
                icon={emptyIcon}
              />
            ) : virtual ? (
              // Virtual rows
              <>
                {totalSize && (
                  <tr style={{ height: `${virtualRows[0]?.start ?? 0}px` }} />
                )}
                {virtualRows.map(virtualRow => {
                  const row = displayData[virtualRow.index];
                  const rowId = getRowId(row);
                  return (
                    <TableRow
                      key={rowId}
                      row={row}
                      rowId={rowId}
                      columns={tableColumns}
                      selected={isRowSelected(row)}
                      expanded={expandedRows[rowId]}
                      virtualRow={virtualRow}
                      onRowClick={onRowClick}
                      onRowDoubleClick={onRowDoubleClick}
                      onRowContextMenu={onRowContextMenu}
                      onExpand={expandableRows ? () => handleRowExpand(rowId) : undefined}
                      renderExpandedContent={renderExpandedRow}
                      rowClassName={rowClassName}
                      cellClassName={cellClassName}
                      striped={striped}
                      hoverable={hoverable}
                    />
                  );
                })}
                {totalSize && (
                  <tr style={{ height: `${totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0)}px` }} />
                )}
              </>
            ) : (
              // Regular rows
              displayData.map((row, index) => {
                const rowId = getRowId(row);
                return (
                  <TableRow
                    key={rowId}
                    row={row}
                    rowId={rowId}
                    rowIndex={index}
                    columns={tableColumns}
                    selected={isRowSelected(row)}
                    expanded={expandedRows[rowId]}
                    onRowClick={onRowClick}
                    onRowDoubleClick={onRowDoubleClick}
                    onRowContextMenu={onRowContextMenu}
                    onExpand={expandableRows ? () => handleRowExpand(rowId) : undefined}
                    renderExpandedContent={renderExpandedRow}
                    rowClassName={rowClassName}
                    cellClassName={cellClassName}
                    striped={striped}
                    hoverable={hoverable}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && !loading && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems || filteredData.length}
          pageSizeOptions={pageSizeOptions}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          className={styles.pagination}
        />
      )}
    </div>
  );
}) as <T extends Record<string, any>>(props: DataTableProps<T>) => JSX.Element;

DataTable.displayName = 'DataTable';