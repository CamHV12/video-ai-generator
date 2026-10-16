import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('AI Video Generator baseline', () => {
  it('renders the single-page workspace and local output location', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /biến ý tưởng thành/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Ảnh nguồn')).toBeInTheDocument()
    expect(screen.getByLabelText('Video tham chiếu')).toBeInTheDocument()
    expect(screen.getByText('data/output/')).toBeInTheDocument()
  })

  it('keeps generation disabled until a verified AI provider is integrated', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: /tạo video ai/i })).toBeDisabled()
  })
})
