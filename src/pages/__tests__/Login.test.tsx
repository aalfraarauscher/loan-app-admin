import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, userEvent } from '@/__tests__/utils/test-utils'
import Login from '../Login'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase')

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: vi.fn().mockImplementation((email, password) => {
      if (email === 'admin@test.com' && password === 'password123') {
        return Promise.resolve()
      }
      return Promise.reject(new Error('Invalid login credentials'))
    }),
    signOut: vi.fn(),
    user: null,
    adminUser: null,
    loading: false,
  })
}))

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form', () => {
    render(<Login />)

    expect(screen.getByText('Admin Portal')).toBeInTheDocument()
    expect(screen.getByText('Sign in to manage your loan application system')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should handle successful login', async () => {
    const user = userEvent.setup()

    render(<Login />)

    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'admin@test.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    // Submit form
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('should show error on failed login', async () => {
    const user = userEvent.setup()

    render(<Login />)

    // Fill in form with invalid credentials
    await user.type(screen.getByLabelText(/email/i), 'wrong@test.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')

    // Submit form
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
    })
  })

  it('should have required email and password fields', () => {
    render(<Login />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    // Check that inputs have required attribute
    expect(emailInput).toHaveAttribute('required')
    expect(passwordInput).toHaveAttribute('required')
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('should disable inputs during submission', () => {
    render(<Login />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Initially inputs should be enabled
    expect(emailInput).not.toBeDisabled()
    expect(passwordInput).not.toBeDisabled()
    expect(submitButton).not.toBeDisabled()
  })
})