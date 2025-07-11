import { useCallback, useRef } from 'react';

interface UseRippleOptions {
  disabled?: boolean;
  color?: string;
}

export function useRipple(options: UseRippleOptions = {}) {
  const { disabled = false, color = 'currentColor' } = options;
  const rippleRef = useRef<HTMLDivElement>(null);

  const showRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (disabled || !event.currentTarget) return;

    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.pointerEvents = 'none';
    ripple.style.backgroundColor = color;
    ripple.style.opacity = '0.2';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s ease-out';

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  }, [disabled, color]);

  return {
    rippleProps: {
      onMouseDown: disabled ? undefined : showRipple,
    },
    showRipple,
  };
}