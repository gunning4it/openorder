# @openorder/ui

Shared UI component library for OpenOrder, built with React, Radix UI primitives, and Tailwind CSS.

## Design Principles

This component library follows strict UX best practices:

### Base 8 Spacing System
All spacing values are multiples of 8px (8, 16, 24, 32, 48, 64px) for visual consistency:
- `gap-2` = 8px - Small spacing for tight groups
- `p-4` = 16px - Standard component padding
- `gap-6` = 24px - Section spacing
- `p-8` = 32px - Container padding
- `gap-12` = 48px - Large section breaks

### Semantic Color System
- **60% Neutral:** Backgrounds and surfaces (gray-50 to gray-900)
- **30% Primary:** Brand identity via `--brand-color` CSS variable
- **10% Accent:** Success (green), Error (red), Warning (amber), Info (blue)

### Accessibility Requirements
- ✅ **WCAG AA compliance** - 4.5:1 contrast ratio minimum
- ✅ **Semantic HTML** - Proper use of `<button>`, `<label>`, `<input>`
- ✅ **Keyboard navigation** - All interactive elements accessible via Tab
- ✅ **Focus states** - Visible focus rings for keyboard users
- ✅ **ARIA labels** - Screen reader support for all components
- ✅ **Dark mode** - All components support light and dark themes

### Interactive States
Every interactive element has four states:
1. **Default** - Resting state
2. **Hover** - Subtle color shift and optional lift
3. **Active/Press** - Scale down with darker color for tactile feedback
4. **Focus** - Visible ring for keyboard navigation

## Components

### Button
Primary, secondary, outline, ghost, destructive, and success variants with loading states.

```tsx
import { Button } from '@openorder/ui';

// Primary button
<Button variant="primary" size="md">
  Click me
</Button>

// With loading state
<Button isLoading>
  Submitting...
</Button>

// With icons
<Button
  leftIcon={<IconPlus />}
  variant="success"
>
  Add Item
</Button>
```

### Input
Text input with label, error states, helper text, and icon support.

```tsx
import { Input } from '@openorder/ui';

<Input
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  error={errors.email?.message}
  helperText="We'll never share your email"
  required
/>

// With icons
<Input
  label="Search"
  leftIcon={<IconSearch />}
  placeholder="Search menu items..."
/>
```

### Textarea
Multi-line text input with character counter.

```tsx
import { Textarea } from '@openorder/ui';

<Textarea
  label="Special Instructions"
  placeholder="Add any special requests..."
  maxLength={500}
  showCounter
  rows={4}
/>
```

### Card
Container component with header, content, and footer sections.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@openorder/ui';

<Card hoverable>
  <CardHeader>
    <CardTitle>Menu Item</CardTitle>
    <CardDescription>Delicious dish description</CardDescription>
  </CardHeader>
  <CardContent>
    <img src="/item.jpg" alt="Menu item" />
  </CardContent>
  <CardFooter>
    <Button>Add to Cart</Button>
  </CardFooter>
</Card>
```

### Dialog
Modal dialog using Radix UI with animation support.

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@openorder/ui';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent size="lg">
    <DialogHeader>
      <DialogTitle>Confirm Order</DialogTitle>
      <DialogDescription>
        Review your order before checkout
      </DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Select
Dropdown select using Radix UI with proper keyboard navigation.

```tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@openorder/ui';

<Select value={category} onValueChange={setCategory}>
  <SelectTrigger>
    <SelectValue placeholder="Select category" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="appetizers">Appetizers</SelectItem>
    <SelectItem value="entrees">Entrees</SelectItem>
    <SelectItem value="desserts">Desserts</SelectItem>
  </SelectContent>
</Select>
```

### Spinner
Loading indicator with size and color variants.

```tsx
import { Spinner, SpinnerOverlay } from '@openorder/ui';

// Inline spinner
<Spinner size="md" variant="primary" />

// Full-page overlay
<SpinnerOverlay show={isLoading} text="Loading menu..." />
```

### Badge
Status tags and labels with semantic color variants.

```tsx
import { Badge } from '@openorder/ui';

<Badge variant="success">Available</Badge>
<Badge variant="error">Out of Stock</Badge>
<Badge variant="warning" dot>Preparing</Badge>

// With icons
<Badge
  variant="info"
  leftIcon={<IconClock />}
>
  20 min
</Badge>
```

### FormField
Wrapper for form inputs with consistent label and error handling.

```tsx
import { FormField } from '@openorder/ui';

<FormField
  label="Restaurant Name"
  error={errors.name?.message}
  required
>
  <input {...register('name')} />
</FormField>
```

## Utility Functions

### cn (Class Name Utility)
Merge Tailwind classes with proper precedence using `clsx` and `tailwind-merge`.

```tsx
import { cn } from '@openorder/ui';

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  className
)}>
  Content
</div>
```

## Tailwind Configuration

The package includes a Tailwind config with OpenOrder design tokens:

```js
// packages/ui/tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand-color, #2563eb)',
          // 50-900 scale
        },
        success: { DEFAULT: '#16a34a', light: '#22c55e', dark: '#15803d' },
        error: { DEFAULT: '#dc2626', light: '#ef4444', dark: '#b91c1c' },
        warning: { DEFAULT: '#d97706', light: '#f59e0b', dark: '#b45309' },
        info: { DEFAULT: '#2563eb', light: '#3b82f6', dark: '#1d4ed8' },
      },
      // Base 8 spacing, typography scale, shadows, animations
    },
  },
};
```

## Restaurant Branding

Set the restaurant's brand color via CSS variable:

```css
:root {
  --brand-color: #ff6b35; /* Restaurant's primary color */
}
```

All components using `brand` colors will automatically adapt.

## Dark Mode

All components support dark mode via the `dark:` variant:

```tsx
// Enable dark mode by adding 'dark' class to root element
<html className="dark">
  <body>
    <Button>Works in dark mode!</Button>
  </body>
</html>
```

## TypeScript Support

All components are fully typed with TypeScript:

```tsx
import type { ButtonProps, InputProps } from '@openorder/ui';

const MyButton: React.FC<ButtonProps> = (props) => {
  return <Button {...props} />;
};
```

## License

AGPL-3.0 - See LICENSE file for details.

Copyright (C) 2026 Josh Gunning

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
