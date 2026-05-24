import { Avatar } from '@/components/ui/avatar'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

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
