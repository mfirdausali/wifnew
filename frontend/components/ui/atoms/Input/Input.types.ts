import { InputHTMLAttributes, ReactNode, ChangeEvent, FocusEvent, KeyboardEvent } from 'react';
import { IconType } from '../Button/Button.types';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  // Variants
  variant?: 'outline' | 'filled' | 'unstyled';
  
  // Sizes
  size?: 'sm' | 'md' | 'lg';
  
  // States
  error?: boolean | string;
  success?: boolean;
  warning?: boolean;
  loading?: boolean;
  
  // Icons
  leftIcon?: IconType;
  rightIcon?: IconType;
  
  // Addons
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  
  // Content
  label?: string;
  helper?: string;
  
  // Behavior
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  
  // Validation
  required?: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: string | number;
  max?: string | number;
  
  // Appearance
  fullWidth?: boolean;
  clearable?: boolean;
  
  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
  
  // Testing
  testId?: string;
  
  // Advanced
  mask?: string;
  formatter?: (value: string) => string;
  parser?: (value: string) => string;
}