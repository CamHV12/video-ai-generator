import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App, { DEFAULT_GENERATION_PROMPT } from './App'

describe('AI Video Generator baseline', () => {
  it('renders the single-page workspace without a user-editable prompt field', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /biến ý tưởng thành/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Ảnh nguồn')).toBeInTheDocument()
    expect(screen.getByLabelText('Video tham chiếu')).toBeInTheDocument()
    expect(screen.getByText('data/output/')).toBeInTheDocument()
    expect(screen.queryByLabelText(/^prompt/i)).not.toBeInTheDocument()
    expect(screen.getByText(/tự động mô phỏng chuyển động/i)).toBeInTheDocument()
  })

  it('provides a fixed prompt that prioritizes source-scene consistency and reference-video motion', () => {
    expect(DEFAULT_GENERATION_PROMPT).toContain('use the uploaded reference video only as the motion/action reference')
    expect(DEFAULT_GENERATION_PROMPT).toContain('composition, camera angle, framing, aspect ratio')
    expect(DEFAULT_GENERATION_PROMPT).toContain('Do not add, remove, or rearrange objects')
  })

  it('keeps generation disabled until a verified AI provider is integrated', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /tạo video ai/i })).toBeDisabled()
  })
})
