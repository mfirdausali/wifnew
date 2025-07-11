import { useState, useCallback, useRef, useEffect, ReactElement } from 'react';
import { createPortal } from 'react-dom';

interface UseTooltipOptions {
  content?: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  disabled?: boolean;
  delay?: number;
}

export function useTooltip(options: UseTooltipOptions = {}) {
  const { content, placement = 'top', disabled = false, delay = 500 } = options;
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<NodeJS.Timeout>();
  const elementRef = useRef<HTMLElement>();

  const calculatePosition = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 200; // Approximate width
    const tooltipHeight = 40; // Approximate height
    const spacing = 8;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = rect.top - tooltipHeight - spacing;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + spacing;
        break;
      case 'bottom':
        top = rect.bottom + spacing;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - spacing;
        break;
    }

    // Ensure tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (left < 0) left = spacing;
    if (left + tooltipWidth > viewportWidth) left = viewportWidth - tooltipWidth - spacing;
    if (top < 0) top = spacing;
    if (top + tooltipHeight > viewportHeight) top = viewportHeight - tooltipHeight - spacing;

    return { top, left };
  }, [placement]);

  const showTooltip = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (disabled || !content) return;

    elementRef.current = event.currentTarget;
    
    timeoutRef.current = setTimeout(() => {
      if (elementRef.current) {
        setPosition(calculatePosition(elementRef.current));
        setIsVisible(true);
      }
    }, delay);
  }, [disabled, content, delay, calculatePosition]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const tooltipElement: ReactElement | null = isVisible && content && typeof document !== 'undefined' ? 
    createPortal(
      <div
        className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg pointer-events-none"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
      >
        {content}
      </div>,
      document.body
    ) : null;

  return {
    tooltipProps: {
      onMouseEnter: showTooltip,
      onMouseLeave: hideTooltip,
      onFocus: showTooltip,
      onBlur: hideTooltip,
    },
    tooltipElement,
  };
}