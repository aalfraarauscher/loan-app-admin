import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '../useAuth'
import { supabase } from '@/lib/supabase'

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
  },
}))

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with null user and loading true', () => {
    const mockSession = null
    const mockSubscription = { unsubscribe: vi.fn() }
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any)
    
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: mockSubscription },
    } as any)

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeNull()
    expect(result.current.adminUser).toBeNull()
    expect(result.current.loading).toBe(true)
  })

  it('should set user when session exists', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'admin@test.com',
    }
    
    const mockSession = {
      user: mockUser,
      access_token: 'test-token',
    }
    
    const mockSubscription = { unsubscribe: vi.fn() }
    const mockAdminUser = {
      id: 'test-user-id',
      email: 'admin@test.com',
      full_name: 'Test Admin',
      role: 'admin',
      created_at: '2025-01-01',
    }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any)
    
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: mockSubscription },
    } as any)

    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockAdminUser,
        error: null,
      }),
    }

    vi.mocked(supabase.from).mockReturnValue(fromMock as any)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.loading).toBe(false)
    })
  })

  it('should handle sign in successfully', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'admin@test.com',
    }
    
    const mockSession = {
      user: mockUser,
      access_token: 'test-token',
    }
    
    const mockSubscription = { unsubscribe: vi.fn() }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any)
    
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    } as any)
    
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: mockSubscription },
    } as any)

    const { result } = renderHook(() => useAuth())

    await result.current.signIn('admin@test.com', 'password123')

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'admin@test.com',
      password: 'password123',
    })
  })

  it('should handle sign in error', async () => {
    const mockSubscription = { unsubscribe: vi.fn() }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any)
    
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' },
    } as any)
    
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: mockSubscription },
    } as any)

    const { result } = renderHook(() => useAuth())

    await expect(result.current.signIn('admin@test.com', 'wrong')).rejects.toThrow('Invalid credentials')
  })

  it('should handle sign out', async () => {
    const mockSubscription = { unsubscribe: vi.fn() }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any)
    
    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: null,
    } as any)
    
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: mockSubscription },
    } as any)

    const { result } = renderHook(() => useAuth())

    await result.current.signOut()

    expect(supabase.auth.signOut).toHaveBeenCalled()
  })

  it('should clean up subscription on unmount', () => {
    const mockSubscription = { unsubscribe: vi.fn() }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any)
    
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: mockSubscription },
    } as any)

    const { unmount } = renderHook(() => useAuth())

    unmount()

    expect(mockSubscription.unsubscribe).toHaveBeenCalled()
  })
})