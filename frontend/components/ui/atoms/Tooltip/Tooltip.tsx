import React, { forwardRef, memo, useState, useRef, useEffect, cloneElement, ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  children: ReactElement;
  content: React.ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  offset?: number;
  disabled?: boolean;
  arrow?: boolean;
  className?: string;
  contentClassName?: string;
  interactive?: boolean;
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
}

interface Position {
  top: number;
  left: number;
  placement: TooltipProps['placement'];
}

const calculatePosition = (
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  placement: TooltipProps['placement'],
  offset: number
): Position => {
  let top = 0;
  let left = 0;
  let actualPlacement = placement;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calculate initial position based on placement
  switch (placement) {
    case 'top':
      top = triggerRect.top - tooltipRect.height - offset;
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
      break;
    case 'right':
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
      left = triggerRect.right + offset;
      break;
    case 'bottom':
      top = triggerRect.bottom + offset;
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
      break;
    case 'left':
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
      left = triggerRect.left - tooltipRect.width - offset;
      break;
  }

  // Check boundaries and flip if needed
  if (placement === 'top' && top < 0) {
    top = triggerRect.bottom + offset;
    actualPlacement = 'bottom';
  } else if (placement === 'bottom' && top + tooltipRect.height > viewportHeight) {
    top = triggerRect.top - tooltipRect.height - offset;
    actualPlacement = 'top';
  } else if (placement === 'left' && left < 0) {
    left = triggerRect.right + offset;
    actualPlacement = 'right';
  } else if (placement === 'right' && left + tooltipRect.width > viewportWidth) {
    left = triggerRect.left - tooltipRect.width - offset;
    actualPlacement = 'left';
  }

  // Ensure tooltip stays within viewport horizontally
  if (left < 0) left = offset;
  if (left + tooltipRect.width > viewportWidth) {
    left = viewportWidth - tooltipRect.width - offset;
  }

  // Ensure tooltip stays within viewport vertically
  if (top < 0) top = offset;
  if (top + tooltipRect.height > viewportHeight) {
    top = viewportHeight - tooltipRect.height - offset;
  }

  return { top, left, placement: actualPlacement };
};

export const Tooltip = memo(forwardRef<HTMLDivElement, TooltipProps>(
  ({
    children,
    content,
    placement = 'top',
    delay = 500,
    offset = 8,
    disabled = false,
    arrow = true,
    className,
    contentClassName,
    interactive = false,
    visible: controlledVisible,
    onVisibleChange,
  }, ref) => {
    const [internalVisible, setInternalVisible] = useState(false);
    const [position, setPosition] = useState<Position>({ top: 0, left: 0, placement });
    const triggerRef = useRef<HTMLElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout>();
    const mouseInTooltip = useRef(false);

    const isControlled = controlledVisible !== undefined;
    const visible = isControlled ? controlledVisible : internalVisible;

    const updatePosition = () => {
      if (!triggerRef.current || !tooltipRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const newPosition = calculatePosition(triggerRect, tooltipRect, placement, offset);
      
      setPosition(newPosition);
    };

    const show = () => {
      if (disabled || !content) return;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (isControlled) {
          onVisibleChange?.(true);
        } else {
          setInternalVisible(true);
        }
      }, delay);
    };

    const hide = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // If interactive and mouse is in tooltip, don't hide
      if (interactive && mouseInTooltip.current) return;

      if (isControlled) {
        onVisibleChange?.(false);
      } else {
        setInternalVisible(false);
      }
    };

    const handleMouseEnter = () => show();
    const handleMouseLeave = () => hide();
    const handleFocus = () => show();
    const handleBlur = () => hide();

    const handleTooltipMouseEnter = () => {
      mouseInTooltip.current = true;
    };

    const handleTooltipMouseLeave = () => {
      mouseInTooltip.current = false;
      hide();
    };

    // Update position when visible
    useEffect(() => {
      if (visible) {
        updatePosition();
        window.addEventListener('scroll', updatePosition);
        window.addEventListener('resize', updatePosition);

        return () => {
          window.removeEventListener('scroll', updatePosition);
          window.removeEventListener('resize', updatePosition);
        };
      }
    }, [visible]);

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    // Clone children and add event handlers
    const trigger = cloneElement(children, {
      ref: triggerRef,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
      'aria-describedby': visible ? 'tooltip' : undefined,
    });

    const tooltipContent = visible && typeof document !== 'undefined' ? createPortal(
      <div
        ref={tooltipRef}
        id="tooltip"
        role="tooltip"
        className={cn(
          styles.tooltip,
          styles[position.placement],
          className
        )}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        onMouseEnter={interactive ? handleTooltipMouseEnter : undefined}
        onMouseLeave={interactive ? handleTooltipMouseLeave : undefined}
      >
        <div className={cn(styles.content, contentClassName)}>
          {content}
        </div>
        {arrow && (
          <div className={cn(styles.arrow, styles[`arrow-${position.placement}`])} />
        )}
      </div>,
      document.body
    ) : null;

    return (
      <>
        {trigger}
        {tooltipContent}
      </>
    );
  }
));

Tooltip.displayName = 'Tooltip';