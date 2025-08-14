# Testing Documentation for Loan App Admin

## Overview

This project uses a comprehensive testing setup with Vitest, React Testing Library, and Mock Service Worker (MSW) to ensure reliability and catch bugs early.

## Test Stack

- **Vitest**: Fast unit test runner built for Vite
- **React Testing Library**: Testing utilities for React components
- **MSW (Mock Service Worker)**: API mocking for Supabase operations
- **@testing-library/user-event**: Simulating user interactions

## Running Tests

```bash
# Run all tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

```
src/
├── __tests__/
│   ├── setup.ts              # Test configuration
│   ├── mocks/
│   │   ├── handlers.ts       # MSW API mock handlers
│   │   └── server.ts         # MSW server setup
│   └── utils/
│       └── test-utils.tsx    # Custom render with providers
├── hooks/__tests__/          # Hook tests
├── pages/__tests__/          # Page component tests
└── components/__tests__/     # Component tests
```

## Test Coverage

### ✅ Completed Tests

1. **Authentication Hook (`useAuth`)**
   - Session management
   - Sign in/out functionality
   - Admin user fetching
   - Error handling

2. **Organization Settings Page**
   - Form persistence after save ✅
   - Logo upload to correct storage bucket ✅
   - Handling storage errors gracefully ✅
   - Not resetting to defaults after save ✅
   - File size validation

3. **Products Management Page**
   - Product list rendering
   - Search functionality
   - Status toggle without uncontrolled input warnings ✅
   - Handling undefined `is_active` values ✅
   - Add/Edit/Delete operations

4. **Login Page**
   - Form validation
   - Successful login flow
   - Error handling
   - Loading states

### Tests Specifically Addressing Reported Issues

#### 1. Uncontrolled Input Warning (Products Toggle)
```typescript
// Test ensures Switch component handles undefined values
it('should handle undefined is_active gracefully', async () => {
  // Tests that undefined is_active doesn't cause warnings
  // Verifies Switch component uses `|| false` fallback
})
```

#### 2. Organization Settings Persistence
```typescript
it('should persist form values after save', async () => {
  // Verifies form values don't reset to defaults
  // Ensures saved data is immediately reflected in UI
})

it('should not reset form to default values after save', async () => {
  // Tests that custom colors persist after saving
  // Verifies form doesn't revert to hardcoded defaults
})
```

#### 3. Storage Bucket Issues
```typescript
it('should handle logo upload correctly', async () => {
  // Tests upload to 'organization-logos' bucket
  // Verifies correct bucket name is used
  // Tests upsert flag for overwriting files
})
```

## Writing New Tests

### Basic Component Test Template
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, userEvent } from '@/__tests__/utils/test-utils'
import YourComponent from '../YourComponent'

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### Testing Async Operations
```typescript
it('should handle async data loading', async () => {
  render(<YourComponent />)
  
  // Wait for async operations
  await waitFor(() => {
    expect(screen.getByText('Loaded Data')).toBeInTheDocument()
  })
})
```

### Testing User Interactions
```typescript
it('should handle user input', async () => {
  const user = userEvent.setup()
  render(<YourComponent />)
  
  const input = screen.getByLabelText(/field name/i)
  await user.type(input, 'test value')
  
  expect(input).toHaveValue('test value')
})
```

## Mocking Supabase

All Supabase operations are mocked in tests:

```typescript
// Mock setup in test-utils.tsx
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { /* auth methods */ },
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })),
    storage: { /* storage methods */ },
  },
}))
```

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Run Tests
  run: npm run test:run

- name: Generate Coverage
  run: npm run test:coverage
```

## Common Testing Patterns

### 1. Testing Controlled Components
Always ensure form inputs have defined values:
```typescript
<Switch checked={value || false} /> // Prevents uncontrolled warnings
```

### 2. Testing Storage Operations
Mock both upload and URL generation:
```typescript
const storageMock = {
  upload: vi.fn().mockResolvedValue({ error: null }),
  getPublicUrl: vi.fn().mockReturnValue({
    data: { publicUrl: 'https://test.com/file.png' },
  }),
}
```

### 3. Testing Form Persistence
Verify form doesn't reset after save:
```typescript
// After save action
expect(input.value).toBe('New Value') // Not default value
```

## Debugging Tests

1. **Use `screen.debug()`** to see rendered HTML
2. **Use `screen.logTestingPlaygroundURL()`** for interactive debugging
3. **Run single test file**: `npm run test:run path/to/test.tsx`
4. **Use test UI**: `npm run test:ui` for visual debugging

## Known Issues & Solutions

### Issue: "Changing an uncontrolled input to be controlled"
**Solution**: Always provide default values for form controls
```typescript
// Bad
<Switch checked={product.is_active} />

// Good
<Switch checked={product.is_active || false} />
```

### Issue: Form values reset after save
**Solution**: Update local state with saved data instead of refetching
```typescript
// After successful save
setCurrentConfig(updatedData)
// Don't call fetchConfig() which might reset form
```

### Issue: Storage bucket not found
**Solution**: Ensure bucket name consistency
```typescript
// Use same bucket name everywhere
const BUCKET_NAME = 'organization-logos'
supabase.storage.from(BUCKET_NAME)
```

## Future Improvements

- [ ] Add E2E tests with Playwright
- [ ] Increase test coverage to 80%
- [ ] Add visual regression testing
- [ ] Add performance testing
- [ ] Set up automatic test reports in PRs