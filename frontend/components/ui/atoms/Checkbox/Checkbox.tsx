import { forwardRef, memo, useId, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  helper?: string;
  error?: boolean | string;
  indeterminate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'danger';
  testId?: string;
}

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 12 12" fill="none">
    <path
      d="M10 3L4.5 8.5L2 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IndeterminateIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 12 12" fill="none">
    <path
      d="M3 6H9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const Checkbox = memo(forwardRef<HTMLInputElement, CheckboxProps>(
  ({
    label,
    helper,
    error,
    indeterminate = false,
    size = 'md',
    variant = 'default',
    disabled = false,
    className,
    id: providedId,
    testId,
    ...rest
  }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const hasError = error !== false && error !== undefined;
    const errorMessage = typeof error === 'string' ? error : '';
    
    return (
      <div className={cn(styles.container, className)}>
        <div className={styles.checkboxWrapper}>
          <input
            ref={ref}
            type="checkbox"
            id={id}
            className={styles.input}
            disabled={disabled}
            data-testid={testId}
            {...rest}
          />
          <div
            className={cn(
              styles.checkbox,
              styles[size],
              styles[variant],
              {
                [styles.error]: hasError,
                [styles.disabled]: disabled,
                [styles.indeterminate]: indeterminate,
              }
            )}
          >
            {indeterminate ? (
              <IndeterminateIcon className={styles.icon} />
            ) : (
              <CheckIcon className={styles.icon} />
            )}
          </div>
          {label && (
            <label htmlFor={id} className={cn(styles.label, styles[`label-${size}`])}>
              {label}
            </label>
          )}
        </div>
        {(helper || errorMessage) && (
          <p className={cn(styles.helper, { [styles.errorText]: hasError })}>
            {errorMessage || helper}
          </p>
        )}
      </div>
    );
  }
));

Checkbox.displayName = 'Checkbox';