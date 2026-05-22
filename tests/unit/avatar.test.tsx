import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar } from '@/components/ui/avatar'

describe('Avatar', () => {
  it('shows initials', () => {
    render(<Avatar name="Elin Larsson" />)
    expect(screen.getByText('EL')).toBeInTheDocument()
  })
  it('handles single name', () => {
    render(<Avatar name="Elin" />)
    expect(screen.getByText('E')).toBeInTheDocument()
  })
})
