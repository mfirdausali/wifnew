# Users Management - Design System Specification

## Overview
This document defines the complete design system for the Users Management feature, including colors, typography, spacing, grid system, and all foundational design tokens.

## Table of Contents
1. [Color Palette](#color-palette)
2. [Typography System](#typography-system)
3. [Spacing System](#spacing-system)
4. [Grid System](#grid-system)
5. [Breakpoints](#breakpoints)
6. [Shadows](#shadows)
7. [Border Radius](#border-radius)
8. [Z-Index Scale](#z-index-scale)
9. [Motion & Animation](#motion--animation)
10. [Design Tokens](#design-tokens)

---

## 1. Color Palette

### 1.1 Brand Colors

```css
/* Primary Colors */
--color-primary-50: #eff6ff;   /* Lightest blue */
--color-primary-100: #dbeafe;
--color-primary-200: #bfdbfe;
--color-primary-300: #93c5fd;
--color-primary-400: #60a5fa;
--color-primary-500: #3b82f6;  /* Main brand blue */
--color-primary-600: #2563eb;
--color-primary-700: #1d4ed8;
--color-primary-800: #1e40af;
--color-primary-900: #1e3a8a;
--color-primary-950: #172554;  /* Darkest blue */

/* Secondary Colors */
--color-secondary-50: #f8fafc;
--color-secondary-100: #f1f5f9;
--color-secondary-200: #e2e8f0;
--color-secondary-300: #cbd5e1;
--color-secondary-400: #94a3b8;
--color-secondary-500: #64748b;
--color-secondary-600: #475569;
--color-secondary-700: #334155;
--color-secondary-800: #1e293b;
--color-secondary-900: #0f172a;
--color-secondary-950: #020617;
```

### 1.2 Semantic Colors

```css
/* Success */
--color-success-50: #f0fdf4;
--color-success-100: #dcfce7;
--color-success-200: #bbf7d0;
--color-success-300: #86efac;
--color-success-400: #4ade80;
--color-success-500: #22c55e;
--color-success-600: #16a34a;
--color-success-700: #15803d;
--color-success-800: #166534;
--color-success-900: #14532d;

/* Warning */
--color-warning-50: #fffbeb;
--color-warning-100: #fef3c7;
--color-warning-200: #fde68a;
--color-warning-300: #fcd34d;
--color-warning-400: #fbbf24;
--color-warning-500: #f59e0b;
--color-warning-600: #d97706;
--color-warning-700: #b45309;
--color-warning-800: #92400e;
--color-warning-900: #78350f;

/* Danger/Error */
--color-danger-50: #fef2f2;
--color-danger-100: #fee2e2;
--color-danger-200: #fecaca;
--color-danger-300: #fca5a5;
--color-danger-400: #f87171;
--color-danger-500: #ef4444;
--color-danger-600: #dc2626;
--color-danger-700: #b91c1c;
--color-danger-800: #991b1b;
--color-danger-900: #7f1d1d;

/* Info */
--color-info-50: #f0f9ff;
--color-info-100: #e0f2fe;
--color-info-200: #bae6fd;
--color-info-300: #7dd3fc;
--color-info-400: #38bdf8;
--color-info-500: #0ea5e9;
--color-info-600: #0284c7;
--color-info-700: #0369a1;
--color-info-800: #075985;
--color-info-900: #0c4a6e;
```

### 1.3 Neutral Colors

```css
/* Gray Scale */
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-300: #d1d5db;
--color-gray-400: #9ca3af;
--color-gray-500: #6b7280;
--color-gray-600: #4b5563;
--color-gray-700: #374151;
--color-gray-800: #1f2937;
--color-gray-900: #111827;
--color-gray-950: #030712;

/* Background Colors */
--color-bg-primary: #ffffff;
--color-bg-secondary: #f9fafb;
--color-bg-tertiary: #f3f4f6;
--color-bg-inverse: #111827;

/* Text Colors */
--color-text-primary: #111827;
--color-text-secondary: #6b7280;
--color-text-tertiary: #9ca3af;
--color-text-inverse: #ffffff;
--color-text-link: #2563eb;
--color-text-link-hover: #1d4ed8;
```

### 1.4 Role-Specific Colors

```css
/* Role Colors */
--color-role-admin: #7c3aed;        /* Purple */
--color-role-sales: #2563eb;        /* Blue */
--color-role-finance: #059669;      /* Green */
--color-role-operations: #ea580c;   /* Orange */

/* Access Level Colors */
--color-access-1: #6b7280;  /* Gray - Basic */
--color-access-2: #3b82f6;  /* Blue - Standard */
--color-access-3: #10b981;  /* Green - Enhanced */
--color-access-4: #8b5cf6;  /* Purple - Manager */
--color-access-5: #ef4444;  /* Red - Executive */
```

### 1.5 Dark Mode Colors

```css
/* Dark Mode Palette */
@media (prefers-color-scheme: dark) {
  :root {
    /* Backgrounds */
    --color-bg-primary: #0f172a;
    --color-bg-secondary: #1e293b;
    --color-bg-tertiary: #334155;
    --color-bg-inverse: #f9fafb;
    
    /* Text */
    --color-text-primary: #f9fafb;
    --color-text-secondary: #cbd5e1;
    --color-text-tertiary: #94a3b8;
    --color-text-inverse: #0f172a;
    
    /* Adjust semantic colors for dark mode */
    --color-primary-500: #60a5fa;
    --color-success-500: #4ade80;
    --color-warning-500: #fbbf24;
    --color-danger-500: #f87171;
  }
}
```

---

## 2. Typography System

### 2.1 Font Families

```css
/* Font Stacks */
--font-family-sans: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-family-mono: 'JetBrains Mono', Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;

/* Font Loading */
@font-face {
  font-family: 'Inter';
  font-weight: 100 900;
  font-display: swap;
  font-style: normal;
  src: url('/fonts/inter-var.woff2') format('woff2-variations');
}

@font-face {
  font-family: 'JetBrains Mono';
  font-weight: 400;
  font-display: swap;
  font-style: normal;
  src: url('/fonts/jetbrains-mono-regular.woff2') format('woff2');
}
```

### 2.2 Type Scale

```css
/* Font Sizes */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */
--text-6xl: 3.75rem;     /* 60px */
--text-7xl: 4.5rem;      /* 72px */
--text-8xl: 6rem;        /* 96px */
--text-9xl: 8rem;        /* 128px */

/* Line Heights */
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;

/* Font Weights */
--font-thin: 100;
--font-extralight: 200;
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
--font-black: 900;

/* Letter Spacing */
--tracking-tighter: -0.05em;
--tracking-tight: -0.025em;
--tracking-normal: 0;
--tracking-wide: 0.025em;
--tracking-wider: 0.05em;
--tracking-widest: 0.1em;
```

### 2.3 Typography Components

```css
/* Headings */
.heading-1 {
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

.heading-2 {
  font-size: var(--text-4xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

.heading-3 {
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
}

.heading-4 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
}

.heading-5 {
  font-size: var(--text-xl);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
}

.heading-6 {
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
}

/* Body Text */
.body-large {
  font-size: var(--text-lg);
  font-weight: var(--font-normal);
  line-height: var(--leading-relaxed);
}

.body-regular {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
}

.body-small {
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
}

/* Labels & Captions */
.label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-wide);
}

.caption {
  font-size: var(--text-xs);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--color-text-secondary);
}

/* Code */
.code {
  font-family: var(--font-family-mono);
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  background-color: var(--color-gray-100);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}
```

---

## 3. Spacing System

### 3.1 Base Spacing Scale

```css
/* Spacing Scale (4px base) */
--space-0: 0;           /* 0px */
--space-px: 1px;        /* 1px */
--space-0.5: 0.125rem;  /* 2px */
--space-1: 0.25rem;     /* 4px */
--space-1.5: 0.375rem;  /* 6px */
--space-2: 0.5rem;      /* 8px */
--space-2.5: 0.625rem;  /* 10px */
--space-3: 0.75rem;     /* 12px */
--space-3.5: 0.875rem;  /* 14px */
--space-4: 1rem;        /* 16px */
--space-5: 1.25rem;     /* 20px */
--space-6: 1.5rem;      /* 24px */
--space-7: 1.75rem;     /* 28px */
--space-8: 2rem;        /* 32px */
--space-9: 2.25rem;     /* 36px */
--space-10: 2.5rem;     /* 40px */
--space-11: 2.75rem;    /* 44px */
--space-12: 3rem;       /* 48px */
--space-14: 3.5rem;     /* 56px */
--space-16: 4rem;       /* 64px */
--space-20: 5rem;       /* 80px */
--space-24: 6rem;       /* 96px */
--space-28: 7rem;       /* 112px */
--space-32: 8rem;       /* 128px */
--space-36: 9rem;       /* 144px */
--space-40: 10rem;      /* 160px */
--space-44: 11rem;      /* 176px */
--space-48: 12rem;      /* 192px */
--space-52: 13rem;      /* 208px */
--space-56: 14rem;      /* 224px */
--space-60: 15rem;      /* 240px */
--space-64: 16rem;      /* 256px */
--space-72: 18rem;      /* 288px */
--space-80: 20rem;      /* 320px */
--space-96: 24rem;      /* 384px */
```

### 3.2 Component Spacing

```css
/* Component Padding */
--padding-button-sm: var(--space-2) var(--space-3);
--padding-button-md: var(--space-2.5) var(--space-4);
--padding-button-lg: var(--space-3) var(--space-5);

--padding-input-sm: var(--space-2) var(--space-3);
--padding-input-md: var(--space-2.5) var(--space-3.5);
--padding-input-lg: var(--space-3) var(--space-4);

--padding-card: var(--space-6);
--padding-modal: var(--space-8);
--padding-section: var(--space-12) var(--space-6);

/* Component Margins */
--margin-form-group: var(--space-6);
--margin-section: var(--space-12);
--margin-page: var(--space-16);

/* Component Gaps */
--gap-form-fields: var(--space-4);
--gap-button-group: var(--space-2);
--gap-card-grid: var(--space-6);
--gap-nav-items: var(--space-1);
```

---

## 4. Grid System

### 4.1 Grid Configuration

```css
/* Grid System */
--grid-columns: 12;
--grid-gutter: var(--space-6);
--grid-margin: var(--space-6);

/* Container Widths */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;

/* Grid CSS */
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--grid-margin);
  padding-right: var(--grid-margin);
}

@media (min-width: 640px) {
  .container { max-width: var(--container-sm); }
}

@media (min-width: 768px) {
  .container { max-width: var(--container-md); }
}

@media (min-width: 1024px) {
  .container { max-width: var(--container-lg); }
}

@media (min-width: 1280px) {
  .container { max-width: var(--container-xl); }
}

@media (min-width: 1536px) {
  .container { max-width: var(--container-2xl); }
}

/* Grid Row */
.grid {
  display: grid;
  gap: var(--grid-gutter);
}

/* Column Spans */
.col-span-1 { grid-column: span 1 / span 1; }
.col-span-2 { grid-column: span 2 / span 2; }
.col-span-3 { grid-column: span 3 / span 3; }
.col-span-4 { grid-column: span 4 / span 4; }
.col-span-5 { grid-column: span 5 / span 5; }
.col-span-6 { grid-column: span 6 / span 6; }
.col-span-7 { grid-column: span 7 / span 7; }
.col-span-8 { grid-column: span 8 / span 8; }
.col-span-9 { grid-column: span 9 / span 9; }
.col-span-10 { grid-column: span 10 / span 10; }
.col-span-11 { grid-column: span 11 / span 11; }
.col-span-12 { grid-column: span 12 / span 12; }
```

### 4.2 Layout Patterns

```css
/* Common Layout Patterns */
.layout-sidebar {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-8);
}

.layout-two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--grid-gutter);
}

.layout-three-column {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--grid-gutter);
}

.layout-form {
  display: grid;
  gap: var(--gap-form-fields);
}

.layout-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--gap-card-grid);
}
```

---

## 5. Breakpoints

### 5.1 Breakpoint Values

```css
/* Breakpoints */
--breakpoint-xs: 475px;   /* Extra small devices */
--breakpoint-sm: 640px;   /* Small devices */
--breakpoint-md: 768px;   /* Medium devices */
--breakpoint-lg: 1024px;  /* Large devices */
--breakpoint-xl: 1280px;  /* Extra large devices */
--breakpoint-2xl: 1536px; /* 2X large devices */

/* Media Query Mixins */
@custom-media --xs-up (min-width: 475px);
@custom-media --sm-up (min-width: 640px);
@custom-media --md-up (min-width: 768px);
@custom-media --lg-up (min-width: 1024px);
@custom-media --xl-up (min-width: 1280px);
@custom-media --2xl-up (min-width: 1536px);

@custom-media --xs-down (max-width: 474px);
@custom-media --sm-down (max-width: 639px);
@custom-media --md-down (max-width: 767px);
@custom-media --lg-down (max-width: 1023px);
@custom-media --xl-down (max-width: 1279px);
@custom-media --2xl-down (max-width: 1535px);

/* Range queries */
@custom-media --sm-only (min-width: 640px) and (max-width: 767px);
@custom-media --md-only (min-width: 768px) and (max-width: 1023px);
@custom-media --lg-only (min-width: 1024px) and (max-width: 1279px);
```

### 5.2 Responsive Utilities

```css
/* Responsive Display */
@media (--sm-down) {
  .sm\:hidden { display: none !important; }
  .sm\:block { display: block !important; }
}

@media (--md-up) {
  .md\:hidden { display: none !important; }
  .md\:block { display: block !important; }
  .md\:flex { display: flex !important; }
  .md\:grid { display: grid !important; }
}

/* Responsive Grid */
@media (--md-up) {
  .md\:col-span-6 { grid-column: span 6 / span 6; }
  .md\:col-span-4 { grid-column: span 4 / span 4; }
  .md\:col-span-8 { grid-column: span 8 / span 8; }
}

@media (--lg-up) {
  .lg\:col-span-3 { grid-column: span 3 / span 3; }
  .lg\:col-span-9 { grid-column: span 9 / span 9; }
}
```

---

## 6. Shadows

### 6.1 Shadow Scale

```css
/* Shadow Scale */
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
--shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
--shadow-none: 0 0 #0000;

/* Colored Shadows */
--shadow-primary: 0 4px 6px -1px rgb(59 130 246 / 0.1), 0 2px 4px -2px rgb(59 130 246 / 0.1);
--shadow-success: 0 4px 6px -1px rgb(34 197 94 / 0.1), 0 2px 4px -2px rgb(34 197 94 / 0.1);
--shadow-danger: 0 4px 6px -1px rgb(239 68 68 / 0.1), 0 2px 4px -2px rgb(239 68 68 / 0.1);

/* Component Shadows */
--shadow-button: var(--shadow-sm);
--shadow-button-hover: var(--shadow-md);
--shadow-card: var(--shadow-md);
--shadow-card-hover: var(--shadow-lg);
--shadow-dropdown: var(--shadow-lg);
--shadow-modal: var(--shadow-2xl);
--shadow-toast: var(--shadow-xl);
```

### 6.2 Elevation System

```css
/* Elevation Levels */
.elevation-0 { box-shadow: var(--shadow-none); }
.elevation-1 { box-shadow: var(--shadow-xs); }
.elevation-2 { box-shadow: var(--shadow-sm); }
.elevation-3 { box-shadow: var(--shadow-md); }
.elevation-4 { box-shadow: var(--shadow-lg); }
.elevation-5 { box-shadow: var(--shadow-xl); }
.elevation-6 { box-shadow: var(--shadow-2xl); }

/* Interactive Elevation */
.elevation-interactive {
  box-shadow: var(--shadow-sm);
  transition: box-shadow 200ms ease;
}

.elevation-interactive:hover {
  box-shadow: var(--shadow-md);
}

.elevation-interactive:active {
  box-shadow: var(--shadow-xs);
}
```

---

## 7. Border Radius

### 7.1 Radius Scale

```css
/* Border Radius Scale */
--radius-none: 0;
--radius-sm: 0.125rem;    /* 2px */
--radius-md: 0.25rem;     /* 4px */
--radius-lg: 0.375rem;    /* 6px */
--radius-xl: 0.5rem;      /* 8px */
--radius-2xl: 0.75rem;    /* 12px */
--radius-3xl: 1rem;       /* 16px */
--radius-full: 9999px;

/* Component Radius */
--radius-button: var(--radius-lg);
--radius-input: var(--radius-lg);
--radius-card: var(--radius-xl);
--radius-modal: var(--radius-2xl);
--radius-badge: var(--radius-full);
--radius-avatar: var(--radius-full);
--radius-tooltip: var(--radius-lg);
```

### 7.2 Border Styles

```css
/* Border Width */
--border-0: 0;
--border-1: 1px;
--border-2: 2px;
--border-4: 4px;
--border-8: 8px;

/* Border Colors */
--border-color-default: var(--color-gray-200);
--border-color-hover: var(--color-gray-300);
--border-color-focus: var(--color-primary-500);
--border-color-error: var(--color-danger-500);
--border-color-success: var(--color-success-500);

/* Component Borders */
.border-default {
  border: var(--border-1) solid var(--border-color-default);
}

.border-interactive {
  border: var(--border-1) solid var(--border-color-default);
  transition: border-color 200ms ease;
}

.border-interactive:hover {
  border-color: var(--border-color-hover);
}

.border-interactive:focus {
  border-color: var(--border-color-focus);
  outline: none;
  box-shadow: .box--shadow-focus;
}
```

---

## 8. Z-Index Scale

### 8.1 Z-Index Values

```css
/* Z-Index Scale */
--z-0: 0;
--z-10: 10;       /* Base content */
--z-20: 20;       /* Hover states */
--z-30: 30;       /* Fixed headers */
--z-40: 40;       /* Dropdowns */
--z-50: 50;       /* Tooltips */
--z-60: 60;       /* Modals */
--z-70: 70;       /* Notifications */
--z-80: 80;       /* Command palette */
--z-90: 90;       /* Critical alerts */
--z-max: 9999;    /* Development tools */

/* Component Z-Index */
--z-dropdown: var(--z-40);
--z-sticky: var(--z-30);
--z-fixed: var(--z-30);
--z-modal-backdrop: var(--z-60);
--z-modal: var(--z-60);
--z-popover: var(--z-50);
--z-tooltip: var(--z-50);
--z-notification: var(--z-70);
```

---

## 9. Motion & Animation

### 9.1 Duration Scale

```css
/* Duration Scale */
--duration-75: 75ms;
--duration-100: 100ms;
--duration-150: 150ms;
--duration-200: 200ms;
--duration-300: 300ms;
--duration-500: 500ms;
--duration-700: 700ms;
--duration-1000: 1000ms;

/* Component Durations */
--duration-fade: var(--duration-200);
--duration-collapse: var(--duration-300);
--duration-modal: var(--duration-300);
--duration-tooltip: var(--duration-150);
```

### 9.2 Easing Functions

```css
/* Easing Functions */
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Component Easings */
--ease-default: var(--ease-out);
--ease-modal: var(--ease-out);
--ease-collapse: var(--ease-in-out);
--ease-spring: var(--ease-bounce);
```

### 9.3 Transitions

```css
/* Transition Utilities */
.transition-none {
  transition-property: none;
}

.transition-all {
  transition-property: all;
  transition-timing-function: var(--ease-default);
  transition-duration: var(--duration-200);
}

.transition-colors {
  transition-property: color, background-color, border-color, fill, stroke;
  transition-timing-function: var(--ease-default);
  transition-duration: var(--duration-200);
}

.transition-opacity {
  transition-property: opacity;
  transition-timing-function: var(--ease-default);
  transition-duration: var(--duration-200);
}

.transition-transform {
  transition-property: transform;
  transition-timing-function: var(--ease-default);
  transition-duration: var(--duration-200);
}

/* Component Transitions */
.transition-button {
  transition-property: color, background-color, border-color, box-shadow, transform;
  transition-duration: var(--duration-200);
  transition-timing-function: var(--ease-out);
}

.transition-input {
  transition-property: border-color, box-shadow, background-color;
  transition-duration: var(--duration-200);
  transition-timing-function: var(--ease-out);
}
```

---

## 10. Design Tokens

### 10.1 CSS Custom Properties Structure

```css
/* Token Organization */
:root {
  /* 1. Primitive Tokens (Raw values) */
  --primitive-blue-500: #3b82f6;
  --primitive-gray-200: #e5e7eb;
  --primitive-space-4: 1rem;
  
  /* 2. Semantic Tokens (Purpose-based) */
  --semantic-background-primary: var(--primitive-white);
  --semantic-text-primary: var(--primitive-gray-900);
  --semantic-border-default: var(--primitive-gray-200);
  
  /* 3. Component Tokens (Component-specific) */
  --button-background-primary: var(--semantic-primary);
  --button-text-primary: var(--semantic-text-inverse);
  --input-border-default: var(--semantic-border-default);
}
```

### 10.2 Token Export for JavaScript

```javascript
// design-tokens.js
export const tokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    // ... other colors
  },
  
  spacing: {
    0: '0',
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    // ... other spacing
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      // ... other sizes
    },
  },
  
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    // ... other shadows
  },
  
  animation: {
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      // ... other durations
    },
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      // ... other easings
    },
  },
};
```

### 10.3 Tailwind Configuration

```javascript
// tailwind.config.js
import { tokens } from './design-tokens';

export default {
  theme: {
    extend: {
      colors: tokens.colors,
      spacing: tokens.spacing,
      fontFamily: tokens.typography.fontFamily,
      fontSize: tokens.typography.fontSize,
      boxShadow: tokens.shadows,
      transitionDuration: tokens.animation.duration,
      transitionTimingFunction: tokens.animation.easing,
    },
  },
};
```

### 10.4 Component Token Example

```css
/* Button Component Tokens */
.button {
  /* Base tokens */
  --button-font-family: var(--font-family-sans);
  --button-font-weight: var(--font-medium);
  --button-border-radius: var(--radius-button);
  --button-transition: var(--transition-button);
  
  /* Size variants */
  --button-height-sm: 32px;
  --button-height-md: 40px;
  --button-height-lg: 48px;
  
  --button-padding-sm: var(--space-2) var(--space-3);
  --button-padding-md: var(--space-2.5) var(--space-4);
  --button-padding-lg: var(--space-3) var(--space-5);
  
  --button-font-size-sm: var(--text-sm);
  --button-font-size-md: var(--text-base);
  --button-font-size-lg: var(--text-lg);
  
  /* Color variants */
  --button-primary-bg: var(--color-primary-600);
  --button-primary-bg-hover: var(--color-primary-700);
  --button-primary-bg-active: var(--color-primary-800);
  --button-primary-text: var(--color-white);
  
  --button-secondary-bg: var(--color-gray-100);
  --button-secondary-bg-hover: var(--color-gray-200);
  --button-secondary-bg-active: var(--color-gray-300);
  --button-secondary-text: var(--color-gray-700);
  
  /* State tokens */
  --button-disabled-opacity: 0.5;
  --button-focus-ring-width: 2px;
  --button-focus-ring-color: var(--color-primary-500);
  --button-focus-ring-offset: 2px;
}
```

## Design System Usage Guidelines

### 1. Color Usage
- Use semantic colors for UI elements (success, danger, warning)
- Maintain WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Use color consistently across similar elements

### 2. Typography
- Use the type scale consistently
- Limit font weights to maintain hierarchy
- Ensure readable line lengths (45-75 characters)

### 3. Spacing
- Use spacing scale for all margins and paddings
- Maintain consistent spacing between related elements
- Use larger spacing to separate distinct sections

### 4. Responsive Design
- Design mobile-first
- Test at all breakpoints
- Ensure touch targets are at least 44x44px on mobile

### 5. Motion
- Keep animations under 400ms for UI feedback
- Use ease-out for enter animations
- Use ease-in for exit animations
- Respect prefers-reduced-motion

This design system provides a comprehensive foundation for building consistent, accessible, and beautiful user interfaces for the Users Management feature.