# Design Tokens Reference

This document outlines the design token system implemented in the Loan App Admin interface. All tokens are defined as CSS custom properties for consistency and maintainability.

## Color Tokens

Color tokens use HSL values for better theming support:

```css
--color-background: hsl(0 0% 100%)
--color-foreground: hsl(222.2 84% 4.9%)
--color-primary: hsl(222.2 47.4% 11.2%)
--color-secondary: hsl(210 40% 96.1%)
--color-muted: hsl(210 40% 96.1%)
--color-accent: hsl(210 40% 96.1%)
--color-destructive: hsl(0 84.2% 60.2%)
--color-border: hsl(214.3 31.8% 91.4%)
--color-input: hsl(214.3 31.8% 91.4%)
--color-ring: hsl(222.2 84% 4.9%)
```

## Spacing Tokens

Consistent spacing scale based on rem units:

| Token | Value | Pixels (16px base) | Usage |
|-------|-------|-------------------|--------|
| `--space-0` | 0 | 0px | No spacing |
| `--space-px` | 1px | 1px | Hairline spacing |
| `--space-0_5` | 0.125rem | 2px | Minimal spacing |
| `--space-1` | 0.25rem | 4px | Tight spacing |
| `--space-1_5` | 0.375rem | 6px | Small spacing |
| `--space-2` | 0.5rem | 8px | Small padding/gap |
| `--space-3` | 0.75rem | 12px | Medium padding |
| `--space-4` | 1rem | 16px | Default spacing |
| `--space-6` | 1.5rem | 24px | Large padding |
| `--space-8` | 2rem | 32px | Extra large spacing |
| `--space-12` | 3rem | 48px | Section spacing |
| `--space-16` | 4rem | 64px | Major section spacing |

### Semantic Spacing (Tailwind classes)

- `space-xs`: `var(--space-2)` - Extra small
- `space-sm`: `var(--space-3)` - Small
- `space-md`: `var(--space-4)` - Medium (default)
- `space-lg`: `var(--space-6)` - Large
- `space-xl`: `var(--space-8)` - Extra large
- `space-2xl`: `var(--space-12)` - 2X large
- `space-3xl`: `var(--space-16)` - 3X large

## Typography Tokens

### Font Size

| Token | Value | Usage |
|-------|-------|--------|
| `--font-size-xs` | 0.75rem | Small labels, helper text |
| `--font-size-sm` | 0.875rem | Default body text |
| `--font-size-base` | 1rem | Base font size |
| `--font-size-lg` | 1.125rem | Emphasized text |
| `--font-size-xl` | 1.25rem | Small headings |
| `--font-size-2xl` | 1.5rem | Section headings |
| `--font-size-3xl` | 1.875rem | Page headings |
| `--font-size-4xl` | 2.25rem | Major headings |
| `--font-size-5xl` | 3rem | Display text |

### Line Height

| Token | Value | Usage |
|-------|-------|--------|
| `--line-height-none` | 1 | No line height |
| `--line-height-tight` | 1.25 | Headings |
| `--line-height-snug` | 1.375 | Compact text |
| `--line-height-normal` | 1.5 | Body text (default) |
| `--line-height-relaxed` | 1.625 | Readable text |
| `--line-height-loose` | 2 | Spacious text |

### Font Weight

| Token | Value | Usage |
|-------|-------|--------|
| `--font-weight-normal` | 400 | Body text |
| `--font-weight-medium` | 500 | Buttons, labels |
| `--font-weight-semibold` | 600 | Headings |
| `--font-weight-bold` | 700 | Emphasis |

## Size Tokens

Component sizing tokens for consistent dimensions:

| Token | Value | Pixels | Usage |
|-------|-------|--------|--------|
| `--size-8` | 2rem | 32px | Extra small components |
| `--size-9` | 2.25rem | 36px | Small components |
| `--size-10` | 2.5rem | 40px | Default component height |
| `--size-11` | 2.75rem | 44px | Large components |
| `--size-12` | 3rem | 48px | Extra large components |

### Semantic Sizes (Tailwind classes)

- `size-xs`: `var(--size-8)` - Extra small
- `size-sm`: `var(--size-9)` - Small
- `size-md`: `var(--size-10)` - Medium (default)
- `size-lg`: `var(--size-11)` - Large
- `size-xl`: `var(--size-12)` - Extra large

## Border Radius Tokens

| Token | Value | Usage |
|-------|-------|--------|
| `--radius-xs` | 0.125rem | Subtle rounding |
| `--radius-sm` | 0.25rem | Small elements |
| `--radius-md` | 0.375rem | Default radius |
| `--radius-lg` | 0.5rem | Cards, containers |
| `--radius-xl` | 0.75rem | Large containers |
| `--radius-2xl` | 1rem | Extra large containers |
| `--radius-full` | 9999px | Pills, circles |

## Animation Tokens

### Duration

| Token | Value | Usage |
|-------|-------|--------|
| `--duration-75` | 75ms | Micro interactions |
| `--duration-100` | 100ms | Quick transitions |
| `--duration-150` | 150ms | Fast transitions |
| `--duration-200` | 200ms | Default transitions |
| `--duration-300` | 300ms | Smooth transitions |
| `--duration-500` | 500ms | Slow transitions |

### Easing

| Token | Value | Usage |
|-------|-------|--------|
| `--ease-linear` | linear | Constant speed |
| `--ease-in` | cubic-bezier(0.4, 0, 1, 1) | Accelerate |
| `--ease-out` | cubic-bezier(0, 0, 0.2, 1) | Decelerate |
| `--ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) | Natural motion |

## Component Implementation

### Button Component Example

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-md)] text-[var(--font-size-sm)] font-[var(--font-weight-medium)] transition-colors duration-[var(--duration-200)]",
  {
    variants: {
      size: {
        default: "h-[var(--size-10)] px-[var(--space-4)] py-[var(--space-2)]",
        sm: "h-[var(--size-9)] px-[var(--space-3)]",
        lg: "h-[var(--size-11)] px-[var(--space-8)]",
      }
    }
  }
)
```

### Input Component Example

```tsx
<input
  className="h-[var(--size-10)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-md)] text-[var(--font-size-base)] transition-colors duration-[var(--duration-200)]"
/>
```

### Card Component Example

```tsx
<div className="rounded-[var(--radius-lg)] p-[var(--space-6)]">
  <h2 className="text-[var(--font-size-2xl)] font-[var(--font-weight-semibold)]">
    Card Title
  </h2>
  <p className="text-[var(--font-size-sm)] text-muted-foreground">
    Card description
  </p>
</div>
```

## Best Practices

1. **Always use tokens instead of hardcoded values**
   - ❌ `p-6` → ✅ `p-[var(--space-6)]`
   - ❌ `text-sm` → ✅ `text-[var(--font-size-sm)]`
   - ❌ `rounded-md` → ✅ `rounded-[var(--radius-md)]`

2. **Use semantic tokens when available**
   - Prefer `size-md` over `h-[var(--size-10)]` for component sizing
   - Use `space-lg` instead of `p-[var(--space-6)]` for semantic spacing

3. **Maintain consistency across components**
   - All interactive elements should use the same transition duration
   - Similar components should share size and spacing patterns

4. **Use CVA for complex component variants**
   - Define base styles with tokens
   - Create consistent variant patterns
   - Export variant types for TypeScript support

5. **Document token usage in components**
   - Add comments explaining why specific tokens were chosen
   - Document any exceptions to the token system

## Migration Guide

When refactoring existing components to use design tokens:

1. Identify all hardcoded values (spacing, sizes, colors, etc.)
2. Map hardcoded values to appropriate tokens
3. Replace inline classes with token references
4. Test component appearance in both light and dark modes
5. Update component documentation

### Recommended Mappings

| Old Value | Semantic Utility | When to Use |
|-----------|-----------------|-------------|
| `p-6` | `p-space-lg` | Component padding |
| `px-3` | `px-space-sm` | Horizontal padding |
| `text-sm` | `text-text-sm` | Body text |
| `text-2xl` | `text-text-2xl` | Headings |
| `h-10` | `h-size-md` | Input/button height |
| `rounded-md` | `rounded-md` | Keep as-is (standard) |
| `gap-2` | `gap-space-xs` | Small gaps |

## Dark Mode Support

All color tokens automatically adjust for dark mode through the `.dark` class. Components using these tokens will seamlessly support theme switching without additional code.

## Future Enhancements

- [ ] Add responsive token variants
- [ ] Create token validation tools
- [ ] Build Storybook documentation
- [ ] Implement design token linting
- [ ] Add token migration scripts
- [ ] Create visual token reference page