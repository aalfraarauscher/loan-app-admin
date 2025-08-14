import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, userEvent } from '@/__tests__/utils/test-utils'
import Products from '../Products'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase')

describe('Products Management Page', () => {
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
      is_active: false,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'product-3',
      name: 'Education Loan',
      description: 'For educational expenses',
      purpose: 'Education',
      min_amount: 3000,
      max_amount: 100000,
      min_term_months: 12,
      max_term_months: 84,
      interest_rate: 8.5,
      processing_fee: 1,
      grace_period_months: 6,
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
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockProducts[0],
        error: null,
      }),
    }

    vi.mocked(supabase.from).mockReturnValue(fromMock as any)
  })

  it('should render products list', async () => {
    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Loan Products')).toBeInTheDocument()
      expect(screen.getByText('Personal Loan')).toBeInTheDocument()
      expect(screen.getByText('Business Loan')).toBeInTheDocument()
    })
  })

  it('should handle product status toggle without controlled/uncontrolled warnings', async () => {
    const user = userEvent.setup()
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Personal Loan')).toBeInTheDocument()
    })

    // Find all switch elements
    const switches = screen.getAllByRole('switch')
    expect(switches.length).toBeGreaterThan(0)

    // Toggle the first product's status
    const firstSwitch = switches[0]
    await user.click(firstSwitch)

    await waitFor(() => {
      // Verify update was called
      const fromMock = vi.mocked(supabase.from).mock.results[0]?.value
      expect(fromMock?.update).toHaveBeenCalledWith({ is_active: false })
    })

    // Check that no warnings about controlled/uncontrolled components were logged
    expect(consoleWarnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('changing an uncontrolled input to be controlled')
    )
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('changing an uncontrolled input to be controlled')
    )

    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('should handle undefined is_active status correctly', async () => {
    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Education Loan')).toBeInTheDocument()
    })

    // Find the switch for the education loan (which has undefined is_active)
    const switches = screen.getAllByRole('switch')
    
    // The switch should render without errors even with undefined value
    expect(switches[2]).toBeInTheDocument()
    
    // It should be treated as false (unchecked)
    expect(switches[2]).not.toBeChecked()
  })

  it('should search products correctly', async () => {
    const user = userEvent.setup()
    
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

  it('should open add product dialog', async () => {
    const user = userEvent.setup()
    
    render(<Products />)

    const addButton = await screen.findByRole('button', { name: /add product/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Add New Product')).toBeInTheDocument()
      expect(screen.getByLabelText(/product name/i)).toBeInTheDocument()
    })
  })

  it('should handle product deletion with confirmation', async () => {
    const user = userEvent.setup()
    window.confirm = vi.fn().mockReturnValue(true)
    
    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Personal Loan')).toBeInTheDocument()
    })

    // Open dropdown menu for first product
    const menuButtons = screen.getAllByRole('button', { name: /open menu/i })
    await user.click(menuButtons[0])

    // Click delete option
    const deleteButton = screen.getByRole('menuitem', { name: /delete/i })
    await user.click(deleteButton)

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this product?')

    await waitFor(() => {
      const fromMock = vi.mocked(supabase.from).mock.results[0]?.value
      expect(fromMock?.delete).toHaveBeenCalled()
    })
  })

  it('should handle product edit', async () => {
    const user = userEvent.setup()
    
    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Personal Loan')).toBeInTheDocument()
    })

    // Open dropdown menu for first product
    const menuButtons = screen.getAllByRole('button', { name: /open menu/i })
    await user.click(menuButtons[0])

    // Click edit option
    const editButton = screen.getByRole('menuitem', { name: /edit/i })
    await user.click(editButton)

    await waitFor(() => {
      expect(screen.getByText('Edit Product')).toBeInTheDocument()
      // Check that form is populated with product data
      const nameInput = screen.getByDisplayValue('Personal Loan')
      expect(nameInput).toBeInTheDocument()
    })
  })

  it('should validate product form inputs', async () => {
    const user = userEvent.setup()
    
    render(<Products />)

    const addButton = await screen.findByRole('button', { name: /add product/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Add New Product')).toBeInTheDocument()
    })

    // Try to submit without filling required fields
    const saveButton = screen.getByRole('button', { name: /create product/i })
    await user.click(saveButton)

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument()
    })
  })

  it('should save new product successfully', async () => {
    const user = userEvent.setup()
    
    render(<Products />)

    const addButton = await screen.findByRole('button', { name: /add product/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Add New Product')).toBeInTheDocument()
    })

    // Fill in product form
    await user.type(screen.getByLabelText(/product name/i), 'New Product')
    await user.type(screen.getByLabelText(/description/i), 'Test description')
    await user.type(screen.getByLabelText(/purpose/i), 'Testing')
    await user.type(screen.getByLabelText(/minimum amount/i), '1000')
    await user.type(screen.getByLabelText(/maximum amount/i), '10000')
    await user.type(screen.getByLabelText(/minimum term/i), '6')
    await user.type(screen.getByLabelText(/maximum term/i), '12')
    await user.type(screen.getByLabelText(/interest rate/i), '10')
    await user.type(screen.getByLabelText(/processing fee/i), '2')

    // Submit form
    const saveButton = screen.getByRole('button', { name: /create product/i })
    await user.click(saveButton)

    await waitFor(() => {
      const fromMock = vi.mocked(supabase.from).mock.results[0]?.value
      expect(fromMock?.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'New Product',
          description: 'Test description',
          purpose: 'Testing',
          min_amount: 1000,
          max_amount: 10000,
        })
      ])
    })
  })

  it('should toggle product status via dropdown menu', async () => {
    const user = userEvent.setup()
    
    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Personal Loan')).toBeInTheDocument()
    })

    // Open dropdown menu for first product (which is active)
    const menuButtons = screen.getAllByRole('button', { name: /open menu/i })
    await user.click(menuButtons[0])

    // Click deactivate option
    const deactivateButton = screen.getByRole('menuitem', { name: /deactivate/i })
    await user.click(deactivateButton)

    await waitFor(() => {
      const fromMock = vi.mocked(supabase.from).mock.results[0]?.value
      expect(fromMock?.update).toHaveBeenCalledWith({ is_active: false })
    })
  })
})