import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Send invoice</Button>)
    expect(screen.getByRole('button', { name: 'Send invoice' })).toBeInTheDocument()
  })

  it('fires onClick', async () => {
    let clicked = false
    render(<Button onClick={() => { clicked = true }}>Click</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(clicked).toBe(true)
  })

  it('disables when disabled', async () => {
    let clicked = false
    render(<Button disabled onClick={() => { clicked = true }}>Click</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(clicked).toBe(false)
  })

  it('renders secondary variant', () => {
    render(<Button variant="secondary">x</Button>)
    expect(screen.getByRole('button')).toHaveClass(/border/)
  })
})
