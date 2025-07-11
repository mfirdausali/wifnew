import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUpIcon, ChevronDownIcon, ChevronsUpDownIcon } from 'lucide-react';
import type { TableColumn } from './DataTable.types';
import styles from './TableHeader.module.css';

export interface TableHeaderProps<T = any> {
  columns: TableColumn<T>[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnId: string) => void;
  stickyHeader?: boolean;
  resizable?: boolean;
  onColumnResize?: (columnId: string, width: number) => void;
  sortIndicatorPosition?: 'left' | 'right';
  className?: string;
}

export const TableHeader = memo(<T extends Record<string, any>>({
  columns,
  sortBy,
  sortOrder = 'asc',
  onSort,
  stickyHeader = false,
  resizable = false,
  onColumnResize,
  sortIndicatorPosition = 'right',
  className,
}: TableHeaderProps<T>) => {
  const headerClasses = cn(
    styles.header,
    {
      [styles.sticky]: stickyHeader,
    },
    className
  );

  return (
    <thead className={headerClasses}>
      <tr className={styles.row}>
        {columns.map((column) => (
          <TableHeaderCell
            key={column.id}
            column={column}
            isSorted={sortBy === column.id}
            sortOrder={sortOrder}
            onSort={onSort}
            resizable={resizable && column.resizable !== false && !column.locked}
            onResize={onColumnResize}
            sortIndicatorPosition={sortIndicatorPosition}
          />
        ))}
      </tr>
    </thead>
  );
}) as <T extends Record<string, any>>(props: TableHeaderProps<T>) => JSX.Element;

TableHeader.displayName = 'TableHeader';

// Individual header cell component
interface TableHeaderCellProps<T = any> {
  column: TableColumn<T>;
  isSorted: boolean;
  sortOrder: 'asc' | 'desc';
  onSort?: (columnId: string) => void;
  resizable?: boolean;
  onResize?: (columnId: string, width: number) => void;
  sortIndicatorPosition: 'left' | 'right';
}

const TableHeaderCell = memo(<T extends Record<string, any>>({
  column,
  isSorted,
  sortOrder,
  onSort,
  resizable,
  onResize,
  sortIndicatorPosition,
}: TableHeaderCellProps<T>) => {
  const [isResizing, setIsResizing] = useState(false);
  const cellRef = useRef<HTMLTableCellElement>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);

  const canSort = column.sortable !== false && onSort;

  const handleClick = useCallback(() => {
    if (canSort) {
      onSort(column.id);
    }
  }, [canSort, onSort, column.id]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!resizable || !onResize) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    startX.current = e.pageX;
    startWidth.current = cellRef.current?.offsetWidth || 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!cellRef.current) return;
      
      const diff = e.pageX - startX.current;
      const newWidth = Math.max(50, startWidth.current + diff); // Min width 50px
      cellRef.current.style.width = `${newWidth}px`;
    };

    const handleMouseUp = (e: MouseEvent) => {
      setIsResizing(false);
      
      if (onResize && cellRef.current) {
        const finalWidth = cellRef.current.offsetWidth;
        onResize(column.id, finalWidth);
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [resizable, onResize, column.id]);

  const cellClasses = cn(
    styles.cell,
    {
      [styles.sortable]: canSort,
      [styles.sorted]: isSorted,
      [styles.resizing]: isResizing,
      [styles[`align-${column.align}`]]: column.align,
    },
    column.headerClassName
  );

  const headerContent = typeof column.header === 'function' 
    ? column.header({ column, table: {} })
    : column.header;

  const sortIndicator = canSort && (
    <span className={cn(styles.sortIndicator, { [styles.active]: isSorted })}>
      {isSorted ? (
        sortOrder === 'asc' ? (
          <ChevronUpIcon className={styles.sortIcon} />
        ) : (
          <ChevronDownIcon className={styles.sortIcon} />
        )
      ) : (
        <ChevronsUpDownIcon className={styles.sortIcon} />
      )}
    </span>
  );

  return (
    <th
      ref={cellRef}
      className={cellClasses}
      onClick={handleClick}
      style={{
        width: column.width,
        minWidth: column.minWidth,
        maxWidth: column.maxWidth,
      }}
      data-column-id={column.id}
    >
      <div className={styles.content}>
        {sortIndicatorPosition === 'left' && sortIndicator}
        <span className={styles.text}>{headerContent}</span>
        {sortIndicatorPosition === 'right' && sortIndicator}
      </div>
      
      {resizable && (
        <div
          className={styles.resizer}
          onMouseDown={handleMouseDown}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </th>
  );
}) as <T extends Record<string, any>>(props: TableHeaderCellProps<T>) => JSX.Element;

TableHeaderCell.displayName = 'TableHeaderCell';