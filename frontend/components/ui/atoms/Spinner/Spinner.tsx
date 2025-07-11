import React from 'react';
import { cn } from '@/lib/utils';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
  testId?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'currentColor',
  className,
  testId
}) => {
  return (
    <svg
      className={cn(styles.spinner, styles[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      data-testid={testId}
      aria-label="Loading"
      role="status"
    >
      <circle
        className={styles.track}
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        opacity="0.25"
      />
      <circle
        className={styles.indicator}
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="4"
        strokeDasharray="60"
        strokeDashoffset="15"
      />
    </svg>
  );
};