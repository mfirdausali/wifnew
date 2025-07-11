import { forwardRef, memo, useId, useState, useCallback, ChangeEvent } from 'react';
import { cn } from '@/lib/utils';
import { InputProps } from './Input.types';
import styles from './Input.module.css';

const XMarkIcon: React.FC<{ className?: string; onClick?: () => void }> = ({ className, onClick }) => (
  <svg
    className={className}
    onClick={onClick}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const Input = memo(forwardRef<HTMLInputElement, InputProps>(
  ({
    // Variants
    variant = 'outline',
    
    // Sizes
    size = 'md',
    
    // States
    error = false,
    success = false,
    warning = false,
    loading = false,
    disabled = false,
    
    // Icons
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    
    // Addons
    leftAddon,
    rightAddon,
    leftElement,
    rightElement,
    
    // Content
    label,
    helper,
    
    // Behavior
    onChange,
    onClear,
    
    // Validation
    required,
    pattern,
    minLength,
    maxLength,
    min,
    max,
    
    // Appearance
    fullWidth = false,
    clearable = false,
    
    // Accessibility
    ariaLabel,
    ariaDescribedBy,
    ariaInvalid,
    
    // Testing
    testId,
    
    // Advanced
    mask,
    formatter,
    parser,
    
    // Native props
    value,
    defaultValue,
    placeholder,
    type = 'text',
    id: providedId,
    className,
    ...rest
  }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const helperId = `${id}-helper`;
    
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const displayValue = value !== undefined ? value : internalValue;
    
    // Handle change with formatter/parser
    const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
      let newValue = event.target.value;
      
      if (parser) {
        newValue = parser(newValue);
      }
      
      if (formatter) {
        newValue = formatter(newValue);
      }
      
      if (value === undefined) {
        setInternalValue(newValue);
      }
      
      onChange?.(event);
    }, [onChange, parser, formatter, value]);
    
    // Handle clear
    const handleClear = useCallback(() => {
      if (value === undefined) {
        setInternalValue('');
      }
      onClear?.();
    }, [onClear, value]);
    
    // Determine error state
    const hasError = error !== false;
    const errorMessage = typeof error === 'string' ? error : '';
    
    // Compute classes
    const wrapperClasses = cn(
      styles.inputWrapper,
      {
        [styles.fullWidth]: fullWidth,
      },
      className
    );
    
    const containerClasses = cn(
      styles.inputContainer,
      styles[variant],
      styles[size],
      {
        [styles.error]: hasError,
        [styles.success]: success && !hasError,
        [styles.warning]: warning && !hasError && !success,
        [styles.disabled]: disabled,
        [styles.loading]: loading,
        [styles.hasLeftIcon]: !!LeftIcon,
        [styles.hasRightIcon]: !!RightIcon,
        [styles.hasLeftElement]: !!leftElement,
        [styles.hasRightElement]: !!rightElement,
        [styles.hasLeftAddon]: !!leftAddon,
        [styles.hasRightAddon]: !!rightAddon,
      }
    );
    
    const inputClasses = cn(styles.input);
    
    // Helper text
    const helperText = errorMessage || helper;
    const helperClasses = cn(
      styles.helper,
      {
        [styles.errorText]: hasError,
        [styles.successText]: success && !hasError,
        [styles.warningText]: warning && !hasError && !success,
        [styles.helperText]: !hasError && !success && !warning,
      }
    );
    
    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="flex">
          {leftAddon && (
            <div className={cn(styles.addon, styles.leftAddon)}>
              {leftAddon}
            </div>
          )}
          
          <div className={containerClasses}>
            {LeftIcon && (
              <LeftIcon className={styles.leftIcon} aria-hidden="true" />
            )}
            
            {leftElement && (
              <div className={styles.leftElement}>
                {leftElement}
              </div>
            )}
            
            <input
              ref={ref}
              id={id}
              type={type}
              value={displayValue}
              onChange={handleChange}
              disabled={disabled || loading}
              required={required}
              pattern={pattern}
              minLength={minLength}
              maxLength={maxLength}
              min={min}
              max={max}
              placeholder={placeholder}
              className={inputClasses}
              aria-label={ariaLabel || label}
              aria-describedby={helperText ? helperId : ariaDescribedBy}
              aria-invalid={ariaInvalid || hasError}
              data-testid={testId}
              {...rest}
            />
            
            {clearable && displayValue && !disabled && !loading && (
              <button
                type="button"
                onClick={handleClear}
                className={styles.clearButton}
                aria-label="Clear input"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
            
            {rightElement && (
              <div className={styles.rightElement}>
                {rightElement}
              </div>
            )}
            
            {RightIcon && (
              <RightIcon className={styles.rightIcon} aria-hidden="true" />
            )}
          </div>
          
          {rightAddon && (
            <div className={cn(styles.addon, styles.rightAddon)}>
              {rightAddon}
            </div>
          )}
        </div>
        
        {helperText && (
          <p id={helperId} className={helperClasses}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
));

Input.displayName = 'Input';