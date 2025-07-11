import React, { forwardRef, memo, useId, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { IconType } from '../../atoms/Button/Button.types';
import styles from './FormField.module.css';

export interface FormFieldProps {
  // Field identification
  name: string;
  id?: string;
  
  // Label configuration
  label?: string;
  labelPosition?: 'top' | 'left' | 'floating';
  required?: boolean;
  requiredIndicator?: '*' | 'required' | 'optional';
  
  // Field content
  children: ReactNode;
  
  // Help text
  hint?: string;
  hintIcon?: IconType;
  hintPosition?: 'below' | 'tooltip';
  
  // Validation
  error?: string | string[];
  warning?: string;
  success?: string;
  touched?: boolean;
  
  // Layout
  fullWidth?: boolean;
  inline?: boolean;
  spacing?: 'compact' | 'normal' | 'relaxed';
  
  // Styling
  className?: string;
  labelClassName?: string;
  contentClassName?: string;
  
  // Accessibility
  description?: string;
  
  // Advanced
  showCharacterCount?: boolean;
  maxLength?: number;
  currentLength?: number;
  
  // Testing
  testId?: string;
}

export const FormField = memo(forwardRef<HTMLDivElement, FormFieldProps>(
  ({
    // Field identification
    name,
    id: providedId,
    
    // Label configuration
    label,
    labelPosition = 'top',
    required = false,
    requiredIndicator = '*',
    
    // Field content
    children,
    
    // Help text
    hint,
    hintIcon: HintIcon,
    hintPosition = 'below',
    
    // Validation
    error,
    warning,
    success,
    touched = false,
    
    // Layout
    fullWidth = false,
    inline = false,
    spacing = 'normal',
    
    // Styling
    className,
    labelClassName,
    contentClassName,
    
    // Accessibility
    description,
    
    // Advanced
    showCharacterCount = false,
    maxLength,
    currentLength = 0,
    
    // Testing
    testId,
  }, ref) => {
    const generatedId = useId();
    const fieldId = providedId || `${name}-${generatedId}`;
    const errorId = `${fieldId}-error`;
    const hintId = `${fieldId}-hint`;
    const descriptionId = `${fieldId}-description`;
    
    // Handle multiple errors
    const errorMessages = Array.isArray(error) ? error : error ? [error] : [];
    const hasError = errorMessages.length > 0 && touched;
    const showSuccess = success && !hasError && touched;
    const showWarning = warning && !hasError && !showSuccess && touched;
    
    // Build aria-describedby
    const ariaDescribedBy = [
      hasError && errorId,
      hint && hintId,
      description && descriptionId,
    ].filter(Boolean).join(' ') || undefined;
    
    // Field wrapper classes
    const fieldClasses = cn(
      styles.field,
      styles[`spacing-${spacing}`],
      {
        [styles.fullWidth]: fullWidth,
        [styles.inline]: inline,
        [styles[`label-${labelPosition}`]]: label,
      },
      className
    );
    
    // Label classes
    const labelClasses = cn(
      styles.label,
      {
        [styles.required]: required,
        [styles.floating]: labelPosition === 'floating',
      },
      labelClassName
    );
    
    // Content wrapper classes
    const contentClasses = cn(
      styles.content,
      contentClassName
    );
    
    // Helper text classes
    const helperClasses = cn(
      styles.helper,
      {
        [styles.error]: hasError,
        [styles.warning]: showWarning,
        [styles.success]: showSuccess,
      }
    );
    
    return (
      <div ref={ref} className={fieldClasses} data-testid={testId}>
        {label && labelPosition !== 'floating' && (
          <label htmlFor={fieldId} className={labelClasses}>
            {label}
            {required && requiredIndicator === '*' && (
              <span className={styles.requiredStar} aria-label="required">*</span>
            )}
            {required && requiredIndicator === 'required' && (
              <span className={styles.requiredText}>(required)</span>
            )}
            {!required && requiredIndicator === 'optional' && (
              <span className={styles.optionalText}>(optional)</span>
            )}
          </label>
        )}
        
        <div className={contentClasses}>
          {React.cloneElement(children as React.ReactElement, {
            id: fieldId,
            name,
            'aria-describedby': ariaDescribedBy,
            'aria-invalid': hasError,
            'aria-required': required,
          })}
          
          {labelPosition === 'floating' && (
            <label htmlFor={fieldId} className={labelClasses}>
              {label}
              {required && <span className={styles.requiredStar}>*</span>}
            </label>
          )}
        </div>
        
        {/* Character count */}
        {showCharacterCount && maxLength && (
          <div className={styles.characterCount}>
            <span className={currentLength > maxLength ? styles.overLimit : ''}>
              {currentLength}
            </span>
            /{maxLength}
          </div>
        )}
        
        {/* Error messages */}
        {hasError && errorMessages.map((errorMessage, index) => (
          <div
            key={index}
            id={index === 0 ? errorId : undefined}
            className={helperClasses}
            role="alert"
          >
            {errorMessage}
          </div>
        ))}
        
        {/* Warning message */}
        {showWarning && (
          <div className={helperClasses} role="alert">
            {warning}
          </div>
        )}
        
        {/* Success message */}
        {showSuccess && (
          <div className={helperClasses}>
            {success}
          </div>
        )}
        
        {/* Hint text */}
        {hint && hintPosition === 'below' && !hasError && !showWarning && !showSuccess && (
          <div id={hintId} className={styles.hint}>
            {HintIcon && <HintIcon className={styles.hintIcon} aria-hidden="true" />}
            {hint}
          </div>
        )}
        
        {/* Description */}
        {description && (
          <div id={descriptionId} className={styles.description}>
            {description}
          </div>
        )}
      </div>
    );
  }
));

FormField.displayName = 'FormField';