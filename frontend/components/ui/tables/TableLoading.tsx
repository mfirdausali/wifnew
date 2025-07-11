import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import styles from './TableLoading.module.css';

export interface TableLoadingProps {
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

export const TableLoading = memo(({
  columns = 5,
  rows = 10,
  columnWidths,
  showCheckbox = false,
  showActions = false,
  animation = 'pulse',
  speed = 'normal',
  className,
}: TableLoadingProps) => {
  const actualColumns = columns + (showCheckbox ? 1 : 0) + (showActions ? 1 : 0);
  
  const animationClass = {
    pulse: styles.pulse,
    wave: styles.wave,
    none: '',
  }[animation];
  
  const speedClass = {
    slow: styles.slow,
    normal: '',
    fast: styles.fast,
  }[speed];

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className={cn(styles.row, className)}>
          {showCheckbox && (
            <td className={styles.cell}>
              <div
                className={cn(
                  styles.skeleton,
                  styles.checkbox,
                  animationClass,
                  speedClass
                )}
              />
            </td>
          )}
          
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className={styles.cell}>
              <div className={styles.cellContent}>
                {colIndex === 0 ? (
                  // First column - simulate user info
                  <div className={styles.userCell}>
                    <div
                      className={cn(
                        styles.skeleton,
                        styles.avatar,
                        animationClass,
                        speedClass
                      )}
                    />
                    <div className={styles.userInfo}>
                      <div
                        className={cn(
                          styles.skeleton,
                          styles.text,
                          animationClass,
                          speedClass
                        )}
                        style={{ width: columnWidths?.[colIndex] || '120px' }}
                      />
                      <div
                        className={cn(
                          styles.skeleton,
                          styles.subtext,
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
                    className={cn(
                      styles.skeleton,
                      styles.text,
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
            <td className={styles.cell}>
              <div
                className={cn(
                  styles.skeleton,
                  styles.action,
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
});

TableLoading.displayName = 'TableLoading';