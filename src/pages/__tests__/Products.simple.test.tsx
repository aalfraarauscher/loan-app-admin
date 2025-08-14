import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import Products from '../Products'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase')

describe('Products Page - Simple Tests', () => {
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
    })
  })

  it('should handle product toggle without uncontrolled input errors', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Personal Loan')).toBeInTheDocument()
    })

    // Find the switch element
    const switches = screen.getAllByRole('switch')
    expect(switches[0]).toBeInTheDocument()
    
    // The switch should be checked (product is active)
    expect(switches[0]).toBeChecked()

    // No uncontrolled input warnings should occur
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('changing an uncontrolled input')
    )

    consoleErrorSpy.mockRestore()
  })

  it('should handle undefined is_active gracefully', async () => {
    // Mock product with undefined is_active
    const productWithUndefined = {
      ...mockProducts[0],
      is_active: undefined,
    }

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [productWithUndefined],
        error: null,
      }),
    } as any)

    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Personal Loan')).toBeInTheDocument()
    })

    const switches = screen.getAllByRole('switch')
    
    // Switch should render and be unchecked (undefined treated as false)
    expect(switches[0]).toBeInTheDocument()
    expect(switches[0]).not.toBeChecked()
  })
})