import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

describe('Input', () => {
  it('accepts typing', async () => {
    render(<Input aria-label="name" />)
    const el = screen.getByLabelText('name')
    await userEvent.type(el, 'Elin')
    expect(el).toHaveValue('Elin')
  })
})

describe('MoneyInput', () => {
  it('emits bigint cents via onChange', async () => {
    let cents = 0n
    render(
      <MoneyInput
        aria-label="amount"
        onValueChange={(v) => {
          cents = v
        }}
      />,
    )
    const el = screen.getByLabelText('amount')
    await userEvent.type(el, '1234,50')
    expect(cents).toBe(123450n)
  })
})
