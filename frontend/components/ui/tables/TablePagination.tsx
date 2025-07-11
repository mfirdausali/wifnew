import React, { memo, useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../atoms/Button';
import { Select } from '../atoms/Select';
import { Input } from '../atoms/Input';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ChevronsLeftIcon, 
  ChevronsRightIcon 
} from 'lucide-react';
import styles from './TablePagination.module.css';

export interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages?: number;
  pageSizeOptions?: number[];
  
  // Callbacks
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  
  // Display options
  showPageSize?: boolean;
  showPageJumper?: boolean;
  showTotal?: boolean;
  showFirstLast?: boolean;
  
  // Limits
  maxPageButtons?: number;
  
  // Styling
  variant?: 'simple' | 'full';
  size?: 'sm' | 'md' | 'lg';
  position?: 'left' | 'center' | 'right' | 'between';
  className?: string;
  
  // Labels
  labels?: {
    page?: string;
    of?: string;
    items?: string;
    perPage?: string;
    showing?: string;
    to?: string;
    results?: string;
    first?: string;
    previous?: string;
    next?: string;
    last?: string;
    goTo?: string;
  };
}

export const TablePagination = memo(({
  page,
  pageSize,
  totalItems,
  totalPages = Math.ceil(totalItems / pageSize),
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  showPageSize = true,
  showPageJumper = false,
  showTotal = true,
  showFirstLast = true,
  maxPageButtons = 7,
  variant = 'full',
  size = 'md',
  position = 'between',
  className,
  labels = {},
}: TablePaginationProps) => {
  const [jumpValue, setJumpValue] = useState('');
  
  const {
    page: pageLabel = 'Page',
    of: ofLabel = 'of',
    items: itemsLabel = 'items',
    perPage: perPageLabel = 'per page',
    showing: showingLabel = 'Showing',
    to: toLabel = 'to',
    results: resultsLabel = 'results',
    first: firstLabel = 'First',
    previous: previousLabel = 'Previous',
    next: nextLabel = 'Next',
    last: lastLabel = 'Last',
    goTo: goToLabel = 'Go to page',
  } = labels;

  // Calculate page numbers to display
  const getPageNumbers = useMemo(() => {
    const delta = Math.floor(maxPageButtons / 2);
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  }, [page, totalPages, maxPageButtons]);

  // Calculate showing range
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  // Handlers
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      onPageChange?.(newPage);
    }
  }, [page, totalPages, onPageChange]);

  const handlePageSizeChange = useCallback((value: string) => {
    const newPageSize = parseInt(value, 10);
    if (!isNaN(newPageSize)) {
      onPageSizeChange?.(newPageSize);
      // Reset to page 1 when changing page size
      if (page > 1) {
        onPageChange?.(1);
      }
    }
  }, [page, onPageChange, onPageSizeChange]);

  const handleJump = useCallback(() => {
    const jumpPage = parseInt(jumpValue, 10);
    if (!isNaN(jumpPage) && jumpPage >= 1 && jumpPage <= totalPages) {
      handlePageChange(jumpPage);
      setJumpValue('');
    }
  }, [jumpValue, totalPages, handlePageChange]);

  const handleJumpKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleJump();
    }
  }, [handleJump]);

  const containerClasses = cn(
    styles.container,
    styles[`position-${position}`],
    styles[`variant-${variant}`],
    className
  );

  if (variant === 'simple') {
    return (
      <div className={containerClasses}>
        <Button
          variant="ghost"
          size={size}
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          icon={ChevronLeftIcon}
          ariaLabel={previousLabel}
        >
          {previousLabel}
        </Button>
        
        <span className={styles.pageInfo}>
          {pageLabel} {page} {ofLabel} {totalPages}
        </span>
        
        <Button
          variant="ghost"
          size={size}
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          icon={ChevronRightIcon}
          iconPosition="right"
          ariaLabel={nextLabel}
        >
          {nextLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* Total and page size */}
      <div className={styles.left}>
        {showTotal && (
          <span className={styles.total}>
            {showingLabel} {startItem} {toLabel} {endItem} {ofLabel} {totalItems} {resultsLabel}
          </span>
        )}
        
        {showPageSize && (
          <Select
            value={pageSize.toString()}
            onChange={handlePageSizeChange}
            options={pageSizeOptions.map(size => ({
              value: size.toString(),
              label: `${size} ${perPageLabel}`,
            }))}
            size={size}
            className={styles.pageSize}
          />
        )}
      </div>

      {/* Pagination controls */}
      <div className={styles.controls}>
        {showFirstLast && (
          <Button
            variant="ghost"
            size={size}
            onClick={() => handlePageChange(1)}
            disabled={page === 1}
            icon={ChevronsLeftIcon}
            iconOnly
            ariaLabel={firstLabel}
          />
        )}
        
        <Button
          variant="ghost"
          size={size}
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          icon={ChevronLeftIcon}
          iconOnly
          ariaLabel={previousLabel}
        />
        
        {/* Page numbers */}
        <div className={styles.pages}>
          {getPageNumbers.map((pageNumber, index) => (
            pageNumber === '...' ? (
              <span key={`dots-${index}`} className={styles.dots}>
                ...
              </span>
            ) : (
              <Button
                key={pageNumber}
                variant={pageNumber === page ? 'primary' : 'ghost'}
                size={size}
                onClick={() => handlePageChange(pageNumber as number)}
                className={styles.pageButton}
              >
                {pageNumber}
              </Button>
            )
          ))}
        </div>
        
        <Button
          variant="ghost"
          size={size}
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          icon={ChevronRightIcon}
          iconOnly
          ariaLabel={nextLabel}
        />
        
        {showFirstLast && (
          <Button
            variant="ghost"
            size={size}
            onClick={() => handlePageChange(totalPages)}
            disabled={page === totalPages}
            icon={ChevronsRightIcon}
            iconOnly
            ariaLabel={lastLabel}
          />
        )}
      </div>

      {/* Page jumper */}
      {showPageJumper && (
        <div className={styles.jumper}>
          <span className={styles.jumperLabel}>{goToLabel}</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            onKeyDown={handleJumpKeyDown}
            onBlur={handleJump}
            size={size}
            className={styles.jumperInput}
          />
        </div>
      )}
    </div>
  );
});

TablePagination.displayName = 'TablePagination';