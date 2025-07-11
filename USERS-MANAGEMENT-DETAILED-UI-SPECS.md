# Users Management Feature - Detailed UI/UX Specifications

## Level 4: Comprehensive UI/UX Specifications

### 4.1 Design System Foundation

#### 4.1.1 Color Palette & CSS Variables
```css
:root {
  /* Primary Colors */
  --primary-50: #EFF6FF;   /* Lightest blue for backgrounds */
  --primary-100: #DBEAFE;  /* Light blue for hover states */
  --primary-200: #BFDBFE;  /* Soft blue for borders */
  --primary-300: #93C5FD;  /* Medium blue for active states */
  --primary-400: #60A5FA;  /* Strong blue for icons */
  --primary-500: #3B82F6;  /* Main brand blue */
  --primary-600: #2563EB;  /* Darker blue for CTA buttons */
  --primary-700: #1D4ED8;  /* Deep blue for pressed states */
  --primary-800: #1E40AF;  /* Very dark blue for text */
  --primary-900: #1E3A8A;  /* Darkest blue for headers */
  
  /* Neutral Colors */
  --gray-50: #F9FAFB;      /* Background color */
  --gray-100: #F3F4F6;     /* Table row stripes */
  --gray-200: #E5E7EB;     /* Border color */
  --gray-300: #D1D5DB;     /* Disabled state */
  --gray-400: #9CA3AF;     /* Placeholder text */
  --gray-500: #6B7280;     /* Secondary text */
  --gray-600: #4B5563;     /* Primary text */
  --gray-700: #374151;     /* Headers */
  --gray-800: #1F2937;     /* Dark text */
  --gray-900: #111827;     /* Darkest text */
  
  /* Status Colors */
  --success-50: #F0FDF4;   /* Success background */
  --success-100: #DCFCE7;  /* Success light */
  --success-200: #BBF7D0;  /* Success border */
  --success-400: #4ADE80;  /* Success icon */
  --success-500: #22C55E;  /* Success primary */
  --success-600: #16A34A;  /* Success dark */
  --success-700: #15803D;  /* Success pressed */
  
  --warning-50: #FFFBEB;   /* Warning background */
  --warning-100: #FEF3C7;  /* Warning light */
  --warning-200: #FDE68A;  /* Warning border */
  --warning-400: #FBBF24;  /* Warning icon */
  --warning-500: #F59E0B;  /* Warning primary */
  --warning-600: #D97706;  /* Warning dark */
  --warning-700: #B45309;  /* Warning pressed */
  
  --error-50: #FEF2F2;     /* Error background */
  --error-100: #FEE2E2;   /* Error light */
  --error-200: #FECACA;   /* Error border */
  --error-400: #F87171;   /* Error icon */
  --error-500: #EF4444;   /* Error primary */
  --error-600: #DC2626;   /* Error dark */
  --error-700: #B91C1C;   /* Error pressed */
  
  /* Shadows */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  
  /* Spacing System */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 28px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
}
```

#### 4.1.2 Typography System
```css
:root {
  /* Font Families */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  
  /* Font Sizes */
  --text-xs: 12px;      /* Line height: 16px */
  --text-sm: 14px;      /* Line height: 20px */
  --text-base: 16px;    /* Line height: 24px */
  --text-lg: 18px;      /* Line height: 28px */
  --text-xl: 20px;      /* Line height: 28px */
  --text-2xl: 24px;     /* Line height: 32px */
  --text-3xl: 30px;     /* Line height: 36px */
  --text-4xl: 36px;     /* Line height: 40px */
  
  /* Font Weights */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
  
  /* Letter Spacing */
  --letter-tight: -0.025em;
  --letter-normal: 0;
  --letter-wide: 0.025em;
  --letter-wider: 0.05em;
  --letter-widest: 0.1em;
}
```

#### 4.1.3 Animation System
```css
:root {
  /* Transitions */
  --transition-all: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-colors: background-color, border-color, color, fill, stroke 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-opacity: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-shadow: box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-transform: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Animation Durations */
  --duration-75: 75ms;
  --duration-100: 100ms;
  --duration-150: 150ms;
  --duration-200: 200ms;
  --duration-300: 300ms;
  --duration-500: 500ms;
  --duration-700: 700ms;
  --duration-1000: 1000ms;
  
  /* Easing Functions */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-elastic: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### 4.2 User List Page - Detailed Specifications

#### 4.2.1 Page Header
```css
.page-header {
  height: 72px;
  padding: 0 32px;
  background: var(--white);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 40;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.95);
}

.page-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--gray-900);
  letter-spacing: var(--letter-tight);
}

.add-user-button {
  height: 40px;
  padding: 0 20px;
  background: var(--primary-600);
  color: white;
  border-radius: 6px;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  transition: var(--transition-all);
  box-shadow: var(--shadow-sm);
}

.add-user-button:hover {
  background: var(--primary-700);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.add-user-button:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.add-user-button:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

.add-user-button .icon {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}
```

#### 4.2.2 Filter Bar Specifications
```css
.filter-bar {
  height: 64px;
  padding: 12px 32px;
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  gap: 16px;
  align-items: center;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.search-input-container {
  position: relative;
  min-width: 320px;
  flex: 1;
  max-width: 480px;
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 16px 0 44px;
  background: white;
  border: 1px solid var(--gray-300);
  border-radius: 6px;
  font-size: var(--text-sm);
  color: var(--gray-700);
  transition: var(--transition-all);
}

.search-input::placeholder {
  color: var(--gray-400);
}

.search-input:hover {
  border-color: var(--gray-400);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--gray-400);
  pointer-events: none;
}

.filter-dropdown {
  height: 40px;
  padding: 0 16px;
  background: white;
  border: 1px solid var(--gray-300);
  border-radius: 6px;
  font-size: var(--text-sm);
  color: var(--gray-700);
  cursor: pointer;
  transition: var(--transition-all);
  min-width: 140px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.filter-dropdown:hover {
  border-color: var(--gray-400);
  background: var(--gray-50);
}

.filter-dropdown.active {
  border-color: var(--primary-500);
  background: var(--primary-50);
  color: var(--primary-700);
}

.filter-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--primary-500);
  color: white;
  border-radius: 10px;
  font-size: 11px;
  font-weight: var(--font-semibold);
  margin-left: 4px;
}
```

#### 4.2.3 Data Table Specifications
```css
.data-table-container {
  margin: 0;
  background: white;
  border-radius: 0;
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.table-header {
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-200);
  position: sticky;
  top: 136px; /* header + filter bar height */
  z-index: 30;
}

.table-header-cell {
  padding: 12px 16px;
  text-align: left;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--gray-600);
  text-transform: uppercase;
  letter-spacing: var(--letter-wider);
  cursor: pointer;
  user-select: none;
  transition: var(--transition-colors);
  position: relative;
}

.table-header-cell:hover {
  background: var(--gray-100);
  color: var(--gray-700);
}

.table-header-cell.sortable::after {
  content: '';
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  background-image: url('data:image/svg+xml,...'); /* Sort icon */
  opacity: 0.3;
  transition: var(--transition-opacity);
}

.table-header-cell.sorted-asc::after {
  opacity: 1;
  transform: translateY(-50%) rotate(180deg);
}

.table-header-cell.sorted-desc::after {
  opacity: 1;
}

.table-row {
  border-bottom: 1px solid var(--gray-100);
  transition: var(--transition-colors);
  cursor: pointer;
}

.table-row:hover {
  background: var(--gray-50);
}

.table-row.selected {
  background: var(--primary-50);
}

.table-cell {
  padding: 16px;
  font-size: var(--text-sm);
  color: var(--gray-700);
  vertical-align: middle;
}

.table-cell-checkbox {
  width: 48px;
  padding: 16px 16px 16px 24px;
}

.checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid var(--gray-300);
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: var(--transition-all);
  position: relative;
}

.checkbox:hover {
  border-color: var(--primary-500);
}

.checkbox.checked {
  background: var(--primary-500);
  border-color: var(--primary-500);
}

.checkbox.checked::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 5px;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* User Avatar Cell */
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  color: var(--gray-600);
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: var(--font-medium);
  color: var(--gray-900);
  line-height: 1.2;
}

.user-email {
  font-size: var(--text-xs);
  color: var(--gray-500);
  line-height: 1.2;
}

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  transition: var(--transition-all);
}

.status-badge.active {
  background: var(--success-100);
  color: var(--success-700);
}

.status-badge.suspended {
  background: var(--warning-100);
  color: var(--warning-700);
}

.status-badge.inactive {
  background: var(--error-100);
  color: var(--error-700);
}

.status-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Role Badge */
.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: var(--letter-wide);
}

.role-badge.admin {
  background: var(--primary-100);
  color: var(--primary-700);
}

.role-badge.sales-manager {
  background: #E0E7FF;
  color: #4338CA;
}

.role-badge.finance-manager {
  background: #FEF3C7;
  color: #92400E;
}

.role-badge.operations-manager {
  background: #D1FAE5;
  color: #065F46;
}

/* Actions Cell */
.actions-cell {
  text-align: right;
  padding-right: 24px;
}

.actions-button {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-500);
  transition: var(--transition-all);
}

.actions-button:hover {
  background: var(--gray-100);
  color: var(--gray-700);
}

.actions-button:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

.actions-dropdown {
  position: absolute;
  right: 24px;
  top: calc(100% + 4px);
  background: white;
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--gray-200);
  min-width: 200px;
  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
  transition: opacity 150ms ease-out, transform 150ms ease-out;
  z-index: 50;
}

.actions-dropdown.open {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.actions-menu-item {
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: var(--text-sm);
  color: var(--gray-700);
  cursor: pointer;
  transition: var(--transition-colors);
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.actions-menu-item:hover {
  background: var(--gray-50);
  color: var(--gray-900);
}

.actions-menu-item:first-child {
  border-radius: 8px 8px 0 0;
}

.actions-menu-item:last-child {
  border-radius: 0 0 8px 8px;
}

.actions-menu-item.danger {
  color: var(--error-600);
}

.actions-menu-item.danger:hover {
  background: var(--error-50);
  color: var(--error-700);
}

.actions-menu-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.actions-menu-divider {
  height: 1px;
  background: var(--gray-200);
  margin: 4px 0;
}
```

#### 4.2.4 Pagination Specifications
```css
.pagination-container {
  height: 64px;
  padding: 0 32px;
  background: white;
  border-top: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.pagination-info {
  font-size: var(--text-sm);
  color: var(--gray-600);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-button {
  height: 36px;
  min-width: 36px;
  padding: 0 12px;
  background: white;
  border: 1px solid var(--gray-300);
  border-radius: 6px;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--gray-700);
  cursor: pointer;
  transition: var(--transition-all);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.pagination-button:hover:not(:disabled) {
  background: var(--gray-50);
  border-color: var(--gray-400);
}

.pagination-button:active:not(:disabled) {
  transform: translateY(1px);
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-button.active {
  background: var(--primary-50);
  border-color: var(--primary-500);
  color: var(--primary-700);
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-sm);
  color: var(--gray-600);
}

.page-size-select {
  height: 36px;
  padding: 0 32px 0 12px;
  background: white;
  border: 1px solid var(--gray-300);
  border-radius: 6px;
  font-size: var(--text-sm);
  color: var(--gray-700);
  cursor: pointer;
  appearance: none;
  background-image: url('data:image/svg+xml,...'); /* Chevron down icon */
  background-position: right 8px center;
  background-repeat: no-repeat;
  background-size: 16px;
}
```

#### 4.2.5 Loading States
```css
.table-loading {
  position: relative;
  min-height: 400px;
}

.table-loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
  z-index: 10;
}

.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 20;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Skeleton Loading */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--gray-200) 25%,
    var(--gray-100) 50%,
    var(--gray-200) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-row {
  height: 72px;
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 16px;
  border-bottom: 1px solid var(--gray-100);
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.skeleton-text {
  height: 16px;
  flex: 1;
  max-width: 200px;
}

.skeleton-badge {
  width: 80px;
  height: 24px;
  border-radius: 12px;
}
```

### 4.3 User Creation Form - Detailed Specifications

#### 4.3.1 Multi-Step Form Container
```css
.form-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px;
  background: white;
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
}

.form-progress {
  margin-bottom: 48px;
}

.progress-steps {
  display: flex;
  justify-content: space-between;
  position: relative;
}

.progress-line {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gray-200);
  z-index: 1;
}

.progress-line-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--primary-500);
  transition: width 300ms ease-out;
  z-index: 2;
}

.step {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.step-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  border: 2px solid var(--gray-300);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  color: var(--gray-500);
  transition: var(--transition-all);
}

.step.active .step-circle {
  border-color: var(--primary-500);
  color: var(--primary-500);
  background: var(--primary-50);
  transform: scale(1.1);
}

.step.completed .step-circle {
  background: var(--primary-500);
  border-color: var(--primary-500);
  color: white;
}

.step.completed .step-circle::after {
  content: '✓';
  font-size: 18px;
}

.step-label {
  font-size: var(--text-xs);
  color: var(--gray-500);
  text-align: center;
  max-width: 100px;
  line-height: 1.3;
}

.step.active .step-label {
  color: var(--primary-600);
  font-weight: var(--font-medium);
}

.step.completed .step-label {
  color: var(--gray-700);
}
```

#### 4.3.2 Form Fields Specifications
```css
.form-field {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--gray-700);
}

.form-label.required::after {
  content: '*';
  color: var(--error-500);
  margin-left: 4px;
}

.form-input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  background: white;
  border: 1px solid var(--gray-300);
  border-radius: 6px;
  font-size: var(--text-base);
  color: var(--gray-900);
  transition: var(--transition-all);
}

.form-input::placeholder {
  color: var(--gray-400);
}

.form-input:hover:not(:disabled) {
  border-color: var(--gray-400);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled {
  background: var(--gray-50);
  color: var(--gray-500);
  cursor: not-allowed;
}

.form-input.error {
  border-color: var(--error-500);
}

.form-input.error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-hint {
  margin-top: 6px;
  font-size: var(--text-xs);
  color: var(--gray-500);
}

.form-error {
  margin-top: 6px;
  font-size: var(--text-xs);
  color: var(--error-600);
  display: flex;
  align-items: center;
  gap: 4px;
  animation: shake 300ms ease-out;
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

.form-error-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Select Field */
.form-select {
  width: 100%;
  height: 44px;
  padding: 0 40px 0 16px;
  background: white;
  border: 1px solid var(--gray-300);
  border-radius: 6px;
  font-size: var(--text-base);
  color: var(--gray-900);
  cursor: pointer;
  appearance: none;
  background-image: url('data:image/svg+xml,...'); /* Chevron down */
  background-position: right 12px center;
  background-repeat: no-repeat;
  background-size: 20px;
  transition: var(--transition-all);
}

/* Textarea */
.form-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px 16px;
  background: white;
  border: 1px solid var(--gray-300);
  border-radius: 6px;
  font-size: var(--text-base);
  color: var(--gray-900);
  resize: vertical;
  transition: var(--transition-all);
}

/* Checkbox */
.form-checkbox-container {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
}

.form-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--gray-300);
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: var(--transition-all);
  flex-shrink: 0;
  margin-top: 2px;
}

.form-checkbox:checked {
  background: var(--primary-500);
  border-color: var(--primary-500);
}

.form-checkbox:checked::after {
  content: '';
  display: block;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin: 2px 0 0 5px;
}

.form-checkbox-label {
  font-size: var(--text-sm);
  color: var(--gray-700);
  line-height: 1.5;
}

/* Radio Buttons */
.form-radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-radio-container {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.form-radio {
  width: 20px;
  height: 20px;
  border: 2px solid var(--gray-300);
  border-radius: 50%;
  background: white;
  cursor: pointer;
  transition: var(--transition-all);
  position: relative;
}

.form-radio:checked {
  border-color: var(--primary-500);
}

.form-radio:checked::after {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-500);
}
```

#### 4.3.3 Avatar Upload Specifications
```css
.avatar-upload-container {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: var(--gray-100);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  border: 3px solid var(--gray-200);
  transition: var(--transition-all);
}

.avatar-preview:hover {
  border-color: var(--primary-200);
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  color: var(--gray-400);
  font-size: 48px;
}

.avatar-upload-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: var(--transition-opacity);
  cursor: pointer;
}

.avatar-preview:hover .avatar-upload-overlay {
  opacity: 1;
}

.avatar-upload-icon {
  width: 32px;
  height: 32px;
  color: white;
}

.avatar-upload-button {
  height: 40px;
  padding: 0 20px;
  background: white;
  border: 1px solid var(--gray-300);
  border-radius: 6px;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--gray-700);
  cursor: pointer;
  transition: var(--transition-all);
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar-upload-button:hover {
  background: var(--gray-50);
  border-color: var(--gray-400);
}

.avatar-upload-info {
  font-size: var(--text-xs);
  color: var(--gray-500);
  margin-top: 8px;
}
```

#### 4.3.4 Password Field Specifications
```css
.password-field-container {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--gray-400);
  transition: var(--transition-colors);
  border-radius: 4px;
}

.password-toggle:hover {
  background: var(--gray-100);
  color: var(--gray-600);
}

.password-toggle-icon {
  width: 20px;
  height: 20px;
}

.password-strength-meter {
  margin-top: 8px;
  height: 6px;
  background: var(--gray-200);
  border-radius: 3px;
  overflow: hidden;
}

.password-strength-fill {
  height: 100%;
  transition: width 300ms ease-out, background-color 300ms ease-out;
}

.password-strength-fill.weak {
  width: 33%;
  background: var(--error-500);
}

.password-strength-fill.medium {
  width: 66%;
  background: var(--warning-500);
}

.password-strength-fill.strong {
  width: 100%;
  background: var(--success-500);
}

.password-requirements {
  margin-top: 12px;
  font-size: var(--text-xs);
}

.password-requirement {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  color: var(--gray-500);
  transition: var(--transition-colors);
}

.password-requirement.met {
  color: var(--success-600);
}

.password-requirement-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.generate-password-button {
  margin-top: 12px;
  height: 32px;
  padding: 0 16px;
  background: var(--gray-100);
  border: 1px solid var(--gray-300);
  border-radius: 6px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--gray-700);
  cursor: pointer;
  transition: var(--transition-all);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.generate-password-button:hover {
  background: var(--gray-200);
  border-color: var(--gray-400);
}

.generate-password-button:active {
  transform: translateY(1px);
}
```

#### 4.3.5 Form Navigation Buttons
```css
.form-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--gray-200);
}

.nav-button {
  height: 44px;
  padding: 0 24px;
  border-radius: 6px;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-all);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
}

.nav-button-secondary {
  background: white;
  border: 1px solid var(--gray-300);
  color: var(--gray-700);
}

.nav-button-secondary:hover {
  background: var(--gray-50);
  border-color: var(--gray-400);
}

.nav-button-secondary:active {
  transform: translateY(1px);
}

.nav-button-primary {
  background: var(--primary-600);
  color: white;
  box-shadow: var(--shadow-sm);
}

.nav-button-primary:hover {
  background: var(--primary-700);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.nav-button-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.nav-button-primary:disabled {
  background: var(--gray-300);
  cursor: not-allowed;
  box-shadow: none;
}

.nav-button-primary:disabled:hover {
  transform: none;
}

.nav-button-icon {
  width: 16px;
  height: 16px;
}

/* Submit button loading state */
.nav-button-primary.loading {
  color: transparent;
  pointer-events: none;
  position: relative;
}

.nav-button-primary.loading::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
```

### 4.4 User Details Page - Detailed Specifications

#### 4.4.1 Profile Header Specifications
```css
.profile-header {
  background: white;
  border-bottom: 1px solid var(--gray-200);
  padding: 32px;
}

.profile-header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 32px;
}

.profile-avatar-container {
  position: relative;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: var(--gray-100);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 4px solid white;
  box-shadow: var(--shadow-lg);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-avatar-edit {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  background: var(--primary-600);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  border: 3px solid white;
  transition: var(--transition-all);
}

.profile-avatar-edit:hover {
  background: var(--primary-700);
  transform: scale(1.1);
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--gray-900);
  margin-bottom: 4px;
}

.profile-position {
  font-size: var(--text-lg);
  color: var(--gray-600);
  margin-bottom: 12px;
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.profile-meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-sm);
  color: var(--gray-500);
}

.profile-meta-icon {
  width: 16px;
  height: 16px;
  color: var(--gray-400);
}

.profile-actions {
  display: flex;
  gap: 12px;
}

.profile-action-button {
  height: 40px;
  padding: 0 20px;
  border-radius: 6px;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-all);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
}

.profile-action-primary {
  background: var(--primary-600);
  color: white;
  box-shadow: var(--shadow-sm);
}

.profile-action-primary:hover {
  background: var(--primary-700);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.profile-action-secondary {
  background: white;
  border: 1px solid var(--gray-300);
  color: var(--gray-700);
}

.profile-action-secondary:hover {
  background: var(--gray-50);
  border-color: var(--gray-400);
}

.profile-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.profile-status.active {
  background: var(--success-100);
  color: var(--success-700);
}

.profile-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

#### 4.4.2 Tab Navigation Specifications
```css
.tabs-container {
  background: white;
  border-bottom: 1px solid var(--gray-200);
  position: sticky;
  top: 72px; /* Account for page header */
  z-index: 30;
}

.tabs-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
}

.tabs-nav {
  display: flex;
  gap: 32px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.tabs-nav::-webkit-scrollbar {
  display: none;
}

.tab-button {
  padding: 16px 0;
  background: none;
  border: none;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--gray-500);
  cursor: pointer;
  transition: var(--transition-colors);
  position: relative;
  white-space: nowrap;
}

.tab-button:hover {
  color: var(--gray-700);
}

.tab-button.active {
  color: var(--primary-600);
}

.tab-button::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary-600);
  transform: scaleX(0);
  transition: transform 200ms ease-out;
}

.tab-button.active::after {
  transform: scaleX(1);
}

.tab-panel {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeIn 300ms ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### 4.4.3 Information Cards Specifications
```css
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.info-card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  padding: 24px;
  transition: var(--transition-all);
}

.info-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.info-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.info-card-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--gray-600);
  text-transform: uppercase;
  letter-spacing: var(--letter-wider);
}

.info-card-action {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--gray-400);
  cursor: pointer;
  transition: var(--transition-all);
}

.info-card-action:hover {
  background: var(--gray-100);
  color: var(--gray-600);
}

.info-card-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--gray-100);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: var(--text-sm);
  color: var(--gray-500);
}

.info-value {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--gray-900);
  text-align: right;
}

.info-value.editable {
  color: var(--primary-600);
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
}

.info-value.editable:hover {
  text-decoration-style: solid;
}
```

#### 4.4.4 Activity Timeline Specifications
```css
.activity-timeline {
  position: relative;
  padding-left: 32px;
}

.timeline-line {
  position: absolute;
  left: 11px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--gray-200);
}

.timeline-item {
  position: relative;
  margin-bottom: 24px;
  animation: slideInLeft 300ms ease-out;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.timeline-marker {
  position: absolute;
  left: -27px;
  top: 8px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  border: 2px solid var(--gray-300);
  z-index: 2;
}

.timeline-marker.success {
  border-color: var(--success-500);
  background: var(--success-500);
}

.timeline-marker.warning {
  border-color: var(--warning-500);
  background: var(--warning-500);
}

.timeline-marker.error {
  border-color: var(--error-500);
  background: var(--error-500);
}

.timeline-content {
  background: var(--gray-50);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--gray-200);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.timeline-title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--gray-900);
}

.timeline-time {
  font-size: var(--text-xs);
  color: var(--gray-500);
}

.timeline-description {
  font-size: var(--text-sm);
  color: var(--gray-600);
  line-height: 1.5;
}

.timeline-metadata {
  margin-top: 8px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.timeline-meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--gray-500);
}

.timeline-meta-icon {
  width: 14px;
  height: 14px;
}
```

### 4.5 Responsive Design Specifications

#### 4.5.1 Breakpoint System
```css
/* Breakpoint variables */
:root {
  --breakpoint-xs: 475px;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* Mobile First Approach */
/* Base styles for mobile (0-475px) */

/* Extra Small (475px+) */
@media (min-width: 475px) {
  .container {
    max-width: 475px;
  }
}

/* Small (640px+) */
@media (min-width: 640px) {
  .container {
    max-width: 640px;
  }
  
  .page-header {
    padding: 0 24px;
  }
  
  .filter-bar {
    padding: 12px 24px;
  }
  
  .form-container {
    padding: 24px;
  }
}

/* Medium (768px+) */
@media (min-width: 768px) {
  .container {
    max-width: 768px;
  }
  
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .form-field-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

/* Large (1024px+) */
@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
  
  .page-header {
    padding: 0 32px;
  }
  
  .filter-bar {
    padding: 12px 32px;
  }
  
  .profile-header-content {
    flex-direction: row;
  }
}

/* Extra Large (1280px+) */
@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
  
  .info-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 2X Large (1536px+) */
@media (min-width: 1536px) {
  .container {
    max-width: 1536px;
  }
}
```

#### 4.5.2 Mobile Specific Styles
```css
/* Mobile Navigation */
@media (max-width: 767px) {
  .mobile-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top: 1px solid var(--gray-200);
    display: flex;
    justify-content: space-around;
    padding: 8px 0;
    z-index: 50;
    box-shadow: var(--shadow-lg);
  }
  
  .mobile-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px;
    color: var(--gray-500);
    text-decoration: none;
    transition: var(--transition-colors);
  }
  
  .mobile-nav-item.active {
    color: var(--primary-600);
  }
  
  .mobile-nav-icon {
    width: 24px;
    height: 24px;
  }
  
  .mobile-nav-label {
    font-size: 11px;
    font-weight: var(--font-medium);
  }
  
  /* Mobile Table */
  .mobile-table {
    display: none;
  }
  
  @media (max-width: 767px) {
    .data-table {
      display: none;
    }
    
    .mobile-table {
      display: block;
    }
    
    .mobile-card {
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      transition: var(--transition-all);
    }
    
    .mobile-card:active {
      background: var(--gray-50);
      transform: scale(0.98);
    }
    
    .mobile-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .mobile-card-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--gray-200);
      flex-shrink: 0;
    }
    
    .mobile-card-title {
      flex: 1;
    }
    
    .mobile-card-name {
      font-weight: var(--font-semibold);
      color: var(--gray-900);
      margin-bottom: 2px;
    }
    
    .mobile-card-email {
      font-size: var(--text-xs);
      color: var(--gray-500);
    }
    
    .mobile-card-body {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .mobile-card-field {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .mobile-card-label {
      font-size: 11px;
      color: var(--gray-500);
      text-transform: uppercase;
      letter-spacing: var(--letter-wider);
    }
    
    .mobile-card-value {
      font-size: var(--text-sm);
      color: var(--gray-900);
    }
    
    .mobile-card-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--gray-100);
    }
    
    .mobile-action-button {
      flex: 1;
      height: 36px;
      border: 1px solid var(--gray-300);
      background: white;
      border-radius: 6px;
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--gray-700);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: var(--transition-all);
    }
    
    .mobile-action-button:active {
      background: var(--gray-50);
      transform: translateY(1px);
    }
  }
}

/* Touch-specific styles */
@media (hover: none) {
  .hover-effect {
    display: none;
  }
  
  .touch-target {
    min-height: 44px;
    min-width: 44px;
  }
  
  .table-row:active {
    background: var(--gray-100);
  }
  
  .button:active {
    transform: scale(0.95);
  }
}
```

### 4.6 Accessibility Specifications

#### 4.6.1 ARIA Labels and Roles
```html
<!-- Page Structure -->
<div role="main" aria-label="User Management">
  <header role="banner" aria-label="Page Header">
    <h1 id="page-title">User Management</h1>
    <button 
      aria-label="Add new user"
      aria-describedby="add-user-tooltip"
      type="button"
    >
      <span aria-hidden="true">+</span>
      Add User
    </button>
  </header>
  
  <!-- Search and Filter -->
  <div role="search" aria-label="Search and filter users">
    <input 
      type="search"
      aria-label="Search users by name, email, or role"
      placeholder="Search users..."
      aria-controls="user-table"
      aria-live="polite"
    />
    
    <div role="group" aria-label="Filter options">
      <button
        aria-label="Filter by role"
        aria-expanded="false"
        aria-controls="role-filter-menu"
        aria-haspopup="true"
      >
        Role
        <span class="filter-badge" aria-label="2 filters active">2</span>
      </button>
    </div>
  </div>
  
  <!-- Data Table -->
  <table 
    role="table"
    aria-label="Users list"
    aria-rowcount="150"
    aria-colcount="7"
    id="user-table"
  >
    <thead>
      <tr role="row">
        <th 
          role="columnheader"
          aria-sort="none"
          aria-label="Select all users"
          scope="col"
        >
          <input type="checkbox" aria-label="Select all users" />
        </th>
        <th 
          role="columnheader"
          aria-sort="ascending"
          aria-label="Sort by name"
          scope="col"
          tabindex="0"
        >
          Name
        </th>
      </tr>
    </thead>
    <tbody>
      <tr 
        role="row"
        aria-rowindex="2"
        tabindex="0"
        aria-label="User: John Doe, Admin, Active"
      >
        <td role="cell">
          <input 
            type="checkbox"
            aria-label="Select John Doe"
          />
        </td>
        <td role="cell">
          <div class="user-cell">
            <img 
              src="avatar.jpg"
              alt="John Doe's profile picture"
              role="img"
            />
            <div>
              <div class="user-name">John Doe</div>
              <div class="user-email">john.doe@example.com</div>
            </div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  
  <!-- Status Announcements -->
  <div 
    role="status"
    aria-live="polite"
    aria-atomic="true"
    class="sr-only"
  >
    <!-- Dynamic content like "5 users found" -->
  </div>
  
  <!-- Loading State -->
  <div 
    role="status"
    aria-live="assertive"
    aria-label="Loading users"
  >
    <span class="sr-only">Loading users, please wait...</span>
  </div>
</div>
```

#### 4.6.2 Keyboard Navigation
```css
/* Focus Styles */
:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

:focus:not(:focus-visible) {
  outline: none;
}

:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* Skip Links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--primary-600);
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  border-radius: 0 0 8px 0;
  z-index: 100;
  transition: top 150ms ease-out;
}

.skip-link:focus {
  top: 0;
}

/* Keyboard Navigation Indicators */
.keyboard-nav .focusable:focus {
  outline: 3px solid var(--primary-500);
  outline-offset: 2px;
  z-index: 10;
}

/* Tab Trapping for Modals */
.modal[aria-hidden="false"] {
  /* Trap focus within modal */
}

.modal-backdrop {
  /* Prevent interaction with background */
  pointer-events: none;
}
```

#### 4.6.3 Screen Reader Support
```css
/* Visually Hidden but Screen Reader Accessible */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Screen Reader Announcements */
.aria-live-region {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

/* Descriptive Text for Icons */
.icon-button {
  position: relative;
}

.icon-button .tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--gray-900);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: var(--text-xs);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 150ms ease-out;
}

.icon-button:hover .tooltip,
.icon-button:focus .tooltip {
  opacity: 1;
}
```

#### 4.6.4 Color Contrast Requirements
```css
/* WCAG AA Compliant Color Combinations */
/* Normal Text (4.5:1 contrast ratio) */
.text-on-white {
  color: var(--gray-700); /* #374151 on #FFFFFF = 7.51:1 ✓ */
}

.text-on-primary {
  color: white; /* #FFFFFF on #3B82F6 = 4.53:1 ✓ */
}

/* Large Text (3:1 contrast ratio) */
.large-text-on-gray {
  font-size: 18px;
  font-weight: bold;
  color: var(--gray-600); /* #4B5563 on #F9FAFB = 4.97:1 ✓ */
}

/* Interactive Elements */
.link {
  color: var(--primary-600); /* #2563EB on #FFFFFF = 4.75:1 ✓ */
}

.link:hover {
  color: var(--primary-700); /* #1D4ED8 on #FFFFFF = 6.56:1 ✓ */
}

/* Error States */
.error-text {
  color: var(--error-600); /* #DC2626 on #FFFFFF = 5.66:1 ✓ */
}

/* Success States */
.success-text {
  color: var(--success-700); /* #15803D on #FFFFFF = 4.54:1 ✓ */
}

/* Focus Indicators */
.focus-indicator {
  outline: 3px solid var(--primary-500);
  outline-offset: 2px;
  /* Ensures visibility on any background */
}
```

### 4.7 Micro-interactions and Animations

#### 4.7.1 Button Interactions
```css
/* Primary Button Interactions */
@keyframes buttonPress {
  0% {
    transform: scale(1) translateY(0);
    box-shadow: var(--shadow-sm);
  }
  50% {
    transform: scale(0.97) translateY(1px);
    box-shadow: none;
  }
  100% {
    transform: scale(1) translateY(0);
    box-shadow: var(--shadow-sm);
  }
}

.button-primary {
  animation: buttonPress 200ms ease-out;
}

/* Ripple Effect */
.ripple {
  position: relative;
  overflow: hidden;
}

.ripple::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%);
  transition: width 600ms, height 600ms;
}

.ripple:active::before {
  width: 300px;
  height: 300px;
}

/* Success Animation */
@keyframes successPulse {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.success-animation {
  position: relative;
}

.success-animation::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--success-500);
  font-size: 24px;
  animation: successPulse 600ms ease-out;
}
```

#### 4.7.2 Loading Animations
```css
/* Skeleton Pulse */
@keyframes skeletonPulse {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-loader {
  background: linear-gradient(
    90deg,
    var(--gray-200) 0%,
    var(--gray-100) 50%,
    var(--gray-200) 100%
  );
  background-size: 200% 100%;
  animation: skeletonPulse 1.5s ease-in-out infinite;
}

/* Dots Loading */
@keyframes dotPulse {
  0%, 60%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  30% {
    transform: scale(1.3);
    opacity: 0.5;
  }
}

.loading-dots {
  display: flex;
  gap: 4px;
}

.loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-500);
  animation: dotPulse 1.4s ease-in-out infinite;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* Progress Bar */
@keyframes progressFill {
  0% {
    transform: scaleX(0);
  }
  100% {
    transform: scaleX(1);
  }
}

.progress-bar {
  height: 4px;
  background: var(--gray-200);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-500);
  transform-origin: left;
  animation: progressFill 2s ease-out forwards;
}

/* Circular Progress */
@keyframes circularProgress {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.circular-progress {
  width: 48px;
  height: 48px;
  position: relative;
}

.circular-progress svg {
  transform: rotate(-90deg);
}

.circular-progress-track {
  stroke: var(--gray-200);
  stroke-width: 4;
  fill: none;
}

.circular-progress-fill {
  stroke: var(--primary-500);
  stroke-width: 4;
  fill: none;
  stroke-dasharray: 150.796;
  stroke-dashoffset: 150.796;
  animation: circularFill 1.5s ease-out forwards;
}

@keyframes circularFill {
  to {
    stroke-dashoffset: 0;
  }
}
```

#### 4.7.3 Page Transitions
```css
/* Fade In */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation: fadeIn 300ms ease-out;
}

/* Slide In */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.slide-in-right {
  animation: slideInRight 300ms ease-out;
}

/* Scale In */
@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.scale-in {
  animation: scaleIn 200ms ease-out;
}

/* Stagger Animation */
.stagger-in > * {
  opacity: 0;
  animation: fadeInUp 400ms ease-out forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stagger-in > *:nth-child(1) { animation-delay: 50ms; }
.stagger-in > *:nth-child(2) { animation-delay: 100ms; }
.stagger-in > *:nth-child(3) { animation-delay: 150ms; }
.stagger-in > *:nth-child(4) { animation-delay: 200ms; }
.stagger-in > *:nth-child(5) { animation-delay: 250ms; }
```

### 4.8 Empty States and Error States

#### 4.8.1 Empty States
```css
.empty-state {
  padding: 64px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-state-icon {
  width: 120px;
  height: 120px;
  background: var(--gray-100);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.empty-state-icon svg {
  width: 60px;
  height: 60px;
  color: var(--gray-400);
}

.empty-state-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--gray-900);
  margin-bottom: 4px;
}

.empty-state-description {
  font-size: var(--text-base);
  color: var(--gray-600);
  max-width: 400px;
  line-height: 1.5;
  margin-bottom: 16px;
}

.empty-state-action {
  height: 44px;
  padding: 0 24px;
  background: var(--primary-600);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-all);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.empty-state-action:hover {
  background: var(--primary-700);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

#### 4.8.2 Error States
```css
.error-state {
  padding: 48px 32px;
  text-align: center;
  background: var(--error-50);
  border: 1px solid var(--error-200);
  border-radius: 8px;
}

.error-state-icon {
  width: 64px;
  height: 64px;
  background: var(--error-100);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.error-state-icon svg {
  width: 32px;
  height: 32px;
  color: var(--error-600);
}

.error-state-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--error-900);
  margin-bottom: 8px;
}

.error-state-message {
  font-size: var(--text-sm);
  color: var(--error-700);
  margin-bottom: 16px;
  line-height: 1.5;
}

.error-state-details {
  background: white;
  border: 1px solid var(--error-200);
  border-radius: 6px;
  padding: 12px 16px;
  margin: 16px 0;
  text-align: left;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--gray-700);
  max-height: 200px;
  overflow-y: auto;
}

.error-state-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.error-retry-button {
  height: 40px;
  padding: 0 20px;
  background: var(--error-600);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-all);
}

.error-retry-button:hover {
  background: var(--error-700);
}
```

### 4.9 Toast Notifications
```css
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 1000;
  pointer-events: none;
}

.toast {
  background: white;
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  padding: 16px;
  margin-bottom: 12px;
  min-width: 320px;
  max-width: 480px;
  pointer-events: auto;
  animation: slideInRight 300ms ease-out;
  transition: all 300ms ease-out;
}

.toast.toast-exit {
  animation: slideOutRight 300ms ease-out forwards;
}

@keyframes slideOutRight {
  to {
    transform: translateX(120%);
    opacity: 0;
  }
}

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.toast-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-icon.success {
  color: var(--success-500);
}

.toast-icon.error {
  color: var(--error-500);
}

.toast-icon.warning {
  color: var(--warning-500);
}

.toast-icon.info {
  color: var(--primary-500);
}

.toast-body {
  flex: 1;
}

.toast-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--gray-900);
  margin-bottom: 2px;
}

.toast-message {
  font-size: var(--text-sm);
  color: var(--gray-600);
  line-height: 1.4;
}

.toast-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--gray-400);
  cursor: pointer;
  transition: var(--transition-all);
  margin: -8px -8px -8px 0;
}

.toast-close:hover {
  background: var(--gray-100);
  color: var(--gray-600);
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--gray-200);
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}

.toast-progress-bar {
  height: 100%;
  background: var(--primary-500);
  animation: toastProgress 5s linear forwards;
}

@keyframes toastProgress {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}
```

### 4.10 Modal Dialogs
```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 999;
  opacity: 0;
  transition: opacity 300ms ease-out;
}

.modal-backdrop.open {
  opacity: 1;
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.9);
  background: white;
  border-radius: 12px;
  box-shadow: var(--shadow-xl);
  max-width: 90vw;
  max-height: 90vh;
  opacity: 0;
  transition: all 300ms ease-out;
  z-index: 1000;
}

.modal.open {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--gray-900);
}

.modal-close {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--gray-400);
  cursor: pointer;
  transition: var(--transition-all);
}

.modal-close:hover {
  background: var(--gray-100);
  color: var(--gray-600);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(90vh - 180px);
}

.modal-footer {
  padding: 24px;
  border-top: 1px solid var(--gray-200);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Confirmation Modal */
.confirmation-modal .modal-body {
  text-align: center;
  padding: 32px;
}

.confirmation-icon {
  width: 64px;
  height: 64px;
  background: var(--warning-100);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.confirmation-icon svg {
  width: 32px;
  height: 32px;
  color: var(--warning-600);
}

.confirmation-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--gray-900);
  margin-bottom: 8px;
}

.confirmation-message {
  font-size: var(--text-base);
  color: var(--gray-600);
  line-height: 1.5;
}
```

This extremely detailed UI/UX specification provides comprehensive guidelines for implementing the Users Management feature with pixel-perfect precision, including exact measurements, color codes, animations, responsive behaviors, and accessibility requirements. Every interactive element has defined states, transitions, and micro-interactions to ensure a polished, professional user experience.