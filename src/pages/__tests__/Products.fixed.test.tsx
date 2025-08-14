import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import Products from '../Products'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase')

describe('Products Page - Fixed Tests', () => {
  const mockProducts = [
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
      is_active: undefined, // Test undefined status
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful fetch of products
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockProducts,
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }

    vi.mocked(supabase.from).mockReturnValue(fromMock as any)
  })

  it('should render products page', async () => {
    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Loan Products')).toBeInTheDocument()
      expect(screen.getByText('Personal Loan')).toBeInTheDocument()
      expect(screen.getByText('Business Loan')).toBeInTheDocument()
    })
  })

  it('should handle product toggle without uncontrolled input errors', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Personal Loan')).toBeInTheDocument()
    })

    // Find the switch elements
    const switches = screen.getAllByRole('switch')
    expect(switches.length).toBeGreaterThan(0)
    
    // The first switch should be checked (product is active)
    expect(switches[0]).toBeChecked()
    
    // The second switch should NOT be checked (undefined is_active)
    expect(switches[1]).not.toBeChecked()

    // No uncontrolled input warnings should occur
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('changing an uncontrolled input')
    )
    expect(consoleWarnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('changing an uncontrolled input')
    )

    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  it('should handle undefined is_active gracefully', async () => {
    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Business Loan')).toBeInTheDocument()
    })

    const switches = screen.getAllByRole('switch')
    
    // The second switch (Business Loan with undefined is_active) should render
    expect(switches[1]).toBeInTheDocument()
    
    // It should be treated as false (unchecked)
    expect(switches[1]).not.toBeChecked()
    
    // Should not have any undefined attributes
    expect(switches[1].getAttribute('checked')).not.toBe('undefined')
  })

  it('should search products correctly', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()
    
    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Personal Loan')).toBeInTheDocument()
      expect(screen.getByText('Business Loan')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search products/i)
    await user.type(searchInput, 'Personal')

    await waitFor(() => {
      expect(screen.getByText('Personal Loan')).toBeInTheDocument()
      expect(screen.queryByText('Business Loan')).not.toBeInTheDocument()
    })
  })
})