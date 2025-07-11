import React, { forwardRef, memo, useState } from 'react';
import { cn } from '@/lib/utils';
import styles from './Avatar.module.css';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'away' | 'busy';
  statusPosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  className?: string;
  fallbackClassName?: string;
  onClick?: () => void;
  testId?: string;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getBackgroundColor = (name: string): string => {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export const Avatar = memo(forwardRef<HTMLDivElement, AvatarProps>(
  ({
    src,
    alt,
    name,
    size = 'md',
    shape = 'circle',
    status,
    statusPosition = 'bottom-right',
    className,
    fallbackClassName,
    onClick,
    testId,
  }, ref) => {
    const [imageError, setImageError] = useState(false);
    const showFallback = !src || imageError;
    const initials = name ? getInitials(name) : '';
    const backgroundColor = name ? getBackgroundColor(name) : 'bg-gray-400';
    
    return (
      <div
        ref={ref}
        className={cn(
          styles.container,
          styles[size],
          styles[shape],
          {
            [styles.clickable]: !!onClick,
          },
          className
        )}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        data-testid={testId}
      >
        {showFallback ? (
          <div
            className={cn(
              styles.fallback,
              backgroundColor,
              fallbackClassName
            )}
            aria-label={name || 'Avatar'}
          >
            {initials || (
              <svg
                className={styles.fallbackIcon}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            )}
          </div>
        ) : (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className={styles.image}
            onError={() => setImageError(true)}
          />
        )}
        
        {status && (
          <span
            className={cn(
              styles.status,
              styles[`status-${status}`],
              styles[`status-${statusPosition}`]
            )}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
));

Avatar.displayName = 'Avatar';

// Avatar Group Component
export interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: AvatarProps['size'];
  spacing?: 'tight' | 'normal' | 'loose';
  className?: string;
  testId?: string;
}

export const AvatarGroup = memo<AvatarGroupProps>(({
  children,
  max = 3,
  size = 'md',
  spacing = 'tight',
  className,
  testId,
}) => {
  const childrenArray = React.Children.toArray(children);
  const visibleChildren = max ? childrenArray.slice(0, max) : childrenArray;
  const remainingCount = childrenArray.length - visibleChildren.length;
  
  return (
    <div
      className={cn(
        styles.group,
        styles[`group-${spacing}`],
        className
      )}
      data-testid={testId}
    >
      {React.Children.map(visibleChildren, (child, index) => {
        if (React.isValidElement(child) && child.type === Avatar) {
          return React.cloneElement(child as React.ReactElement<AvatarProps>, {
            size: child.props.size || size,
            className: cn(child.props.className, styles.groupAvatar),
            style: {
              ...child.props.style,
              zIndex: visibleChildren.length - index,
            },
          });
        }
        return child;
      })}
      
      {remainingCount > 0 && (
        <div
          className={cn(
            styles.container,
            styles[size],
            styles.circle,
            styles.groupAvatar,
            styles.moreAvatar
          )}
        >
          <div className={cn(styles.fallback, 'bg-gray-300 text-gray-700')}>
            +{remainingCount}
          </div>
        </div>
      )}
    </div>
  );
});

AvatarGroup.displayName = 'AvatarGroup';