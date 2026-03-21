import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

// Mock @/lib/supabase/client
const mockSignIn = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignIn,
    },
  }),
}))

// Dynamic import after mocks are set up
const { LoginForm } = await import('@/components/auth/LoginForm')

describe('LoginForm', () => {
  beforeEach(() => {
    mockSignIn.mockReset()
    mockPush.mockReset()
    mockRefresh.mockReset()
  })

  it('calls signInWithPassword with email and password on submit', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    render(React.createElement(LoginForm))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!)
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('shows error message when signInWithPassword returns an error', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
    render(React.createElement(LoginForm))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bad@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } })
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Incorrect email or password. Please try again.'
      )
    })
  })

  it('redirects to / on successful login', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    render(React.createElement(LoginForm))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!)
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })
})
