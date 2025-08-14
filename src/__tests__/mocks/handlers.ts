import { http, HttpResponse } from 'msw'

const SUPABASE_URL = 'https://test.supabase.co'

// Mock data
export const mockUser = {
  id: 'test-user-id',
  email: 'admin@test.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2025-01-01T00:00:00.000Z',
}

export const mockAdminUser = {
  id: 'test-user-id',
  email: 'admin@test.com',
  full_name: 'Test Admin',
  role: 'admin' as const,
  created_at: '2025-01-01T00:00:00.000Z',
}

export const mockOrganizationConfig = {
  id: 'org-config-id',
  organization_name: 'Test Organization',
  logo_url: 'https://test.com/logo.png',
  primary_color: '#3B82F6',
  secondary_color: '#8B5CF6',
  support_email: 'support@test.com',
  support_phone: '+1234567890',
  terms_url: 'https://test.com/terms',
  privacy_url: 'https://test.com/privacy',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
}

export const mockProducts = [
  {
    id: 'product-1',
    name: 'Personal Loan',
    description: 'For personal expenses',
    purpose: 'Personal',
    min_amount: 1000,
    max_amount: 50000,
    min_term_months: 3,
    max_term_months: 36,
    interest_rate: 12.5,
    processing_fee: 2,
    grace_period_months: 0,
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'product-2',
    name: 'Business Loan',
    description: 'For business operations',
    purpose: 'Business',
    min_amount: 5000,
    max_amount: 200000,
    min_term_months: 6,
    max_term_months: 60,
    interest_rate: 10.75,
    processing_fee: 1.5,
    grace_period_months: 3,
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
  },
]

export const handlers = [
  // Auth endpoints
  http.post(`${SUPABASE_URL}/auth/v1/token`, async ({ request }) => {
    const body = await request.json() as any
    
    if (body.grant_type === 'password') {
      if (body.email === 'admin@test.com' && body.password === 'password123') {
        return HttpResponse.json({
          access_token: 'test-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'test-refresh-token',
          user: mockUser,
        })
      } else {
        return HttpResponse.json(
          { error: 'Invalid login credentials', error_description: 'Invalid login credentials' },
          { status: 400 }
        )
      }
    }
    
    return HttpResponse.json({})
  }),

  http.get(`${SUPABASE_URL}/auth/v1/user`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (authHeader === 'Bearer test-access-token') {
      return HttpResponse.json(mockUser)
    }
    
    return HttpResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    )
  }),

  // Admin users endpoint
  http.get(`${SUPABASE_URL}/rest/v1/admin_users`, ({ request }) => {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (id === 'eq.test-user-id') {
      return HttpResponse.json([mockAdminUser])
    }
    
    return HttpResponse.json([])
  }),

  // Organization config endpoints
  http.get(`${SUPABASE_URL}/rest/v1/organization_config`, () => {
    return HttpResponse.json([mockOrganizationConfig])
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/organization_config`, async ({ request }) => {
    const body = await request.json()
    const url = new URL(request.url)
    
    // Simulate successful update
    return HttpResponse.json([{ ...mockOrganizationConfig, ...body }])
  }),

  http.post(`${SUPABASE_URL}/rest/v1/organization_config`, async ({ request }) => {
    const body = await request.json()
    
    return HttpResponse.json([{
      id: 'new-org-config-id',
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
  }),

  // Loan products endpoints
  http.get(`${SUPABASE_URL}/rest/v1/loan_products`, () => {
    return HttpResponse.json(mockProducts)
  }),

  http.post(`${SUPABASE_URL}/rest/v1/loan_products`, async ({ request }) => {
    const body = await request.json()
    
    return HttpResponse.json([{
      id: `product-${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/loan_products`, async ({ request }) => {
    const body = await request.json()
    const url = new URL(request.url)
    const id = url.searchParams.get('id')?.replace('eq.', '')
    
    const product = mockProducts.find(p => p.id === id)
    if (product) {
      return HttpResponse.json([{ ...product, ...body }])
    }
    
    return HttpResponse.json(
      { error: 'Product not found' },
      { status: 404 }
    )
  }),

  http.delete(`${SUPABASE_URL}/rest/v1/loan_products`, ({ request }) => {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')?.replace('eq.', '')
    
    const product = mockProducts.find(p => p.id === id)
    if (product) {
      return HttpResponse.json([product])
    }
    
    return HttpResponse.json(
      { error: 'Product not found' },
      { status: 404 }
    )
  }),

  // Storage endpoints
  http.post(`${SUPABASE_URL}/storage/v1/object/organization-logos/*`, async ({ request }) => {
    // Simulate successful upload
    return HttpResponse.json({
      Key: 'logos/test-logo.png',
    })
  }),

  http.get(`${SUPABASE_URL}/storage/v1/object/public/organization-logos/*`, () => {
    // Return a mock image URL
    return HttpResponse.json({
      publicUrl: 'https://test.supabase.co/storage/v1/object/public/organization-logos/test-logo.png',
    })
  }),

  http.delete(`${SUPABASE_URL}/storage/v1/object/organization-logos/*`, () => {
    // Simulate successful deletion
    return HttpResponse.json({ message: 'Successfully deleted' })
  }),
]