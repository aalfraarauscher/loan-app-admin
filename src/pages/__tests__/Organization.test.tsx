import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, userEvent } from '@/__tests__/utils/test-utils'
import Organization from '../Organization'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase')

describe('Organization Settings Page', () => {
  const mockConfig = {
    id: 'config-1',
    organization_name: 'Test Org',
    logo_url: 'https://test.com/logo.png',
    primary_color: '#3B82F6',
    secondary_color: '#8B5CF6',
    support_email: 'support@test.com',
    support_phone: '+1234567890',
    terms_url: 'https://test.com/terms',
    privacy_url: 'https://test.com/privacy',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful fetch of organization config
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockConfig,
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
    }

    vi.mocked(supabase.from).mockReturnValue(fromMock as any)

    // Mock storage operations
    const storageMock = {
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/organization-logos/new-logo.png' },
      }),
      remove: vi.fn().mockResolvedValue({ error: null }),
    }

    vi.mocked(supabase.storage.from).mockReturnValue(storageMock as any)
  })

  it('should render organization settings form', async () => {
    render(<Organization />)

    await waitFor(() => {
      expect(screen.getByText('Organization Settings')).toBeInTheDocument()
      expect(screen.getByText('Configure your organization\'s branding and contact information')).toBeInTheDocument()
    })
  })

  it('should load and display existing configuration', async () => {
    render(<Organization />)

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/organization name/i) as HTMLInputElement
      expect(nameInput.value).toBe('Test Org')
      
      const emailInput = screen.getByLabelText(/support email/i) as HTMLInputElement
      expect(emailInput.value).toBe('support@test.com')
    })
  })

  it('should persist form values after save', async () => {
    const user = userEvent.setup()
    
    render(<Organization />)

    await waitFor(() => {
      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument()
    })

    // Change organization name
    const nameInput = screen.getByLabelText(/organization name/i) as HTMLInputElement
    await user.clear(nameInput)
    await user.type(nameInput, 'New Organization Name')

    // Change support email
    const emailInput = screen.getByLabelText(/support email/i) as HTMLInputElement
    await user.clear(emailInput)
    await user.type(emailInput, 'newemail@test.com')

    // Mock successful update
    const updateMock = vi.fn().mockReturnThis()
    const eqMock = vi.fn().mockResolvedValue({
      error: null,
    })
    
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockConfig,
        error: null,
      }),
      update: updateMock,
      eq: eqMock,
    } as any)

    updateMock.mockReturnValue({ eq: eqMock })

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save settings/i })
    await user.click(saveButton)

    await waitFor(() => {
      // Verify the update was called with correct data
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_name: 'New Organization Name',
          support_email: 'newemail@test.com',
        })
      )
    })

    // Verify form values persist (not reset to defaults)
    expect(nameInput.value).toBe('New Organization Name')
    expect(emailInput.value).toBe('newemail@test.com')
  })

  it('should handle logo upload correctly', async () => {
    const user = userEvent.setup()
    
    render(<Organization />)

    await waitFor(() => {
      expect(screen.getByText(/upload logo/i)).toBeInTheDocument()
    })

    // Create a mock file
    const file = new File(['logo'], 'logo.png', { type: 'image/png' })
    
    // Find the file input
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()

    // Upload file
    await user.upload(fileInput, file)

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save settings/i })
    await user.click(saveButton)

    await waitFor(() => {
      // Verify storage upload was called
      expect(supabase.storage.from).toHaveBeenCalledWith('organization-logos')
      const storageMock = vi.mocked(supabase.storage.from).mock.results[0]?.value
      expect(storageMock?.upload).toHaveBeenCalledWith(
        expect.stringContaining('logos/'),
        file,
        expect.objectContaining({ upsert: true })
      )
    })
  })

  it('should show error when logo file is too large', async () => {
    const user = userEvent.setup()
    
    render(<Organization />)

    await waitFor(() => {
      expect(screen.getByText(/upload logo/i)).toBeInTheDocument()
    })

    // Create a file larger than 2MB
    const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large-logo.png', { type: 'image/png' })
    Object.defineProperty(largeFile, 'size', { value: 3 * 1024 * 1024 })
    
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement
    await user.upload(fileInput, largeFile)

    await waitFor(() => {
      expect(screen.getByText('Logo file must be less than 2MB')).toBeInTheDocument()
    })
  })

  it('should handle upload button click correctly', async () => {
    const user = userEvent.setup()
    
    render(<Organization />)

    await waitFor(() => {
      expect(screen.getByText(/upload logo/i)).toBeInTheDocument()
    })

    const uploadButton = screen.getByRole('button', { name: /upload logo/i })
    
    // Mock click on hidden input
    const clickSpy = vi.fn()
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.click = clickSpy
    }

    await user.click(uploadButton)

    expect(clickSpy).toHaveBeenCalled()
  })

  it('should not reset form to default values after save', async () => {
    const user = userEvent.setup()
    
    // Mock initial config with custom colors
    const customConfig = {
      ...mockConfig,
      primary_color: '#FF0000',
      secondary_color: '#00FF00',
    }

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: customConfig,
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    } as any)

    render(<Organization />)

    await waitFor(() => {
      const primaryColorInput = screen.getByDisplayValue('#FF0000') as HTMLInputElement
      expect(primaryColorInput).toBeInTheDocument()
      
      const secondaryColorInput = screen.getByDisplayValue('#00FF00') as HTMLInputElement
      expect(secondaryColorInput).toBeInTheDocument()
    })

    // Submit form without changes
    const saveButton = screen.getByRole('button', { name: /save settings/i })
    await user.click(saveButton)

    await waitFor(() => {
      // Colors should not reset to defaults (#3B82F6, #8B5CF6)
      const primaryColorInput = screen.getByDisplayValue('#FF0000') as HTMLInputElement
      expect(primaryColorInput).toBeInTheDocument()
      
      const secondaryColorInput = screen.getByDisplayValue('#00FF00') as HTMLInputElement
      expect(secondaryColorInput).toBeInTheDocument()
    })
  })

  it('should display success message after save', async () => {
    const user = userEvent.setup()
    
    render(<Organization />)

    await waitFor(() => {
      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /save settings/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Organization settings saved successfully!')).toBeInTheDocument()
    })
  })

  it('should handle save errors gracefully', async () => {
    const user = userEvent.setup()
    
    // Mock error on update
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockConfig,
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        error: { message: 'Update failed' },
      }),
    } as any)

    render(<Organization />)

    await waitFor(() => {
      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /save settings/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument()
    })
  })
})