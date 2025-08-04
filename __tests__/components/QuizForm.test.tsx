/**
 * Comprehensive tests for the QuizForm component
 * Tests mobile-first design, quiz flow, validation, and COPPA compliance
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuizForm from '@/components/QuizForm'

// Mock the API calls
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

// Mock fetch for API calls
global.fetch = jest.fn()
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('QuizForm Component', () => {
  const mockOnComplete = jest.fn()
  const mockOnLoading = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ bookId: 'test-book-123' }),
    } as Response)
  })

  test('should render initial quiz step', () => {
    render(<QuizForm onComplete={mockOnComplete} onLoading={mockOnLoading} />)
    
    expect(screen.getByText(/what's your child's name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/child's name/i)).toBeInTheDocument()
  })

  test('should show progress bar', () => {
    render(<QuizForm onComplete={mockOnComplete} onLoading={mockOnLoading} />)
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveAttribute('aria-valuenow', '1')
    expect(progressBar).toHaveAttribute('aria-valuemax', '4')
  })

  test('should validate required fields on first step', async () => {
    const user = userEvent.setup()
    render(<QuizForm onComplete={mockOnComplete} onLoading={mockOnLoading} />)
    
    const nextButton = screen.getByText('Next Step')
    await user.click(nextButton)
    
    expect(screen.getByText('Child\'s name is required')).toBeInTheDocument()
    expect(screen.getByText('Child\'s age is required')).toBeInTheDocument()
  })

  test('should progress to next step when valid', async () => {
    const user = userEvent.setup()
    render(<QuizForm onComplete={mockOnComplete} onLoading={mockOnLoading} />)
    
    // Fill out first step
    await user.type(screen.getByLabelText(/child's name/i), 'Alice')
    await user.selectOptions(screen.getByLabelText(/child's age/i), '5')
    
    const nextButton = screen.getByText('Next Step')
    await user.click(nextButton)
    
    // Should show second step
    expect(screen.getByText(/personality traits/i)).toBeInTheDocument()
  })

  test('should allow selecting multiple personality traits', async () => {
    const user = userEvent.setup()
    render(<QuizForm onComplete={mockOnComplete} onLoading={mockOnLoading} />)
    
    // Complete first step
    await user.type(screen.getByLabelText(/child's name/i), 'Alice')
    await user.selectOptions(screen.getByLabelText(/child's age/i), '5')
    await user.click(screen.getByText('Next Step'))
    
    // Select traits
    const braveCheckbox = screen.getByLabelText('Brave')
    const kindCheckbox = screen.getByLabelText('Kind')
    
    await user.click(braveCheckbox)
    await user.click(kindCheckbox)
    
    expect(braveCheckbox).toBeChecked()
    expect(kindCheckbox).toBeChecked()
  })

  test('should limit personality trait selection', async () => {
    const user = userEvent.setup()
    render(<QuizForm onComplete={mockOnComplete} onLoading={mockOnLoading} />)
    
    // Complete first step
    await user.type(screen.getByLabelText(/child's name/i), 'Alice')
    await user.selectOptions(screen.getByLabelText(/child's age/i), '5')
    await user.click(screen.getByText('Next Step'))
    
    // Try to select more than maximum allowed
    const checkboxes = screen.getAllByRole('checkbox')
    
    // Select first 4 traits (assuming max is 3)
    for (let i = 0; i < 4; i++) {
      await user.click(checkboxes[i])
    }
    
    // Should show validation message
    expect(screen.getByText(/maximum.*3.*traits/i)).toBeInTheDocument()
  })

  test('should show favorite things step', async () => {
    const user = userEvent.setup()
    render(<QuizForm onComplete={mockOnComplete} onLoading={mockOnLoading} />)
    
    // Complete first two steps
    await user.type(screen.getByLabelText(/child's name/i), 'Alice')
    await user.selectOptions(screen.getByLabelText(/child's age/i), '5')
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText('Brave'))
    await user.click(screen.getByLabelText('Kind'))
    await user.click(screen.getByText('Next Step'))
    
    // Should show favorite things step
    expect(screen.getByText(/favorite things/i)).toBeInTheDocument()
  })

  test('should show story type selection step', async () => {
    const user = userEvent.setup()
    render(<QuizForm onComplete={mockOnComplete} onLoading={mockOnLoading} />)
    
    // Complete first three steps
    await user.type(screen.getByLabelText(/child's name/i), 'Alice')
    await user.selectOptions(screen.getByLabelText(/child's age/i), '5')
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText('Brave'))
    await user.click(screen.getByLabelText('Kind'))
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText('Animals'))
    await user.click(screen.getByLabelText('Adventure'))
    await user.click(screen.getByText('Next Step'))
    
    // Should show story type step
    expect(screen.getByText(/story type/i)).toBeInTheDocument()
  })

  test('should show parent information step', async () => {
    const user = userEvent.setup()
    render(<QuizForm onComplete={mockOnComplete} onLoading={mockOnLoading} />)
    
    // Complete all quiz steps
    await user.type(screen.getByLabelText(/child's name/i), 'Alice')
    await user.selectOptions(screen.getByLabelText(/child's age/i), '5')
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText('Brave'))
    await user.click(screen.getByLabelText('Kind'))
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText('Animals'))
    await user.click(screen.getByLabelText('Adventure'))
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText(/everyday adventure/i))
    await user.click(screen.getByText('Next Step'))
    
    // Should show parent info step
    expect(screen.getByText(/parent information/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/parent.*email/i)).toBeInTheDocument()
  })

  test('should require COPPA consent checkbox', async () => {
    const user = userEvent.setup()
    render(<QuizForm onComplete={mockOnComplete} onLoading={mockOnLoading} />)
    
    // Complete all steps up to parent info
    await user.type(screen.getByLabelText(/child's name/i), 'Alice')
    await user.selectOptions(screen.getByLabelText(/child's age/i), '5')
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText('Brave'))
    await user.click(screen.getByLabelText('Kind'))
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText('Animals'))
    await user.click(screen.getByLabelText('Adventure'))
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText(/everyday adventure/i))
    await user.click(screen.getByText('Next Step'))
    
    // Fill parent email but don't check consent
    await user.type(screen.getByLabelText(/parent.*email/i), 'parent@example.com')
    
    const createButton = screen.getByText('Create My Story')
    await user.click(createButton)
    
    // Should show COPPA consent error
    expect(screen.getByText(/parental consent.*required/i)).toBeInTheDocument()
  })

  test('should submit form when all fields are valid', async () => {
    const user = userEvent.setup()
    render(<QuizForm onComplete={mockOnComplete} onLoading={mockOnLoading} />)
    
    // Complete entire form
    await user.type(screen.getByLabelText(/child's name/i), 'Alice')
    await user.selectOptions(screen.getByLabelText(/child's age/i), '5')
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText('Brave'))
    await user.click(screen.getByLabelText('Kind'))
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText('Animals'))
    await user.click(screen.getByLabelText('Adventure'))
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText(/everyday adventure/i))
    await user.click(screen.getByText('Next Step'))
    
    await user.type(screen.getByLabelText(/parent.*email/i), 'parent@example.com')
    await user.click(screen.getByLabelText(/parental consent/i))
    
    const createButton = screen.getByText('Create My Story')
    await user.click(createButton)
    
    // Should call API
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/create-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childName: 'Alice',
          childAge: '5',
          childTraits: ['Brave', 'Kind'],
          favoriteThings: ['Animals', 'Adventure'],
          storyType: 'everyday-adventure',
          parentEmail: 'parent@example.com',
          parentConsent: true,
        }),
      })
    })
  })

  test('should show loading state during submission', async () => {
    // Mock slow API response
    mockFetch.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ bookId: 'test-book-123' }),
      } as Response), 1000))
    )
    
    const user = userEvent.setup()
    render(<QuizForm onComplete={mockOnComplete} onLoading={mockOnLoading} />)
    
    // Complete entire form quickly
    await user.type(screen.getByLabelText(/child's name/i), 'Alice')
    await user.selectOptions(screen.getByLabelText(/child's age/i), '5')
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText('Brave'))
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText('Animals'))
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText(/everyday adventure/i))
    await user.click(screen.getByText('Next Step'))
    
    await user.type(screen.getByLabelText(/parent.*email/i), 'parent@example.com')
    await user.click(screen.getByLabelText(/parental consent/i))
    
    const createButton = screen.getByText('Create My Story')
    await user.click(createButton)
    
    // Should show loading state
    expect(screen.getByText(/creating.*story/i)).toBeInTheDocument()
    expect(createButton).toBeDisabled()
  })

  test('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    } as Response)
    
    const user = userEvent.setup()
    render(<QuizForm onComplete={mockOnComplete} onLoading={mockOnLoading} />)
    
    // Complete entire form
    await user.type(screen.getByLabelText(/child's name/i), 'Alice')
    await user.selectOptions(screen.getByLabelText(/child's age/i), '5')
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText('Brave'))
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText('Animals'))
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText(/everyday adventure/i))
    await user.click(screen.getByText('Next Step'))
    
    await user.type(screen.getByLabelText(/parent.*email/i), 'parent@example.com')
    await user.click(screen.getByLabelLabel(/parental consent/i))
    
    const createButton = screen.getByText('Create My Story')
    await user.click(createButton)
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/error.*creating.*story/i)).toBeInTheDocument()
    })
  })

  test('should allow going back to previous steps', async () => {
    const user = userEvent.setup()
    render(<QuizForm onComplete={mockOnComplete} onLoading={mockOnLoading} />)
    
    // Complete first step
    await user.type(screen.getByLabelText(/child's name/i), 'Alice')
    await user.selectOptions(screen.getByLabelText(/child's age/i), '5')
    await user.click(screen.getByText('Next Step'))
    
    // Go to second step then back
    const backButton = screen.getByText('Back')
    await user.click(backButton)
    
    // Should be back on first step
    expect(screen.getByLabelText(/child's name/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
  })

  test('should preserve form data when navigating steps', async () => {
    const user = userEvent.setup()
    render(<QuizForm onComplete={mockOnComplete} onLoading={mockOnLoading} />)
    
    // Fill first step
    await user.type(screen.getByLabelText(/child's name/i), 'Alice')
    await user.selectOptions(screen.getByLabelText(/child's age/i), '5')
    await user.click(screen.getByText('Next Step'))
    
    // Fill second step
    await user.click(screen.getByLabelText('Brave'))
    await user.click(screen.getByLabelText('Kind'))
    await user.click(screen.getByText('Next Step'))
    
    // Go back and forward
    await user.click(screen.getByText('Back'))
    expect(screen.getByLabelText('Brave')).toBeChecked()
    expect(screen.getByLabelText('Kind')).toBeChecked()
    
    await user.click(screen.getByText('Back'))
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
    expect(screen.getByDisplayValue('5')).toBeInTheDocument()
  })

  test('should be responsive for mobile devices', () => {
    // Test mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
    
    render(<QuizForm onComplete={mockOnComplete} onLoading={mockOnLoading} />)
    
    const form = screen.getByRole('form')
    expect(form).toHaveClass('w-full')
    
    // Check that inputs are touch-friendly
    const nameInput = screen.getByLabelText(/child's name/i)
    expect(nameInput).toHaveClass('p-3') // Adequate touch target
  })

  test('should validate email format', async () => {
    const user = userEvent.setup()
    render(<QuizForm onComplete={mockOnComplete} onLoading={mockOnLoading} />)
    
    // Navigate to parent info step
    await user.type(screen.getByLabelText(/child's name/i), 'Alice')
    await user.selectOptions(screen.getByLabelText(/child's age/i), '5')
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText('Brave'))
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText('Animals'))
    await user.click(screen.getByText('Next Step'))
    
    await user.click(screen.getByLabelText(/everyday adventure/i))
    await user.click(screen.getByText('Next Step'))
    
    // Enter invalid email
    await user.type(screen.getByLabelText(/parent.*email/i), 'invalid-email')
    await user.click(screen.getByLabelText(/parental consent/i))
    
    const createButton = screen.getByText('Create My Story')
    await user.click(createButton)
    
    // Should show email validation error
    expect(screen.getByText(/valid email.*required/i)).toBeInTheDocument()
  })
})