import { forwardRef, memo, useState, useCallback, useRef, MouseEvent, KeyboardEvent } from 'react';
import React from 'react';
import { cn } from '@/lib/utils';
import { mergeRefs } from '@/lib/utils/mergeRefs';
import { useRipple } from '@/hooks/useRipple';
import { useTooltip } from '@/hooks/useTooltip';
import { Spinner } from '../Spinner/Spinner';
import { Badge } from '../Badge/Badge';
import { ButtonProps, ButtonGroupProps } from './Button.types';
import styles from './Button.module.css';

export const Button = memo(forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    // Variants
    variant = 'primary',
    
    // Sizes
    size = 'md',
    
    // States
    loading = false,
    disabled = false,
    active = false,
    
    // Layout
    fullWidth = false,
    block = false,
    
    // Icon
    icon: Icon,
    iconPosition = 'left',
    iconOnly = false,
    
    // Content
    children,
    
    // Behavior
    type = 'button',
    onClick,
    onDoubleClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    onKeyDown,
    onKeyUp,
    
    // Loading
    loadingText,
    spinnerPlacement = 'start',
    
    // Styling
    className,
    style,
    
    // Accessibility
    ariaLabel,
    ariaDescribedBy,
    ariaPressed,
    ariaExpanded,
    ariaControls,
    role,
    tabIndex,
    
    // Testing
    testId,
    dataAttributes = {},
    
    // Advanced
    ripple = true,
    tooltip,
    tooltipPlacement = 'top',
    badge,
    badgeVariant = 'primary',
    
    ...rest
  }, ref) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isClicking, setIsClicking] = useState(false);
    
    // Merge refs
    const mergedRef = mergeRefs(ref, buttonRef);
    
    // Ripple effect
    const { rippleProps, showRipple } = useRipple({
      disabled: !ripple || disabled || loading,
      color: 'currentColor'
    });
    
    // Tooltip
    const { tooltipProps, tooltipElement } = useTooltip({
      content: tooltip,
      placement: tooltipPlacement,
      disabled: !tooltip || disabled
    });
    
    // Handle click with loading state
    const handleClick = useCallback(async (event: MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading || isClicking) {
        event.preventDefault();
        return;
      }
      
      // Show ripple effect
      if (ripple) {
        showRipple(event);
      }
      
      // Handle async onClick
      if (onClick) {
        setIsClicking(true);
        try {
          await onClick(event);
        } finally {
          setIsClicking(false);
        }
      }
    }, [disabled, loading, isClicking, onClick, ripple, showRipple]);
    
    // Handle keyboard interactions
    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        buttonRef.current?.click();
      }
      onKeyDown?.(event);
    }, [onKeyDown]);
    
    // Compute classes
    const buttonClasses = cn(
      styles.button,
      styles[variant],
      styles[size],
      {
        [styles.loading]: loading || isClicking,
        [styles.disabled]: disabled,
        [styles.active]: active,
        [styles.fullWidth]: fullWidth,
        [styles.block]: block,
        [styles.iconOnly]: iconOnly,
        [styles.hasIcon]: !!Icon,
        [styles.hasIconLeft]: !!Icon && iconPosition === 'left' && !iconOnly,
        [styles.hasIconRight]: !!Icon && iconPosition === 'right' && !iconOnly,
        [styles.hasBadge]: !!badge,
      },
      className
    );
    
    // Compute content
    const buttonContent = (
      <>
        {/* Loading spinner */}
        {(loading || isClicking) && spinnerPlacement === 'start' && (
          <Spinner
            size={size}
            className={styles.spinner}
            color="currentColor"
            testId={`${testId}-spinner`}
          />
        )}
        
        {/* Left icon */}
        {Icon && iconPosition === 'left' && !loading && !isClicking && (
          <Icon
            className={cn(styles.icon, styles.iconLeft)}
            aria-hidden="true"
          />
        )}
        
        {/* Content */}
        {!iconOnly && (
          <span className={styles.content}>
            {loading && loadingText ? loadingText : children}
          </span>
        )}
        
        {/* Right icon */}
        {Icon && iconPosition === 'right' && !loading && !isClicking && (
          <Icon
            className={cn(styles.icon, styles.iconRight)}
            aria-hidden="true"
          />
        )}
        
        {/* Loading spinner */}
        {(loading || isClicking) && spinnerPlacement === 'end' && (
          <Spinner
            size={size}
            className={styles.spinner}
            color="currentColor"
            testId={`${testId}-spinner`}
          />
        )}
        
        {/* Badge */}
        {badge && (
          <Badge
            variant={badgeVariant}
            size="sm"
            className={styles.badge}
          >
            {badge}
          </Badge>
        )}
      </>
    );
    
    return (
      <>
        <button
          ref={mergedRef}
          type={type}
          className={buttonClasses}
          style={style}
          disabled={disabled || loading}
          onClick={handleClick}
          onDoubleClick={onDoubleClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          onKeyUp={onKeyUp}
          aria-label={ariaLabel || (iconOnly && Icon ? 'Icon button' : undefined)}
          aria-describedby={ariaDescribedBy}
          aria-pressed={ariaPressed}
          aria-expanded={ariaExpanded}
          aria-controls={ariaControls}
          aria-busy={loading || isClicking}
          role={role}
          tabIndex={disabled ? -1 : tabIndex}
          data-testid={testId}
          data-variant={variant}
          data-size={size}
          data-loading={loading || isClicking}
          {...Object.entries(dataAttributes).reduce((acc, [key, value]) => ({
            ...acc,
            [`data-${key}`]: value
          }), {})}
          {...tooltipProps}
          {...rippleProps}
          {...rest}
        >
          {buttonContent}
        </button>
        {tooltipElement}
      </>
    );
  }
));

Button.displayName = 'Button';

// Button Group Component
export const ButtonGroup = memo<ButtonGroupProps>(({
  children,
  variant,
  size,
  orientation = 'horizontal',
  spacing = 'sm',
  attached = false,
  className,
  testId
}) => {
  const groupClasses = cn(
    styles.buttonGroup,
    styles[`orientation-${orientation}`],
    {
      [styles.attached]: attached,
      [styles[`spacing-${spacing}`]]: !attached && spacing !== 'none',
    },
    className
  );
  
  return (
    <div
      className={groupClasses}
      role="group"
      data-testid={testId}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === Button) {
          return React.cloneElement(child as React.ReactElement<ButtonProps>, {
            variant: child.props.variant || variant,
            size: child.props.size || size,
          });
        }
        return child;
      })}
    </div>
  );
});

ButtonGroup.displayName = 'ButtonGroup';