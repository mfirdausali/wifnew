import React, { memo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../atoms/Button';
import { MoreHorizontalIcon } from 'lucide-react';
import type { RowAction, BulkAction } from './DataTable.types';
import styles from './TableActions.module.css';

export interface TableActionsProps<T = any> {
  actions: RowAction<T>[] | BulkAction<T>[];
  row?: T;
  selectedIds?: string[];
  selectedRows?: T[];
  variant?: 'row' | 'bulk';
  position?: 'top' | 'bottom' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TableActions = memo(<T extends Record<string, any>>({
  actions,
  row,
  selectedIds = [],
  selectedRows = [],
  variant = 'row',
  position = 'top',
  size = 'sm',
  className,
}: TableActionsProps<T>) => {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAction = useCallback(async (action: RowAction<T> | BulkAction<T>) => {
    const isRowAction = variant === 'row' && 'onClick' in action && row;
    const isBulkAction = variant === 'bulk' && 'onClick' in action;

    if (!isRowAction && !isBulkAction) return;

    // Check if action should be shown
    if ('show' in action) {
      const shouldShow = isRowAction
        ? (action as RowAction<T>).show?.(row!)
        : (action as BulkAction<T>).show?.(selectedIds, selectedRows);
      if (shouldShow === false) return;
    }

    // Check if action is disabled
    if ('disabled' in action) {
      const isDisabled = isRowAction
        ? (action as RowAction<T>).disabled?.(row!)
        : (action as BulkAction<T>).disabled?.(selectedIds, selectedRows);
      if (isDisabled) return;
    }

    // Confirmation
    if (action.confirmable) {
      const confirmMessage = typeof action.confirmMessage === 'function'
        ? isRowAction
          ? (action.confirmMessage as (row: T) => string)(row!)
          : (action.confirmMessage as (count: number) => string)(selectedIds.length)
        : action.confirmMessage || 'Are you sure?';

      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    setLoadingAction(action.id);
    setOpenDropdown(false);

    try {
      if (isRowAction) {
        await (action as RowAction<T>).onClick(row!);
      } else if (isBulkAction) {
        await (action as BulkAction<T>).onClick(selectedIds, selectedRows);
      }
    } catch (error) {
      console.error(`Failed to execute action ${action.id}:`, error);
    } finally {
      setLoadingAction(null);
    }
  }, [variant, row, selectedIds, selectedRows]);

  const visibleActions = actions.filter(action => {
    if (!('show' in action)) return true;
    
    if (variant === 'row' && row) {
      return (action as RowAction<T>).show?.(row) !== false;
    } else if (variant === 'bulk') {
      return (action as BulkAction<T>).show?.(selectedIds, selectedRows) !== false;
    }
    
    return true;
  });

  if (visibleActions.length === 0) return null;

  const containerClasses = cn(
    styles.container,
    styles[`variant-${variant}`],
    styles[`position-${position}`],
    className
  );

  // Row actions - dropdown menu
  if (variant === 'row') {
    return (
      <div className={containerClasses}>
        <Button
          variant="ghost"
          size={size}
          icon={MoreHorizontalIcon}
          iconOnly
          onClick={() => setOpenDropdown(!openDropdown)}
          ariaLabel="Row actions"
          className={styles.trigger}
        />
        
        {openDropdown && (
          <>
            <div
              className={styles.backdrop}
              onClick={() => setOpenDropdown(false)}
            />
            <div className={styles.dropdown}>
              {visibleActions.map((action) => {
                const rowAction = action as RowAction<T>;
                const isDisabled = row && rowAction.disabled?.(row);
                const isLoading = loadingAction === action.id || (row && rowAction.loading?.(row));

                return (
                  <button
                    key={action.id}
                    className={cn(
                      styles.dropdownItem,
                      styles[`variant-${action.variant || 'default'}`],
                      {
                        [styles.disabled]: isDisabled,
                        [styles.loading]: isLoading,
                      }
                    )}
                    onClick={() => handleAction(action)}
                    disabled={isDisabled || isLoading}
                  >
                    {action.icon && (
                      <action.icon className={styles.icon} />
                    )}
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // Bulk actions - button bar
  return (
    <div className={containerClasses}>
      <div className={styles.bulkInfo}>
        <span className={styles.selectedCount}>
          {selectedIds.length} selected
        </span>
      </div>
      
      <div className={styles.bulkActions}>
        {visibleActions.map((action) => {
          const bulkAction = action as BulkAction<T>;
          const isDisabled = bulkAction.disabled?.(selectedIds, selectedRows);
          const isLoading = loadingAction === action.id || bulkAction.loading;

          return (
            <Button
              key={action.id}
              variant={action.variant || 'secondary'}
              size={size}
              icon={action.icon}
              onClick={() => handleAction(action)}
              disabled={isDisabled || selectedIds.length === 0}
              loading={isLoading}
            >
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}) as <T extends Record<string, any>>(props: TableActionsProps<T>) => JSX.Element;

TableActions.displayName = 'TableActions';