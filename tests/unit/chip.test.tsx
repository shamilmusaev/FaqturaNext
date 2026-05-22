import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Chip } from '@/components/ui/chip'

describe('Chip', () => {
  it('renders label', () => {
    render(<Chip>Faktura skickad</Chip>)
    expect(screen.getByText('Faktura skickad')).toBeInTheDocument()
  })
  it('applies pos tone class', () => {
    render(<Chip tone="pos">Betald</Chip>)
    expect(screen.getByText('Betald').className).toMatch(/pos/)
  })
})
