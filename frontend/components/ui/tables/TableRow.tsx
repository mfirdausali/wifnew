import React, { memo, useCallback, MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { TableCell } from './TableCell';
import type { TableColumn, VirtualItem } from './DataTable.types';
import styles from './TableRow.module.css';

export interface TableRowProps<T = any> {
  row: T;
  rowId: string;
  rowIndex?: number;
  columns: TableColumn<T>[];
  selected?: boolean;
  expanded?: boolean;
  virtualRow?: VirtualItem;
  onRowClick?: (row: T, event: MouseEvent) => void;
  onRowDoubleClick?: (row: T, event: MouseEvent) => void;
  onRowContextMenu?: (row: T, event: MouseEvent) => void;
  onExpand?: () => void;
  renderExpandedContent?: (row: T) => React.ReactNode;
  rowClassName?: (row: T) => string;
  cellClassName?: (row: T, column: TableColumn<T>) => string;
  striped?: boolean;
  hoverable?: boolean;
}

export const TableRow = memo(<T extends Record<string, any>>({
  row,
  rowId,
  rowIndex = 0,
  columns,
  selected = false,
  expanded = false,
  virtualRow,
  onRowClick,
  onRowDoubleClick,
  onRowContextMenu,
  onExpand,
  renderExpandedContent,
  rowClassName,
  cellClassName,
  striped = false,
  hoverable = true,
}: TableRowProps<T>) => {
  const handleClick = useCallback((e: MouseEvent<HTMLTableRowElement>) => {
    // Don't trigger row click if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, [role="button"], [role="checkbox"]')) {
      return;
    }
    
    onRowClick?.(row, e);
  }, [row, onRowClick]);

  const handleDoubleClick = useCallback((e: MouseEvent<HTMLTableRowElement>) => {
    onRowDoubleClick?.(row, e);
  }, [row, onRowDoubleClick]);

  const handleContextMenu = useCallback((e: MouseEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    onRowContextMenu?.(row, e);
  }, [row, onRowContextMenu]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onExpand && renderExpandedContent) {
        onExpand();
      } else if (onRowClick) {
        onRowClick(row, e as any);
      }
    }
  }, [row, onRowClick, onExpand, renderExpandedContent]);

  const rowClasses = cn(
    styles.row,
    {
      [styles.selected]: selected,
      [styles.expanded]: expanded,
      [styles.striped]: striped && rowIndex % 2 === 1,
      [styles.hoverable]: hoverable,
      [styles.clickable]: !!onRowClick,
      [styles.expandable]: !!onExpand && !!renderExpandedContent,
    },
    rowClassName?.(row)
  );

  const rowStyle = virtualRow ? {
    height: `${virtualRow.size}px`,
    transform: `translateY(${virtualRow.start}px)`,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
  } : undefined;

  return (
    <>
      <tr
        className={rowClasses}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        style={rowStyle}
        tabIndex={onRowClick || onExpand ? 0 : undefined}
        role={onRowClick || onExpand ? 'button' : undefined}
        aria-selected={selected}
        aria-expanded={expanded}
        data-row-id={rowId}
        data-row-index={rowIndex}
      >
        {columns.map((column) => (
          <TableCell
            key={column.id}
            column={column}
            row={row}
            rowIndex={rowIndex}
            selected={selected}
            className={cellClassName?.(row, column)}
          />
        ))}
      </tr>
      
      {expanded && renderExpandedContent && (
        <tr className={styles.expandedRow}>
          <td colSpan={columns.length} className={styles.expandedContent}>
            {renderExpandedContent(row)}
          </td>
        </tr>
      )}
    </>
  );
}) as <T extends Record<string, any>>(props: TableRowProps<T>) => JSX.Element;

TableRow.displayName = 'TableRow';