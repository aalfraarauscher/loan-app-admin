


## 🧹 Design Token Cleanup & Migration Instructions

As part of simplifying our design system, we're reducing reliance on unused or overengineered design tokens and leaning more on Tailwind + shadcn/ui conventions.

Please follow the steps below to audit and clean up the current tokens.

---

### 1. Identify Unused Tokens

Search across the codebase for usage of each token defined in `@theme` or `:root`. Prioritize:

- `--space-*`
- `--font-size-*`
- `--size-*`
- `--duration-*`
- `--radius-*`

Mark any token that:
- Has **zero usage across the codebase**
- Is **used only once** and can be replaced with Tailwind utility classes

---

### 2. Remove Orphaned Tokens

Once unused tokens are identified:
- Remove them from `index.css` under `@theme` and `:root`
- Clean up corresponding Tailwind config entries if any (e.g. `transitionDuration`, `borderRadius`)

---

### 3. Prefer Tailwind Utilities or `cva` Variants

When replacing tokens:
- Use Tailwind utility classes directly (e.g. `p-4`, `text-lg`, `rounded-md`)
- Or define component variants using `class-variance-authority` (cva), as is common in `shadcn/ui`

Avoid defining custom utilities unless necessary.

---

### 4. Stick to Essential Tokens

Retain and consolidate tokens for:
- Core color tokens (primary, secondary, background, etc.)
- Dark mode theming
- Animations (if reused across components)
- Shared spacing or radius **only if they are used in >3 components**

---

### 5. Document What Remains

Once cleanup is complete:
- Create a short comment block in `index.css` or a separate markdown section listing all **intentionally retained tokens**
- Optionally create a design-tokens.css if they become extensive again (future-proofing)

---

### 6. Rebuild + Review

After cleanup:
- Run a full Tailwind rebuild (`npm run dev`)
- Manually verify affected components visually
- Remove or simplify any component-level styles that depended on removed tokens

---

### Example Replacements

| Old Usage                        | Replace With                      |
|----------------------------------|-----------------------------------|
| `p-[var(--space-4)]`             | `p-4`                             |
| `rounded-[var(--radius-md)]`     | `rounded-md`                      |
| `text-[var(--font-size-base)]`   | `text-base`                       |
| `transition-[var(--duration-200)]` | `transition duration-200`       |

---


---

### Observations & Evaluation

Based on the current state of `index.css` and `tailwind.config.js`, here are a few notes to guide the cleanup:

#### ✅ What's Working Well

- **Color tokens** are well-structured using HSL and support dark mode out of the box.
- Use of `@layer base` and semantic colors (`--foreground`, `--background`, etc.) is aligned with Tailwind + shadcn/ui best practices.
- Token naming conventions are consistent and readable.

#### 🟡 Cleanup Opportunities

- The `@theme` block is not a valid Tailwind directive and should be replaced with plain `:root {}` or scoped `@layer` sections.
- Many `--space-*`, `--size-*`, and `--font-size-*` tokens are likely redundant with Tailwind's built-in spacing and typography scales.
- Some tokens like `--space`, `--text`, and `--duration` are shorthand aliases of other tokens and may be unnecessary.

#### 🔁 Redundant Definitions

- There are both `--color-*` and legacy `--*` tokens (`--card`, `--primary`, etc.) that could be unified.
- Review whether tokens like `--radius-xs` through `--radius-full` are actually needed or if Tailwind’s `rounded-*` utilities are sufficient.