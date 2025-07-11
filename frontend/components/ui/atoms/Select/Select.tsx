import { forwardRef, memo, useId, useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SelectProps, SelectOption } from './Select.types';
import { Input } from '../Input';
import styles from './Select.module.css';

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export const Select = memo(forwardRef<HTMLDivElement, SelectProps>(
  ({
    // Options
    options,
    
    // Variants
    variant = 'outline',
    
    // Sizes
    size = 'md',
    
    // States
    error = false,
    success = false,
    warning = false,
    loading = false,
    disabled = false,
    
    // Features
    searchable = false,
    clearable = false,
    multiple = false,
    
    // Content
    label,
    helper,
    placeholder = 'Select an option',
    emptyMessage = 'No options found',
    
    // Icons
    leftIcon: LeftIcon,
    
    // Behavior
    onChange,
    onSearch,
    
    // Appearance
    fullWidth = false,
    
    // Accessibility
    ariaLabel,
    ariaDescribedBy,
    
    // Testing
    testId,
    
    // Native props
    value,
    defaultValue,
    id: providedId,
    className,
    ...rest
  }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    const [internalValue, setInternalValue] = useState<string | string[]>(
      defaultValue || (multiple ? [] : '')
    );
    const selectedValue = value !== undefined ? value : internalValue;
    
    // Filter options based on search
    const filteredOptions = searchable && searchQuery
      ? options.filter(option =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          option.value.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;
    
    // Group options
    const groupedOptions = filteredOptions.reduce((acc, option) => {
      const group = option.group || '';
      if (!acc[group]) acc[group] = [];
      acc[group].push(option);
      return acc;
    }, {} as Record<string, SelectOption[]>);
    
    // Get display value
    const getDisplayValue = () => {
      if (!selectedValue || (Array.isArray(selectedValue) && selectedValue.length === 0)) {
        return placeholder;
      }
      
      if (multiple && Array.isArray(selectedValue)) {
        const selectedOptions = options.filter(opt => selectedValue.includes(opt.value));
        return selectedOptions.map(opt => opt.label).join(', ');
      }
      
      const selectedOption = options.find(opt => opt.value === selectedValue);
      return selectedOption?.label || placeholder;
    };
    
    // Handle selection
    const handleSelect = useCallback((optionValue: string) => {
      let newValue: string | string[];
      
      if (multiple) {
        const currentValues = Array.isArray(selectedValue) ? selectedValue : [];
        if (currentValues.includes(optionValue)) {
          newValue = currentValues.filter(v => v !== optionValue);
        } else {
          newValue = [...currentValues, optionValue];
        }
      } else {
        newValue = optionValue;
        setIsOpen(false);
      }
      
      if (value === undefined) {
        setInternalValue(newValue);
      }
      
      onChange?.(newValue);
      setSearchQuery('');
    }, [multiple, selectedValue, value, onChange]);
    
    // Handle clear
    const handleClear = useCallback(() => {
      const newValue = multiple ? [] : '';
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    }, [multiple, value, onChange]);
    
    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (!isOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
      
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
            handleSelect(filteredOptions[highlightedIndex].value);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    }, [isOpen, filteredOptions, highlightedIndex, handleSelect]);
    
    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    // Focus search input when opened
    useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen, searchable]);
    
    const isSelected = (optionValue: string) => {
      if (multiple && Array.isArray(selectedValue)) {
        return selectedValue.includes(optionValue);
      }
      return selectedValue === optionValue;
    };
    
    return (
      <div className={cn(styles.container, { [styles.fullWidth]: fullWidth }, className)} ref={ref}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {rest.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div ref={containerRef} className={styles.selectWrapper}>
          <button
            id={id}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            disabled={disabled || loading}
            className={cn(
              styles.select,
              styles[variant],
              styles[size],
              {
                [styles.error]: error,
                [styles.success]: success && !error,
                [styles.warning]: warning && !error && !success,
                [styles.disabled]: disabled,
                [styles.loading]: loading,
                [styles.open]: isOpen,
              }
            )}
            aria-label={ariaLabel || label}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            data-testid={testId}
          >
            {LeftIcon && <LeftIcon className={styles.leftIcon} aria-hidden="true" />}
            
            <span className={styles.value}>{getDisplayValue()}</span>
            
            <div className={styles.actions}>
              {clearable && selectedValue && !disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className={styles.clearButton}
                  aria-label="Clear selection"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <ChevronDownIcon className={cn(styles.chevron, { [styles.rotated]: isOpen })} />
            </div>
          </button>
          
          {isOpen && (
            <div className={styles.dropdown} role="listbox">
              {searchable && (
                <div className={styles.searchWrapper}>
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      onSearch?.(e.target.value);
                    }}
                    size="sm"
                    variant="outline"
                  />
                </div>
              )}
              
              <div className={styles.optionsList}>
                {filteredOptions.length === 0 ? (
                  <div className={styles.empty}>{emptyMessage}</div>
                ) : (
                  Object.entries(groupedOptions).map(([group, groupOptions]) => (
                    <div key={group}>
                      {group && (
                        <div className={styles.groupLabel}>{group}</div>
                      )}
                      {groupOptions.map((option, index) => {
                        const globalIndex = filteredOptions.indexOf(option);
                        const selected = isSelected(option.value);
                        
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelect(option.value)}
                            disabled={option.disabled}
                            className={cn(
                              styles.option,
                              {
                                [styles.selected]: selected,
                                [styles.highlighted]: globalIndex === highlightedIndex,
                                [styles.disabled]: option.disabled,
                              }
                            )}
                            onMouseEnter={() => setHighlightedIndex(globalIndex)}
                            role="option"
                            aria-selected={selected}
                          >
                            {option.icon && <option.icon className={styles.optionIcon} />}
                            <div className={styles.optionContent}>
                              <div className={styles.optionLabel}>{option.label}</div>
                              {option.description && (
                                <div className={styles.optionDescription}>{option.description}</div>
                              )}
                            </div>
                            {selected && <CheckIcon className={styles.checkIcon} />}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        {helper && (
          <p className={cn(
            styles.helper,
            {
              [styles.errorText]: error,
              [styles.successText]: success && !error,
              [styles.warningText]: warning && !error && !success,
            }
          )}>
            {typeof error === 'string' ? error : helper}
          </p>
        )}
      </div>
    );
  }
));

Select.displayName = 'Select';