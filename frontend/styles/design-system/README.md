# Design System

This design system provides a comprehensive set of design tokens and utilities for building consistent user interfaces.

## Structure

- **tokens.css** - All CSS custom properties (design tokens) including colors, typography, spacing, etc.
- **base.css** - Base element styles and resets
- **utilities.css** - Reusable utility classes based on design tokens

## Usage

### CSS Variables

All design tokens are available as CSS custom properties:

```css
/* Colors */
.my-component {
  color: var(--color-primary-500);
  background-color: var(--color-bg-primary);
}

/* Typography */
.my-heading {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
}

/* Spacing */
.my-container {
  padding: var(--space-4);
  margin-bottom: var(--space-8);
}

/* Shadows */
.my-card {
  box-shadow: var(--shadow-md);
}
```

### Utility Classes

Pre-built utility classes are available for common patterns:

```html
<!-- Typography -->
<h1 class="heading-1">Main Title</h1>
<p class="body-regular">Regular paragraph text</p>
<span class="caption">Small caption text</span>

<!-- Colors -->
<div class="text-primary bg-secondary">Colored text and background</div>

<!-- Spacing -->
<div class="p-4 m-2">Padding and margin utilities</div>

<!-- Elevation -->
<div class="elevation-3">Card with shadow</div>
<div class="elevation-interactive">Interactive card with hover effect</div>

<!-- Transitions -->
<button class="transition-button">Smooth button transitions</button>
```

### Tailwind Integration

The design system is fully integrated with Tailwind CSS. All tokens are available as Tailwind utilities:

```html
<!-- Using Tailwind with design tokens -->
<div class="bg-primary-500 text-white p-4 rounded-lg shadow-md">
  <h2 class="text-2xl font-semibold">Tailwind + Design System</h2>
  <p class="text-gray-100 mt-2">Seamless integration</p>
</div>
```

### JavaScript/TypeScript Usage

Import design tokens in your JavaScript/TypeScript files:

```typescript
import { tokens, getRoleColor, getSemanticColor } from '@/lib/design-tokens'

// Access token values
const primaryColor = tokens.colors.primary[500]
const largeSpacing = tokens.spacing[8]

// Use helper functions
const adminColor = getRoleColor('admin')
const errorColor = getSemanticColor('danger', 600)
```

## Dark Mode

The design system supports dark mode automatically. Use the `.dark` class on the root element or rely on system preferences:

```html
<!-- Manual dark mode toggle -->
<html class="dark">
  <!-- Content automatically uses dark mode colors -->
</html>
```

## Responsive Design

Use responsive utilities with breakpoint prefixes:

```html
<div class="text-base md:text-lg lg:text-xl">
  Responsive text sizing
</div>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  Responsive grid layout
</div>
```

## Component Examples

### Button
```html
<button class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors focus-ring">
  Primary Button
</button>
```

### Card
```html
<div class="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
  <h3 class="heading-4 mb-2">Card Title</h3>
  <p class="body-regular text-gray-600">Card content goes here</p>
</div>
```

### Form Input
```html
<div class="space-y-2">
  <label class="label" for="email">Email Address</label>
  <input
    type="email"
    id="email"
    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
    placeholder="Enter your email"
  />
</div>
```

## Accessibility

The design system includes:
- Focus ring utilities for keyboard navigation
- Sufficient color contrast ratios
- Screen reader only text utility (`.sr-only`)
- Reduced motion support

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS custom properties are required
- Fallbacks included for older browsers where possible