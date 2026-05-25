import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the DisposableResume shell without external links', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'DisposableResume' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('keeps template selection in component state only', () => {
    render(<App />)

    const modernTemplate = screen.getByRole('button', { name: 'Modern ATS' })

    fireEvent.click(modernTemplate)

    expect(modernTemplate).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Preview style: Modern ATS')).toBeInTheDocument()
  })
})
