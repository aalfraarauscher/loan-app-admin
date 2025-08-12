# Loan App Admin Interface

Admin web interface for managing the white-label loan application system.

## Features

- 🏢 Organization configuration (name, logo, branding)
- 🎨 Theme customization (colors, typography, spacing)
- 📦 Loan product management
- 📊 Analytics dashboard
- 🔐 Role-based access control
- 📝 Audit logging

## Tech Stack

- **Vite** - Fast build tool
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Supabase** - Backend and database
- **React Router** - Routing
- **React Hook Form + Zod** - Form handling and validation

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.local.example` to `.env.local` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

## Project Structure

```
src/
├── components/       # Reusable components
├── pages/           # Page components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and configurations
└── types/           # TypeScript type definitions
```

## Database Setup

This admin interface requires the following tables in your Supabase project:
- `organization_config` - Organization settings
- `app_theme` - Theme configuration
- `loan_products` - Loan product definitions
- `admin_users` - Admin user accounts (to be created)

See the main mobile app repository for the complete database schema.

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Security

- All admin actions require authentication
- Row Level Security (RLS) policies on all tables
- Audit logging for configuration changes
- Input validation with Zod schemas

## Related Projects

- **Mobile App**: The React Native loan application (`/loan_app`)
- **Supabase Project**: Shared backend infrastructure

## License

Private - All rights reserved
