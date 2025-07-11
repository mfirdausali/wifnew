import { forwardRef, memo, useId, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import styles from './Radio.module.css';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  helper?: string;
  error?: boolean | string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'danger';
  testId?: string;
}

export const Radio = memo(forwardRef<HTMLInputElement, RadioProps>(
  ({
    label,
    helper,
    error,
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
        <div className={styles.radioWrapper}>
          <input
            ref={ref}
            type="radio"
            id={id}
            className={styles.input}
            disabled={disabled}
            data-testid={testId}
            {...rest}
          />
          <div
            className={cn(
              styles.radio,
              styles[size],
              styles[variant],
              {
                [styles.error]: hasError,
                [styles.disabled]: disabled,
              }
            )}
          >
            <div className={styles.dot} />
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

Radio.displayName = 'Radio';

// Radio Group Component
export interface RadioGroupProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
    helper?: string;
    disabled?: boolean;
  }>;
  label?: string;
  helper?: string;
  error?: boolean | string;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'danger';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  testId?: string;
}

export const RadioGroup = memo<RadioGroupProps>(({
  name,
  value,
  onChange,
  options,
  label,
  helper,
  error,
  required,
  size = 'md',
  variant = 'default',
  orientation = 'vertical',
  className,
  testId,
}) => {
  const groupId = useId();
  const hasError = error !== false && error !== undefined;
  const errorMessage = typeof error === 'string' ? error : '';
  
  return (
    <div className={cn(styles.groupContainer, className)} role="radiogroup" aria-labelledby={`${groupId}-label`}>
      {label && (
        <div id={`${groupId}-label`} className={styles.groupLabel}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </div>
      )}
      <div className={cn(
        styles.groupOptions,
        {
          [styles.horizontal]: orientation === 'horizontal',
          [styles.vertical]: orientation === 'vertical',
        }
      )}>
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange?.(option.value)}
            label={option.label}
            helper={option.helper}
            disabled={option.disabled}
            size={size}
            variant={variant}
            error={hasError}
            testId={testId ? `${testId}-${option.value}` : undefined}
          />
        ))}
      </div>
      {(helper || errorMessage) && (
        <p className={cn(styles.groupHelper, { [styles.errorText]: hasError })}>
          {errorMessage || helper}
        </p>
      )}
    </div>
  );
});

RadioGroup.displayName = 'RadioGroup';