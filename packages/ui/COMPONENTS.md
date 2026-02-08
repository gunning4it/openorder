# OpenOrder UI Component Library

## Component Checklist

✅ **Button** - Primary, secondary, outline, ghost, destructive, success variants with loading states
✅ **Input** - Text input with label, error states, helper text, and icon support
✅ **Textarea** - Multi-line input with character counter
✅ **Card** - Container with header/content/footer sections
✅ **Dialog** - Modal wrapper using Radix Dialog with animations
✅ **Select** - Dropdown using Radix Select with keyboard navigation
✅ **Spinner** - Loading indicator with size and color variants + overlay
✅ **Badge** - Status tags/labels with semantic color variants
✅ **FormField** - Form field wrapper with label + error display

## Design System Compliance

### ✅ Base 8 Spacing System
All components use multiples of 8px for spacing:
- `gap-2` (8px) - Small spacing
- `p-4` (16px) - Standard padding
- `gap-6` (24px) - Section spacing
- `p-8` (32px) - Container padding

### ✅ Semantic Color System
- **Neutrals (60%):** gray-50 to gray-900 for backgrounds
- **Primary (30%):** Brand color via CSS variable `--brand-color`
- **Accent (10%):** Success (green), Error (red), Warning (amber), Info (blue)

### ✅ Interactive States
All interactive components include:
1. **Default** - Base resting state
2. **Hover** - Subtle color shift + optional lift
3. **Active** - Scale down + darker color for tactile feedback
4. **Focus** - Visible ring for keyboard navigation (WCAG AA)

### ✅ Accessibility
- ✅ WCAG AA contrast ratios (4.5:1 minimum)
- ✅ Semantic HTML (`<button>`, `<label>`, proper headings)
- ✅ Keyboard navigation support (Tab, Enter, Escape)
- ✅ Focus states with visible rings
- ✅ ARIA labels and descriptions
- ✅ Screen reader support
- ✅ Dark mode compatible

### ✅ Typography
- **H1:** `text-4xl` / `text-5xl` + `font-bold` + `leading-tight`
- **H2:** `text-2xl` / `text-3xl` + `font-semibold` + `leading-tight`
- **H3:** `text-xl` + `font-semibold`
- **Body:** `text-base` (16px) / `text-sm` (14px) + `leading-relaxed`
- **Small:** `text-sm` (14px) + `text-gray-600`

### ✅ Transitions
All interactive elements use: `transition-all duration-200 ease-in-out`

## Component Variants

### Button Variants
- `primary` - Brand colored, main CTAs (default)
- `secondary` - Gray with border, secondary actions
- `outline` - Transparent with brand border
- `ghost` - Transparent, minimal emphasis
- `destructive` - Red for delete/remove actions
- `success` - Green for positive actions

### Button Sizes
- `sm` - Compact (px-4 py-2 text-xs)
- `md` - Default (px-4 py-2 text-sm)
- `lg` - Large (px-6 py-3 text-base)
- `xl` - Extra large (px-8 py-4 text-lg)
- `icon` - Square icon button (p-2)

### Badge Variants
- `default` - Gray neutral
- `primary` - Brand colored
- `success` - Green for positive states
- `error` - Red for errors/unavailable
- `warning` - Amber for warnings
- `info` - Blue for informational
- `outline` - Transparent with border

### Dialog Sizes
- `sm` - max-w-sm (384px)
- `md` - max-w-md (448px) [default]
- `lg` - max-w-lg (512px)
- `xl` - max-w-xl (576px)
- `full` - Full width with margin

### Spinner Variants
- `default` / `primary` - Brand colored
- `secondary` - Gray
- `white` - For dark backgrounds

### Spinner Sizes
- `sm` - 16px (h-4 w-4)
- `md` - 24px (h-6 w-6) [default]
- `lg` - 32px (h-8 w-8)
- `xl` - 48px (h-12 w-12)

## Files Created

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── button.tsx       # Button with CVA variants
│   │   ├── input.tsx        # Input with label/error/icons
│   │   ├── textarea.tsx     # Textarea with character counter
│   │   ├── card.tsx         # Card with subcomponents
│   │   ├── dialog.tsx       # Radix Dialog wrapper
│   │   ├── select.tsx       # Radix Select wrapper
│   │   ├── spinner.tsx      # Loading spinner + overlay
│   │   ├── badge.tsx        # Status badges
│   │   └── form-field.tsx   # Form field wrapper
│   ├── lib/
│   │   └── utils.ts         # cn() utility
│   └── index.ts             # Export all components
├── tailwind.config.js       # Design tokens
├── README.md                # Component documentation
├── COMPONENTS.md            # This file
└── package.json             # Dependencies
```

## Dependencies

### Production
- `react` + `react-dom` (^18.3.1)
- `@radix-ui/react-dialog` (^1.1.15)
- `@radix-ui/react-select` (^2.2.6)
- `@radix-ui/react-slot` (^1.2.4)
- `class-variance-authority` (^0.7.1) - CVA for variants
- `clsx` (^2.1.1) - Conditional classes
- `tailwind-merge` (^2.6.1) - Merge Tailwind classes

### Dev Dependencies
- `typescript` (^5.4.5)
- `tailwindcss` (^3.4.3)
- `@types/react` + `@types/react-dom`

## Usage Example

```tsx
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '@openorder/ui';

function MenuItemCard({ item }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card hoverable onClick={() => setIsModalOpen(true)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{item.name}</CardTitle>
            {!item.isAvailable && <Badge variant="error">Sold Out</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <img src={item.imageUrl} alt={item.name} className="rounded-md" />
          <p className="text-sm text-gray-600 mt-2">{item.description}</p>
        </CardContent>
        <CardFooter>
          <span className="text-lg font-semibold">${(item.price / 100).toFixed(2)}</span>
          <Button variant="primary" fullWidth>
            Add to Cart
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{item.name}</DialogTitle>
          </DialogHeader>
          {/* Item details and modifiers */}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

## Testing Checklist

✅ All components compile with TypeScript (zero errors)
✅ All components pass ESLint (zero warnings)
✅ All components export proper TypeScript types
✅ All components include AGPL-3.0 license headers
✅ All components use Base 8 spacing system
✅ All interactive components have hover/active/focus states
✅ All components support dark mode
✅ All components use semantic HTML
✅ All form components have proper label associations
✅ All components use Tailwind with `cn()` utility
✅ All components forward refs correctly
✅ All components have displayName set

## Next Steps (Phase 1)

These components will be used to build:
1. **Dashboard** - Menu editor, category management, modifier builder
2. **Storefront** - Menu display, item detail modal, cart sidebar
3. **Widget** - Embeddable ordering widget

All UI follows the same design system for consistency across apps.
