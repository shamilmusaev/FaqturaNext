import { Chip } from '@/components/ui/chip'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

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
