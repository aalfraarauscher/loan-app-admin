# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Loan App Admin interface.

## Project Overview

This is the admin web interface for managing the white-label loan application system. It allows administrators to configure organization settings, customize themes, and manage loan products without touching code.

## Current Status (August 12, 2025)

✅ **Completed Features:**
- Full admin interface with modern shadcn/ui components
- Authentication system with Supabase Auth and admin_users table
- Organization configuration management with logo upload
- Theme customization with live preview and dark mode toggle
- Loan products CRUD operations with search and filters
- Dashboard with statistics, quick actions, and system health monitoring
- Responsive design for all screen sizes
- Row Level Security (RLS) policies for secure data access

### Pages Implemented:
1. **Login Page** - Modern authentication with email/password
2. **Dashboard** - Stats cards, quick actions, recent activity, system health
3. **Organization Settings** - Logo upload, branding, contact info, legal URLs
4. **Theme Customization** - Color presets, typography, layout settings with live preview
5. **Products Management** - Table view with search, CRUD operations, status toggles

### UI Components:
All pages use modern shadcn/ui components including:
- Cards, Buttons, Forms, Inputs, Dialogs
- Tables with search and filters
- Dropdown menus with actions
- Alerts and notifications
- Loading states with skeletons
- Tabs, Sliders, Switches
- Badges and Separators

## Tech Stack

- **Build Tool**: Vite (fast development, HMR)
- **Framework**: React 18 with TypeScript
- **UI Components**: shadcn/ui (fully implemented)
- **Styling**: Tailwind CSS v4 (with @theme configuration)
- **Forms**: React Hook Form + Zod
- **Database**: Supabase (shared with mobile app)
- **Authentication**: Supabase Auth
- **Routing**: React Router v6
- **State Management**: Zustand (for complex state)
- **Deployment**: Vercel

## Commands

### Development
- **Install dependencies**: `npm install`
- **Start dev server**: `npm run dev`
- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`
- **Type checking**: `npm run type-check`

### shadcn/ui Components (when needed)
```bash
# Initialize shadcn
npx shadcn-ui@latest init

# Add components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
```

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── ui/          # shadcn/ui components
│   ├── layout/      # Layout components (sidebar, header)
│   ├── forms/       # Form components
│   └── preview/     # Live preview components
├── pages/           # Page components
│   ├── Dashboard.tsx
│   ├── Organization.tsx
│   ├── Theme.tsx
│   ├── Products.tsx
│   └── Login.tsx
├── hooks/           # Custom React hooks
│   ├── useAuth.ts
│   ├── useConfig.ts
│   └── useProducts.ts
├── lib/             # Utilities and configurations
│   ├── supabase.ts
│   ├── utils.ts
│   └── validators.ts
├── types/           # TypeScript type definitions
└── App.tsx          # Main app component with routing
```

## Environment Variables

Required in `.env.local`:
```env
VITE_SUPABASE_URL=https://bnltxczlwghicqychkxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Important Notes

### Tailwind CSS v4
This project uses Tailwind CSS v4 (alpha) which has different configuration:
- Uses `@import "tailwindcss"` instead of `@tailwind` directives
- Configuration via `@theme` in CSS instead of JS config files
- PostCSS config must use `@tailwindcss/postcss`

### Admin User Setup
To create an admin user:
1. User must first exist in auth.users (Supabase Auth)
2. Then add to admin_users table with appropriate role
3. RLS policies allow authenticated users to read admin_users

## Database Schema

This admin interface manages the following tables in Supabase:

### Configuration Tables
- `organization_config` - Organization branding and settings
- `app_theme` - Theme customization (colors, typography, spacing)
- `loan_products` - Loan product definitions

### Admin Tables
- `admin_users` - Admin user accounts with roles (✅ Created)
- `config_audit_log` - Track all configuration changes (TODO)

## Implemented Features

### 1. Organization Configuration ✅
- [x] Edit organization name
- [x] Upload/change logo (Supabase Storage)
- [x] Set primary/secondary colors
- [x] Configure support contact info
- [x] Set terms & privacy URLs

### 2. Theme Customization ✅
- [x] Visual color picker for all theme colors
- [x] Typography settings (font sizes with sliders)
- [x] Spacing configuration
- [x] Border radius preferences
- [x] Live preview panel with mobile view
- [x] Color presets (Blue Ocean, Sunset, Forest, Monochrome)

### 3. Loan Products Management ✅
- [x] List all products with search/filter
- [x] Add new loan product
- [x] Edit product details
- [x] Basic eligibility criteria
- [x] Required documents (basic)
- [ ] Reorder products (drag & drop) - TODO
- [x] Activate/deactivate products

### 4. Dashboard ✅
- [x] User statistics
- [x] Application metrics
- [x] Product performance indicators
- [x] Recent activity log
- [x] System health monitoring
- [x] Quick actions panel

### 5. Authentication & Security ✅
- [x] Email/password login for admins
- [x] Role-based access (super_admin, admin, viewer)
- [x] Session management
- [x] RLS policies for data protection
- [ ] Audit logging - TODO

## Implementation Guidelines

### Forms
Use React Hook Form with Zod validation:
```typescript
const schema = z.object({
  name: z.string().min(1, 'Required'),
  amount: z.number().positive()
});

const form = useForm({
  resolver: zodResolver(schema)
});
```

### API Calls
Always handle loading and error states:
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

try {
  setLoading(true);
  const { data, error } = await supabase.from('table').select();
  if (error) throw error;
  // handle data
} catch (err) {
  setError(err.message);
} finally {
  setLoading(false);
}
```

### Real-time Updates
Subscribe to configuration changes:
```typescript
useEffect(() => {
  const subscription = supabase
    .channel('config-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'organization_config' },
      (payload) => {
        // Handle real-time update
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### Component Patterns
Prefer composition and custom hooks:
```typescript
// Custom hook for config
const useOrganizationConfig = () => {
  const [config, setConfig] = useState(null);
  // fetch and manage config
  return { config, updateConfig, loading };
};

// Use in component
const OrganizationForm = () => {
  const { config, updateConfig } = useOrganizationConfig();
  // render form
};
```

## Security Considerations

1. **Row Level Security**: All tables must have RLS policies
2. **Admin Verification**: Check admin role on every request
3. **Input Validation**: Validate all inputs with Zod
4. **File Upload**: Validate file types and sizes for logos
5. **Audit Logging**: Track all configuration changes

## Deployment

### Vercel Deployment
1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy with automatic builds on push

### Build Optimization
- Use dynamic imports for large components
- Implement code splitting by route
- Optimize images with proper formats
- Enable gzip compression

## Testing Strategy

### Unit Tests
- Test form validation logic
- Test utility functions
- Test custom hooks

### Integration Tests
- Test auth flow
- Test CRUD operations
- Test real-time updates

### E2E Tests
- Test complete user journeys
- Test configuration changes reflect in mobile app

## Performance Optimization

1. **Caching**: Cache configuration data locally
2. **Debouncing**: Debounce search and filter inputs
3. **Pagination**: Paginate large lists (products, users)
4. **Lazy Loading**: Lazy load routes and heavy components
5. **Optimistic Updates**: Show changes immediately, sync in background

## Next Steps

1. ~~Install and configure shadcn/ui components~~ ✅
2. ~~Implement organization configuration form~~ ✅
3. ~~Build theme editor with live preview~~ ✅
4. ~~Create product management interface~~ ✅
5. Add advanced admin user management
6. Implement audit logging for all changes
7. Add drag & drop reordering for products
8. Deploy to Vercel
9. Add real-time updates between admin and mobile app
10. Implement advanced analytics dashboard

## Related Resources

- Main mobile app: `/loan_app`
- Supabase project: `bnltxczlwghicqychkxx`
- Database migrations: Check mobile app for schema
- API documentation: Supabase auto-generated docs