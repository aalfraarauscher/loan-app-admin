# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the admin web interface for managing the white-label loan application system. It allows administrators to configure organization settings, customize themes, and manage loan products without touching code.

## Tech Stack

- **Build Tool**: Vite (fast development, HMR)
- **Framework**: React 18 with TypeScript
- **UI Components**: shadcn/ui (modern component library)
- **Styling**: Tailwind CSS v4 (uses `@theme` configuration in CSS, not JS config)
- **Forms**: React Hook Form + Zod
- **Database**: Supabase (shared with mobile app)
- **Authentication**: Supabase Auth with admin_users table
- **Routing**: React Router v6
- **State Management**: Zustand (for complex state)
- **Testing**: Vitest + React Testing Library + MSW

## Commands

### Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # Type checking
npm run lint         # Run ESLint
```

### Testing
```bash
npm test            # Watch mode
npm run test:run    # Single run
npm run test:ui     # Visual UI
npm run test:coverage # With coverage
```

### shadcn/ui Components
```bash
npx shadcn@latest add [component-name]  # Add new components as needed
```

## Project Architecture

The codebase follows a feature-based structure with clear separation of concerns:

### Core Modules
- **Authentication**: Session management via Supabase Auth with admin role verification
- **Configuration Management**: Organization settings and theme customization with real-time preview
- **Product Management**: CRUD operations for loan products with search/filter/status management
- **Dashboard**: Analytics, system health monitoring, and quick actions

### Data Flow
1. **Supabase Integration**: All data operations go through `lib/supabase.ts`
2. **Custom Hooks**: Business logic encapsulated in hooks (`useAuth`, `useConfig`, `useProducts`)
3. **Form Handling**: React Hook Form with Zod validation for all user inputs
4. **Error Boundaries**: Graceful error handling with user-friendly messages

### Key Implementation Patterns

#### Forms with Validation
```typescript
const schema = z.object({
  name: z.string().min(1, 'Required'),
  amount: z.number().positive()
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: data || {}
});
```

#### Controlled Components (prevent uncontrolled warnings)
```typescript
// Always provide fallback for boolean values
<Switch checked={value || false} />
```

#### Storage Operations
```typescript
// Use consistent bucket name
const BUCKET_NAME = 'organization-logos';
await supabase.storage.from(BUCKET_NAME).upload(path, file, { upsert: true });
```

## Environment Setup

Required `.env.local`:
```env
VITE_SUPABASE_URL=https://bnltxczlwghicqychkxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Database Schema

### Required Tables
- `organization_config` - Organization branding and settings
- `app_theme` - Theme customization (colors, typography, spacing)
- `loan_products` - Loan product definitions
- `admin_users` - Admin user accounts with roles (super_admin, admin, viewer)

All tables must have Row Level Security (RLS) policies enabled.

## Tailwind CSS v4 Specifics

This project uses Tailwind CSS v4 alpha which differs from v3:
- Uses `@import "tailwindcss"` instead of `@tailwind` directives
- Configuration via `@theme` blocks in CSS files
- PostCSS must use `@tailwindcss/postcss` package

## Testing Strategy

The project has comprehensive test coverage (28+ tests) specifically addressing:
- Uncontrolled input warnings (Switch components with undefined values)
- Form persistence after save operations
- Storage bucket operations with correct bucket names
- Authentication flows and role verification

Test files follow the pattern: `[component]/__tests__/[component].test.tsx`

## Common Issues & Solutions

### Form Values Reset After Save
Update local state with saved data instead of refetching:
```typescript
setCurrentConfig(updatedData);  // Don't call fetchConfig()
```

### Storage Bucket Errors
Ensure bucket exists in Supabase and use consistent naming:
```typescript
const BUCKET_NAME = 'organization-logos';  // Must match Supabase bucket
```

### Uncontrolled Component Warnings
Always provide default values for form controls:
```typescript
<Switch checked={product.is_active || false} />
```

## Security Considerations

- All admin operations require authentication check
- RLS policies must be configured for all tables
- File uploads validate type and size
- Input validation with Zod on all forms
- Never expose service role key in frontend