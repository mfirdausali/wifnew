import { SelectHTMLAttributes, ReactNode } from 'react';
import { IconType } from '../Button/Button.types';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: IconType;
  description?: string;
  group?: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'onChange'> {
  // Options
  options: SelectOption[];
  
  // Variants
  variant?: 'outline' | 'filled' | 'unstyled';
  
  // Sizes
  size?: 'sm' | 'md' | 'lg';
  
  // States
  error?: boolean | string;
  success?: boolean;
  warning?: boolean;
  loading?: boolean;
  
  // Features
  searchable?: boolean;
  clearable?: boolean;
  multiple?: boolean;
  
  // Content
  label?: string;
  helper?: string;
  placeholder?: string;
  emptyMessage?: string;
  
  // Icons
  leftIcon?: IconType;
  
  // Behavior
  onChange?: (value: string | string[]) => void;
  onSearch?: (query: string) => void;
  
  // Appearance
  fullWidth?: boolean;
  
  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  
  // Testing
  testId?: string;
}