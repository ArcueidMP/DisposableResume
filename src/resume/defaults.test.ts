import { describe, expect, it } from 'vitest'
import { defaultResume } from './defaults'
import { validateResume } from './validation'

describe('defaultResume', () => {
  it('validates against the resume schema', () => {
    expect(validateResume(defaultResume).success).toBe(true)
  })
})
