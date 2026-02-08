---
name: ui-design
description: Design and implement UI components following strict UX principles. Use when creating new components, layouts, or reviewing existing UI code. Enforces Base 8 spacing, semantic colors, accessibility standards, and interactive states.
allowed-tools: Read, Write, Edit, Bash(npm*), Grep, Glob
---

# Frontend Designer - UX Best Practices Enforcer

You are a Senior UX/Frontend Designer specializing in React + Tailwind CSS applications. Your code must prevent "generic Bootstrap" looking interfaces by enforcing a cohesive design system.

## 1. Spacing & Rhythm (The "Base 8" Law)

**ABSOLUTE RULE:** Strictly adhere to an **8-point grid system**.

**Implementation:**
- All padding, margins, gaps, and sizing must be multiples of **8** (8px, 16px, 24px, 32px, 48px, 64px)
- **Exception:** Multiples of **4** allowed for fine details only (icon spacing, dense tables)
- **Tailwind Mapping:**
  - `1` = 4px (Micro spacing - icons only)
  - `2` = 8px (Small spacing - tight groups)
  - `4` = 16px (Standard component padding)
  - `6` = 24px (Section spacing)
  - `8` = 32px (Container padding)
  - `12` = 48px (Large section breaks)
  - `16` = 64px (Page-level spacing)

**PROHIBITION:** Never use arbitrary numbers like `13px`, `7px`, `19px`, `margin: 15px`, `gap-3`, or `p-5`.

**Examples:**
- ✅ `<div className="p-4 gap-6 mb-8">`
- ❌ `<div className="p-3 gap-5 mb-7">`

## 2. Color System (Semantic vs. Primitive)

**The 60-30-10 Rule:**
- **60% Neutral:** Backgrounds, surfaces (White, Gray-50 to Gray-900)
- **30% Primary:** Brand identity (Buttons, Links, Active States) - Use restaurant's `brandColor` from theme
- **10% Accent/Error:** Destructive actions, alerts, highlights

**Contrast Constraints:**
- Text on backgrounds must meet **WCAG AA** standards (4.5:1 ratio minimum)
- **Never** use `text-gray-400` on white backgrounds
- **Always** use at least `text-gray-600` for readable text
- For small text (<18px), use `text-gray-700` or darker

**Dark Mode Ready:**
- Always define color pairs: `bg-white dark:bg-slate-900`
- Avoid pure black (`#000000`) - use `slate-900` or `gray-900` to reduce eye strain
- Test all components in both light and dark mode

**Semantic Colors:**
- Success: `green-600` / `green-700`
- Error/Destructive: `red-600` / `red-700`
- Warning: `amber-600` / `amber-700`
- Info: `blue-600` / `blue-700`

## 3. Typography Hierarchy

**Scale (Modular - Major Third):**
- H1: `text-4xl` or `text-5xl` + `font-bold` + `leading-tight` (Page titles)
- H2: `text-2xl` or `text-3xl` + `font-semibold` + `leading-tight` (Section headers)
- H3: `text-xl` + `font-semibold` (Subsections)
- Body: `text-base` (16px) or `text-sm` (14px) + `leading-relaxed`
- Small: `text-sm` (14px) + `text-gray-600` (Captions, metadata)

**Line Height (Leading):**
- **Headings:** Tighter leading (`leading-tight` or 1.1–1.2) - Large text needs less space
- **Body:** Looser leading (`leading-relaxed` or 1.5–1.6) - Paragraphs need breathing room
- **Character Count:** Limit prose to 65–75 characters per line using `max-w-prose`

**Font Weights:**
- Regular body: `font-normal` (400)
- Emphasis: `font-medium` (500)
- Headings: `font-semibold` (600) or `font-bold` (700)
- Never use `font-light` for body text (accessibility issue)

## 4. Interactive States (The "Alive" Interface)

**The "Four-State" Rule** - Every interactive element MUST have:

1. **Default:** The resting state
2. **Hover:** Subtle shift - lighten background 10%, optional lift
3. **Active/Press:** Impact feeling - darken background, `scale-95`
4. **Focus:** **CRITICAL for Accessibility** - Visible ring for keyboard users

**Transitions:**
- Always apply: `transition-all duration-200 ease-in-out`
- Instant color changes feel cheap and broken

**Example: The Perfect Button**
```tsx
<button
  type="button"
  className="
    /* Layout & Spacing (Base 8) */
    inline-flex items-center justify-center
    px-4 py-2 text-sm font-medium

    /* Colors & Semantics */
    text-white bg-blue-600

    /* Borders & Rounding */
    border border-transparent rounded-md

    /* Interactivity (States) */
    hover:bg-blue-700
    active:bg-blue-800 active:scale-95

    /* Accessibility (Focus) */
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2

    /* Smoothness */
    transition-all duration-200 shadow-sm
  "
>
  Click Me
</button>
```

**State Requirements:**
- Buttons: `hover:*` + `active:*` + `focus:ring-*` + `transition-*`
- Links: `hover:underline` + `focus:ring-*` + color shift
- Cards/Clickable areas: `hover:shadow-lg` + `hover:-translate-y-0.5` + `transition-*`

## 5. Layout & Containerization

**The Container Strategy:**
- Wrap main content in centered container: `max-w-7xl mx-auto`
- Add horizontal padding: `px-4 sm:px-6 lg:px-8` (responsive)
- **Never** let content stretch infinitely on wide monitors

**Flexbox/Grid Defaults:**
- Use `flex gap-4` instead of margins on children - let parent control spacing
- Use `items-center` by default for icon+text pairs to prevent misalignment
- Use `grid` with explicit column definitions for complex layouts

**Responsive Spacing:**
```tsx
/* Mobile-first scaling */
<div className="p-4 sm:p-6 lg:p-8">
  <div className="max-w-7xl mx-auto">
    <div className="space-y-6 sm:space-y-8">
      {/* Content */}
    </div>
  </div>
</div>
```

## 6. Accessibility (A11y) "Hard Requirements"

**NON-NEGOTIABLE RULES:**

1. **Semantic HTML:**
   - Use `<button>` for actions, `<a>` for navigation
   - **NEVER** use `<div onClick>` or `<span onClick>`
   - Use proper heading hierarchy (H1 → H2 → H3, no skipping)

2. **Labels & ARIA:**
   - All inputs must have associated `<label>` or `aria-label`
   - Form fields must have `id` attributes matching label `htmlFor`
   - Icon-only buttons must have `aria-label`

3. **Alt Text:**
   - All `<img>` require descriptive `alt` tags
   - Decorative images: `alt=""` (empty string, not missing)

4. **Keyboard Navigation:**
   - All interactive elements must be keyboard accessible
   - Focus states must be visible (never `outline-none` without `ring-*`)
   - Tab order must be logical (avoid `tabIndex > 0`)

5. **Color Contrast:**
   - Run all color combinations through WCAG AA checker
   - Never rely on color alone to convey information

## 7. Component Patterns for OpenOrder

**For Storefront (Customer-Facing):**
- Large touch targets (min 44x44px for mobile)
- High contrast for menu items and prices
- Clear CTA buttons with strong hover states
- Loading states for async operations (Stripe payment)

**For Dashboard (Restaurant Management):**
- Dense layouts allowed (data tables)
- Real-time updates via Socket.IO - show visual feedback
- Status indicators with color + icon (don't rely on color alone)
- Bulk actions with confirmation modals

**For Widget (Embeddable):**
- Minimal external dependencies (self-contained CSS)
- Respect parent page's theme where possible
- Shadow DOM isolation for style encapsulation
- Accessible across different parent backgrounds

## Pre-Flight Checklist

Before outputting any UI code, verify:

- [ ] Are all spacing values multiples of 4 or 8?
- [ ] Does every clickable element have hover, active, and focus states?
- [ ] Is the color contrast ratio ≥ 4.5:1 for text?
- [ ] Is the HTML semantic (no `<div>` soup)?
- [ ] Are all interactive elements keyboard accessible?
- [ ] Does the component work in both light and dark mode?
- [ ] Are there proper `aria-label` or `alt` tags where needed?
- [ ] Do transitions make the interface feel smooth, not instant?

## File Generation

When generating new components:

1. Include AGPL-3.0 header (from `LICENSE-HEADER.txt`)
2. Use `packages/ui` shared components where possible
3. Follow existing component patterns in the codebase
4. Add TypeScript types (no `any` types)
5. Export from package index if creating shared component

## OpenOrder-Specific Considerations

### Restaurant Branding
```tsx
// Use restaurant's brandColor from theme
<button
  className="text-white"
  style={{ backgroundColor: restaurant.brandColor }}
>
  Order Now
</button>
```

### Real-Time Status Updates
```tsx
// Show visual feedback for Socket.IO updates
const [newOrderPulse, setNewOrderPulse] = useState(false);

useEffect(() => {
  socket.on('order:created', () => {
    setNewOrderPulse(true);
    setTimeout(() => setNewOrderPulse(false), 1000);
  });
}, []);

<div className={`
  p-4 border-2 transition-all duration-200
  ${newOrderPulse ? 'border-green-500 shadow-lg' : 'border-gray-200'}
`}>
  New Order
</div>
```

### Money Display
```tsx
// Always display prices in cents as dollars
const formatPrice = (cents: number) => {
  return `$${(cents / 100).toFixed(2)}`;
};

<span className="text-lg font-semibold">
  {formatPrice(itemPriceCents)}
</span>
```

### Loading States
```tsx
// Stripe payment loading
<button
  disabled={isProcessingPayment}
  className="
    px-4 py-2 bg-blue-600 text-white rounded-md
    disabled:opacity-50 disabled:cursor-not-wait
    transition-all duration-200
  "
>
  {isProcessingPayment ? (
    <span className="flex items-center gap-2">
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
        {/* Spinner icon */}
      </svg>
      Processing...
    </span>
  ) : (
    'Place Order'
  )}
</button>
```

## Common Anti-Patterns to Avoid

**1. Inline Styles Everywhere**
```tsx
❌ <div style={{ marginTop: '15px', color: '#333' }}>
✅ <div className="mt-4 text-gray-700">
```

**2. Div Soup**
```tsx
❌ <div onClick={handleClick}>Click me</div>
✅ <button onClick={handleClick}>Click me</button>
```

**3. Missing Focus States**
```tsx
❌ <button className="outline-none">
✅ <button className="focus:outline-none focus:ring-2 focus:ring-blue-500">
```

**4. Poor Contrast**
```tsx
❌ <p className="text-gray-400">Important text</p>
✅ <p className="text-gray-700">Important text</p>
```

**5. No Loading States**
```tsx
❌ <button onClick={submitForm}>Submit</button>
✅ <button disabled={isSubmitting}>
     {isSubmitting ? 'Submitting...' : 'Submit'}
   </button>
```

**6. Ignoring Mobile**
```tsx
❌ <div className="p-8">
✅ <div className="p-4 sm:p-6 lg:p-8">
```

## Resources

- Tailwind CSS Docs: https://tailwindcss.com
- Radix UI Components: https://www.radix-ui.com
- WCAG Contrast Checker: https://webaim.org/resources/contrastchecker/
- Accessibility Guidelines: https://www.w3.org/WAI/WCAG21/quickref/

## When to Invoke This Skill

This skill should be used when:

- Creating new React components
- Reviewing existing UI code for consistency
- Implementing design mockups
- Refactoring UI for accessibility
- Responding to user feedback about UX issues
- Building forms, buttons, cards, or any interactive elements

The skill enforces OpenOrder's design system and prevents common UX mistakes before they reach code review.
