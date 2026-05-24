import { Card } from '@/components/ui/card'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('Card', () => {
  it('renders content', () => {
    render(<Card>Hello</Card>)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
  it('applies elevated class when elevated', () => {
    const { container } = render(<Card elevated>x</Card>)
    expect(container.firstChild).toHaveClass(/shadow/)
  })
})
