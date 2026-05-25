import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createDefaultResume } from './resume/defaults'
import { useResumeStore } from './store/resume-store'

describe('App', () => {
  beforeEach(() => {
    useResumeStore.getState().resetToDefaults()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the DisposableResume shell without external links', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'DisposableResume' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('updates basics, skills, and template selection locally', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Fixture Person' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'fixture.person@example.invalid' },
    })
    fireEvent.change(screen.getByLabelText('Phone'), {
      target: { value: '+0 111 222 3333' },
    })
    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'Fixture City, ZZ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Skills' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Skills' }), {
      target: { value: 'Schema, Store, UI' },
    })

    const modernTemplate = screen.getByRole('button', { name: 'Modern ATS' })

    fireEvent.click(modernTemplate)

    expect(
      screen.getByRole('heading', { level: 3, name: 'Fixture Person' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'fixture.person@example.invalid | +0 111 222 3333 | Fixture City, ZZ',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Schema | Store | UI')).toBeInTheDocument()
    expect(modernTemplate).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Preview style: Modern ATS')).toBeInTheDocument()
  })

  it('adds, updates, and removes a work item from the UI', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Work experience' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add work' }))
    fireEvent.change(screen.getByLabelText('Work role 2'), {
      target: { value: 'Fixture Builder' },
    })
    fireEvent.change(screen.getByLabelText('Work organization 2'), {
      target: { value: 'Example Fixture Studio' },
    })
    fireEvent.change(screen.getByLabelText('Work highlights 2'), {
      target: { value: 'Prepared safe client-only editor fixtures.' },
    })

    expect(
      screen.getByText('Fixture Builder, Example Fixture Studio'),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText('Prepared safe client-only editor fixtures.'),
    ).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Remove work item 2' }))

    expect(
      screen.queryByText('Fixture Builder, Example Fixture Studio'),
    ).not.toBeInTheDocument()
  })

  it('exports the current resume as JSON without rendering a link', async () => {
    const createObjectUrl = vi.fn<(blob: Blob) => string>(
      () => 'blob:resume-json',
    )
    const revokeObjectUrl = vi.fn()

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrl,
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Export JSON' }))

    const firstCall = createObjectUrl.mock.calls[0]

    if (firstCall === undefined) {
      throw new Error('Expected JSON export to create an object URL.')
    }

    const exportedBlob = firstCall[0] as Blob
    const exportedJson = JSON.parse(await exportedBlob.text()) as unknown

    expect(exportedJson).toMatchObject({
      basics: { name: 'Sample Candidate' },
      template: 'classic-ats',
    })
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:resume-json')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('imports validated JSON into the local resume store', async () => {
    const importedResume = createDefaultResume()
    importedResume.basics.name = 'Imported Fixture Person'
    importedResume.education = [
      {
        id: 'education-import-fixture',
        school: 'Imported Sample Institute',
        credential: 'Imported Fixture Certificate',
        location: 'Imported City, ZZ',
        startDate: '2020',
        endDate: '2021',
        details: ['Imported only after schema validation.'],
      },
    ]

    render(<App />)

    fireEvent.change(screen.getByLabelText('Import resume JSON'), {
      target: {
        files: [
          new File([JSON.stringify(importedResume)], 'fixture-resume.json', {
            type: 'application/json',
          }),
        ],
      },
    })

    await waitFor(() => {
      expect(
        screen.getByText('Imported validated JSON locally.'),
      ).toBeInTheDocument()
    })

    expect(
      screen.getByRole('heading', { level: 3, name: 'Imported Fixture Person' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Imported Fixture Certificate, Imported Sample Institute'),
    ).toBeInTheDocument()
  })

  it('rejects invalid imported JSON without replacing the current resume', async () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Import resume JSON'), {
      target: {
        files: [
          new File(['{"template":"unknown-template"}'], 'invalid-resume.json', {
            type: 'application/json',
          }),
        ],
      },
    })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Import failed: choose a valid DisposableResume JSON file.',
      )
    })

    expect(
      screen.getByRole('heading', { level: 3, name: 'Sample Candidate' }),
    ).toBeInTheDocument()
  })

  it('clears editable data to a blank local resume', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Clear to blank resume' }))

    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(
      screen.getByRole('heading', { level: 3, name: 'Untitled resume' }),
    ).toBeInTheDocument()
    expect(screen.getByText('No work entries')).toBeInTheDocument()
  })
})
