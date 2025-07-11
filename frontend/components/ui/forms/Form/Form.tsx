import { forwardRef, FormHTMLAttributes, memo } from 'react';
import { cn } from '@/lib/utils';
import styles from './Form.module.css';

export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  layout?: 'vertical' | 'horizontal' | 'inline';
  spacing?: 'compact' | 'normal' | 'relaxed';
  fullWidth?: boolean;
  testId?: string;
}

export const Form = memo(forwardRef<HTMLFormElement, FormProps>(
  ({
    layout = 'vertical',
    spacing = 'normal',
    fullWidth = false,
    className,
    children,
    testId,
    ...rest
  }, ref) => {
    const formClasses = cn(
      styles.form,
      styles[`layout-${layout}`],
      styles[`spacing-${spacing}`],
      {
        [styles.fullWidth]: fullWidth,
      },
      className
    );
    
    return (
      <form
        ref={ref}
        className={formClasses}
        data-testid={testId}
        {...rest}
      >
        {children}
      </form>
    );
  }
));

Form.displayName = 'Form';