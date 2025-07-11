import React, { memo, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { Button } from '../atoms/Button';
import { Checkbox } from '../atoms/Checkbox';
import { SearchIcon, FilterIcon, XIcon } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import type { TableFilter, FilterOption } from './DataTable.types';
import styles from './TableFilters.module.css';

export interface TableFiltersProps {
  filters: TableFilter[];
  activeFilters: Record<string, any>;
  onFilterChange?: (filters: Record<string, any>) => void;
  onClearFilters?: () => void;
  
  // Display options
  layout?: 'horizontal' | 'vertical' | 'grid';
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchDebounce?: number;
  
  // Advanced filters
  showAdvanced?: boolean;
  advancedFilters?: TableFilter[];
  savedFilters?: SavedFilter[];
  onSaveFilter?: (name: string, filters: Record<string, any>) => void;
  onLoadFilter?: (filter: SavedFilter) => void;
  
  // Styling
  variant?: 'inline' | 'dropdown' | 'sidebar';
  className?: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, any>;
  isDefault?: boolean;
  createdAt: Date;
  createdBy: string;
}

export const TableFilters = memo(({
  filters,
  activeFilters,
  onFilterChange,
  onClearFilters,
  layout = 'horizontal',
  showSearch = true,
  searchPlaceholder = 'Search...',
  searchDebounce = 300,
  showAdvanced = false,
  advancedFilters = [],
  savedFilters = [],
  onSaveFilter,
  onLoadFilter,
  variant = 'inline',
  className,
}: TableFiltersProps) => {
  const [search, setSearch] = useState(activeFilters.search || '');
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  const [localFilters, setLocalFilters] = useState(activeFilters);

  // Debounced search
  const debouncedSearch = useDebounce(search, searchDebounce);

  useEffect(() => {
    if (debouncedSearch !== activeFilters.search) {
      handleFilterChange('search', debouncedSearch);
    }
  }, [debouncedSearch]);

  const handleFilterChange = useCallback((filterId: string, value: any) => {
    const newFilters = { ...localFilters };
    
    if (value === null || value === undefined || value === '') {
      delete newFilters[filterId];
    } else {
      newFilters[filterId] = value;
    }
    
    setLocalFilters(newFilters);
    onFilterChange?.(newFilters);
  }, [localFilters, onFilterChange]);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setLocalFilters({});
    onFilterChange?.({});
    onClearFilters?.();
  }, [onFilterChange, onClearFilters]);

  const activeFilterCount = Object.keys(localFilters).filter(
    key => key !== 'search' && localFilters[key] != null
  ).length;

  const containerClasses = cn(
    styles.container,
    styles[`layout-${layout}`],
    styles[`variant-${variant}`],
    className
  );

  const renderFilter = (filter: TableFilter) => {
    const value = localFilters[filter.id];

    switch (filter.type) {
      case 'text':
        return (
          <Input
            key={filter.id}
            type="text"
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            placeholder={filter.placeholder || filter.label}
            size="sm"
            className={styles.filterInput}
          />
        );

      case 'select':
        return (
          <Select
            key={filter.id}
            value={value || ''}
            onChange={(val) => handleFilterChange(filter.id, val)}
            options={[
              { value: '', label: `All ${filter.label}` },
              ...(filter.options || [])
            ]}
            size="sm"
            className={styles.filterSelect}
          />
        );

      case 'multiselect':
        return (
          <div key={filter.id} className={styles.multiselect}>
            <div className={styles.multiselectLabel}>{filter.label}</div>
            {filter.options?.map(option => (
              <Checkbox
                key={option.value}
                checked={Array.isArray(value) && value.includes(option.value)}
                onChange={(checked) => {
                  const currentValue = Array.isArray(value) ? value : [];
                  const newValue = checked
                    ? [...currentValue, option.value]
                    : currentValue.filter(v => v !== option.value);
                  handleFilterChange(filter.id, newValue.length > 0 ? newValue : null);
                }}
                label={option.label}
              />
            ))}
          </div>
        );

      case 'number':
        return (
          <Input
            key={filter.id}
            type="number"
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value ? Number(e.target.value) : null)}
            placeholder={filter.placeholder || filter.label}
            size="sm"
            className={styles.filterInput}
          />
        );

      case 'boolean':
        return (
          <Select
            key={filter.id}
            value={value?.toString() || ''}
            onChange={(val) => handleFilterChange(filter.id, val === '' ? null : val === 'true')}
            options={[
              { value: '', label: `All ${filter.label}` },
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' },
            ]}
            size="sm"
            className={styles.filterSelect}
          />
        );

      case 'date':
        return (
          <Input
            key={filter.id}
            type="date"
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            placeholder={filter.placeholder || filter.label}
            size="sm"
            className={styles.filterInput}
          />
        );

      case 'daterange':
        return (
          <div key={filter.id} className={styles.dateRange}>
            <Input
              type="date"
              value={value?.start || ''}
              onChange={(e) => handleFilterChange(filter.id, { ...value, start: e.target.value })}
              placeholder="From"
              size="sm"
            />
            <Input
              type="date"
              value={value?.end || ''}
              onChange={(e) => handleFilterChange(filter.id, { ...value, end: e.target.value })}
              placeholder="To"
              size="sm"
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (variant === 'dropdown') {
    return (
      <div className={containerClasses}>
        <Button
          variant="outline"
          icon={FilterIcon}
          size="sm"
          onClick={() => setShowAdvancedPanel(!showAdvancedPanel)}
        >
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </Button>
        
        {showAdvancedPanel && (
          <div className={styles.dropdownPanel}>
            <div className={styles.dropdownContent}>
              {filters.map(renderFilter)}
            </div>
            <div className={styles.dropdownActions}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className={styles.filters}>
        {/* Search */}
        {showSearch && (
          <div className={styles.search}>
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              icon={SearchIcon}
              size="sm"
              className={styles.searchInput}
            />
          </div>
        )}

        {/* Quick filters */}
        {filters.map(renderFilter)}

        {/* Advanced filters toggle */}
        {showAdvanced && advancedFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedPanel(!showAdvancedPanel)}
          >
            Advanced
          </Button>
        )}

        {/* Clear filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            icon={XIcon}
            onClick={handleClearFilters}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Advanced filters panel */}
      {showAdvanced && showAdvancedPanel && (
        <div className={styles.advancedPanel}>
          {advancedFilters.map(renderFilter)}
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className={styles.activeFilters}>
          {Object.entries(localFilters).map(([key, value]) => {
            if (key === 'search' || value == null) return null;
            
            const filter = [...filters, ...advancedFilters].find(f => f.id === key);
            if (!filter) return null;

            let displayValue = value;
            if (filter.type === 'select' && filter.options) {
              const option = filter.options.find(o => o.value === value);
              displayValue = option?.label || value;
            } else if (filter.type === 'boolean') {
              displayValue = value ? 'Yes' : 'No';
            } else if (Array.isArray(value)) {
              displayValue = value.length + ' selected';
            }

            return (
              <div key={key} className={styles.filterChip}>
                <span className={styles.chipLabel}>{filter.label}:</span>
                <span className={styles.chipValue}>{String(displayValue)}</span>
                <button
                  className={styles.chipRemove}
                  onClick={() => handleFilterChange(key, null)}
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <XIcon />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

TableFilters.displayName = 'TableFilters';

// Hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}