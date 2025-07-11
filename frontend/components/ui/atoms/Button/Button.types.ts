import { ButtonHTMLAttributes, ReactNode, MouseEvent, FocusEvent, KeyboardEvent } from 'react';

export type IconType = React.FC<{ className?: string; 'aria-hidden'?: boolean }>;

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size' | 'type' | 'onClick'> {
  // Variants
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'ghost' | 'link' | 'outline';
  
  // Sizes
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  // States
  loading?: boolean;
  disabled?: boolean;
  active?: boolean;
  
  // Layout
  fullWidth?: boolean;
  block?: boolean;
  
  // Icon
  icon?: IconType;
  iconPosition?: 'left' | 'right';
  iconOnly?: boolean;
  
  // Content
  children?: ReactNode;
  
  // Behavior
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  onDoubleClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (event: MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: (event: MouseEvent<HTMLButtonElement>) => void;
  onFocus?: (event: FocusEvent<HTMLButtonElement>) => void;
  onBlur?: (event: FocusEvent<HTMLButtonElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onKeyUp?: (event: KeyboardEvent<HTMLButtonElement>) => void;
  
  // Loading
  loadingText?: string;
  spinnerPlacement?: 'start' | 'end';
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  
  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaPressed?: boolean;
  ariaExpanded?: boolean;
  ariaControls?: string;
  role?: string;
  tabIndex?: number;
  
  // Testing
  testId?: string;
  dataAttributes?: Record<string, string>;
  
  // Advanced
  ripple?: boolean;
  tooltip?: string;
  tooltipPlacement?: 'top' | 'right' | 'bottom' | 'left';
  badge?: string | number;
  badgeVariant?: 'primary' | 'success' | 'danger' | 'warning';
}

export interface ButtonGroupProps {
  children: ReactNode;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  attached?: boolean;
  className?: string;
  testId?: string;
}