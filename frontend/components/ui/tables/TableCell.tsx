import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { TableColumn, CellProps } from './DataTable.types';
import styles from './TableCell.module.css';

export interface TableCellProps<T = any> {
  column: TableColumn<T>;
  row: T;
  rowIndex: number;
  selected?: boolean;
  editable?: boolean;
  onEdit?: (columnId: string, value: any) => void;
  className?: string;
}

export const TableCell = memo(<T extends Record<string, any>>({
  column,
  row,
  rowIndex,
  selected = false,
  editable = false,
  onEdit,
  className,
}: TableCellProps<T>) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get cell value
  const getCellValue = useCallback(() => {
    if (column.accessor) {
      return typeof column.accessor === 'string' 
        ? row[column.accessor] 
        : column.accessor(row);
    }
    return row[column.id];
  }, [column, row]);

  const value = getCellValue();

  // Handle edit mode
  const canEdit = editable && !column.locked && onEdit;

  const handleDoubleClick = useCallback(() => {
    if (canEdit) {
      setIsEditing(true);
      setEditValue(value);
    }
  }, [canEdit, value]);

  const handleSave = useCallback(() => {
    if (onEdit && editValue !== value) {
      onEdit(column.id, editValue);
    }
    setIsEditing(false);
  }, [column.id, editValue, value, onEdit]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Render cell content
  const renderContent = () => {
    if (isEditing) {
      return (
        <input
          ref={inputRef}
          type={column.dataType === 'number' ? 'number' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={styles.editInput}
          onClick={(e) => e.stopPropagation()}
        />
      );
    }

    if (column.cell) {
      const cellProps: CellProps<T> = {
        row,
        value,
        column,
        rowIndex,
      };
      return column.cell(cellProps);
    }

    if (column.format) {
      return column.format(value);
    }

    // Default formatting based on dataType
    if (value == null) return '';
    
    switch (column.dataType) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      default:
        return String(value);
    }
  };

  const cellClasses = cn(
    styles.cell,
    {
      [styles.selected]: selected,
      [styles.editable]: canEdit,
      [styles.editing]: isEditing,
      [styles[`align-${column.align}`]]: column.align,
    },
    column.cellClassName,
    className
  );

  return (
    <td
      className={cellClasses}
      onDoubleClick={handleDoubleClick}
      style={{
        width: column.width,
        minWidth: column.minWidth,
        maxWidth: column.maxWidth,
      }}
      data-column-id={column.id}
    >
      <div className={styles.content}>
        {renderContent()}
      </div>
    </td>
  );
}) as <T extends Record<string, any>>(props: TableCellProps<T>) => JSX.Element;

TableCell.displayName = 'TableCell';