import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { InboxIcon } from 'lucide-react';
import styles from './TableEmpty.module.css';

export interface TableEmptyProps {
  columns: number;
  message?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}

export const TableEmpty = memo(({
  columns,
  message = 'No data found',
  icon: Icon = InboxIcon,
  action,
  className,
}: TableEmptyProps) => {
  return (
    <tr>
      <td colSpan={columns} className={cn(styles.container, className)}>
        <div className={styles.content}>
          <Icon className={styles.icon} />
          <p className={styles.message}>{message}</p>
          {action && (
            <div className={styles.action}>
              {action}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
});

TableEmpty.displayName = 'TableEmpty';