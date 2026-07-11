import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./pdf/exportResumePdf', () => ({
  exportResumePdf: vi.fn(),
}))

import App from './App'
import { exportResumePdf } from './pdf/exportResumePdf'
import { createDefaultResume } from './resume/defaults'
import { MAX_RESUME_JSON_BYTES, parseResumeJson } from './resume/json'
import { resumeLimits } from './resume/schema'
import { useResumeStore } from './store/resume-store'

const originalCreateObjectUrl = Object.getOwnPropertyDescriptor(
  URL,
  'createObjectURL',
)
const originalRevokeObjectUrl = Object.getOwnPropertyDescriptor(
  URL,
  'revokeObjectURL',
)

function restoreUrlMethod(
  name: 'createObjectURL' | 'revokeObjectURL',
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor === undefined) {
    Reflect.deleteProperty(URL, name)
    return
  }

  Object.defineProperty(URL, name, descriptor)
}

function getPreviewParts() {
  const preview = screen.getByLabelText('Resume preview shell')
  const header = preview.querySelector('[data-preview-header="true"]')
  const skills = preview.querySelector('[data-preview-skills-layout]')

  if (!(header instanceof HTMLElement) || !(skills instanceof HTMLElement)) {
    throw new Error('Expected the live preview to render testable parts.')
  }

  return { header, preview, skills }
}

describe('App', () => {
  const mockedExportResumePdf = vi.mocked(exportResumePdf)

  beforeEach(() => {
    useResumeStore.getState().resetToDefaults()
    mockedExportResumePdf.mockResolvedValue(undefined)
  })

  afterEach(() => {
    mockedExportResumePdf.mockClear()
    vi.restoreAllMocks()
    restoreUrlMethod('createObjectURL', originalCreateObjectUrl)
    restoreUrlMethod('revokeObjectURL', originalRevokeObjectUrl)
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
    fireEvent.change(screen.getByRole('textbox', { name: 'Skill 1' }), {
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
    expect(screen.getByText('Schema, Store, UI')).toBeInTheDocument()
    expect(useResumeStore.getState().resume.skills[0]).toBe('Schema, Store, UI')
    expect(getPreviewParts().preview).toHaveAttribute(
      'data-preview-template',
      'modern-ats',
    )
    expect(modernTemplate).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Preview style: Modern ATS')).toBeInTheDocument()
  })

  it('changes the live preview styling when templates switch', () => {
    render(<App />)

    let previewParts = getPreviewParts()

    expect(previewParts.preview).toHaveAttribute(
      'data-preview-template',
      'classic-ats',
    )
    expect(previewParts.preview).toHaveAttribute(
      'data-preview-layout',
      'classic-centered',
    )
    expect(previewParts.preview).toHaveClass('font-serif', 'p-6')
    expect(previewParts.header).toHaveClass('text-center')
    expect(previewParts.skills).toHaveAttribute(
      'data-preview-skills-layout',
      'inline',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Modern ATS' }))
    previewParts = getPreviewParts()

    expect(previewParts.preview).toHaveAttribute(
      'data-preview-template',
      'modern-ats',
    )
    expect(previewParts.preview).toHaveAttribute(
      'data-preview-layout',
      'modern-accented',
    )
    expect(previewParts.preview).toHaveClass('font-sans', 'p-5')
    expect(previewParts.header).toHaveClass('border-l-4', 'text-left')
    expect(previewParts.skills).toHaveAttribute(
      'data-preview-skills-layout',
      'pills',
    )
    expect(previewParts.skills).toHaveClass('flex', 'flex-wrap')

    fireEvent.click(screen.getByRole('button', { name: 'Chinese Clean' }))
    previewParts = getPreviewParts()

    expect(previewParts.preview).toHaveAttribute(
      'data-preview-template',
      'chinese-clean',
    )
    expect(previewParts.preview).toHaveAttribute(
      'data-preview-layout',
      'chinese-clean',
    )
    expect(previewParts.preview).toHaveClass('font-sans', 'p-7')
    expect(previewParts.header).toHaveClass('border-b', 'text-left')
    expect(previewParts.skills).toHaveAttribute(
      'data-preview-skills-layout',
      'inline',
    )
    expect(previewParts.skills).toHaveTextContent(
      'TypeScript / React / Privacy UX',
    )
  })

  it('renders the PDF export control beside local export tools', () => {
    render(<App />)

    expect(
      screen.getByRole('button', { name: 'Export PDF' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Export JSON' }),
    ).toBeInTheDocument()
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
    fireEvent.click(
      screen.getByRole('button', { name: 'Add Work 2 highlight' }),
    )
    fireEvent.change(screen.getByLabelText('Work 2 highlight 1'), {
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

  it.each([
    {
      addButton: 'Add work',
      itemButton: 'Add Work 2 highlight',
      itemField: 'Work 2 highlight 1',
      itemRemoveButton: 'Remove Work 2 highlight 1',
      readLines: () => useResumeStore.getState().resume.work[1]?.highlights,
      section: 'Work experience',
    },
    {
      addButton: 'Add education',
      itemButton: 'Add Education 2 detail',
      itemField: 'Education 2 detail 1',
      itemRemoveButton: 'Remove Education 2 detail 1',
      readLines: () => useResumeStore.getState().resume.education[1]?.details,
      section: 'Education',
    },
    {
      addButton: 'Add project',
      itemButton: 'Add Project 2 highlight',
      itemField: 'Project 2 highlight 1',
      itemRemoveButton: 'Remove Project 2 highlight 1',
      readLines: () => useResumeStore.getState().resume.projects[1]?.highlights,
      section: 'Projects',
    },
  ])(
    'stores each $section list item without delimiter-based rewriting',
    ({
      addButton,
      itemButton,
      itemField,
      itemRemoveButton,
      readLines,
      section,
    }) => {
      render(<App />)

      fireEvent.click(screen.getByRole('button', { name: section }))
      fireEvent.click(screen.getByRole('button', { name: addButton }))
      fireEvent.click(screen.getByRole('button', { name: itemButton }))

      const literalItem = 'Research, design | delivery\nkept as one item'
      const input = screen.getByLabelText(itemField)

      fireEvent.change(input, { target: { value: literalItem } })

      expect(input).toHaveValue(literalItem)
      expect(readLines()).toEqual([literalItem])

      fireEvent.click(screen.getByRole('button', { name: itemRemoveButton }))

      expect(readLines()).toEqual([])
    },
  )

  it('edits links and skills as structured items without delimiter codecs', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Add link' }))
    fireEvent.change(screen.getByLabelText('Link label 1'), {
      target: { value: 'Portfolio | Labs, Notes' },
    })
    fireEvent.change(screen.getByLabelText('Link URL 1'), {
      target: { value: 'https://example.invalid/profile?a=1,b=2' },
    })

    expect(useResumeStore.getState().resume.basics.links).toEqual([
      {
        label: 'Portfolio | Labs, Notes',
        url: 'https://example.invalid/profile?a=1,b=2',
      },
    ])

    fireEvent.click(screen.getByRole('button', { name: 'Skills' }))
    fireEvent.change(screen.getByLabelText('Skill 1'), {
      target: { value: 'Research, design | delivery' },
    })

    expect(useResumeStore.getState().resume.skills[0]).toBe(
      'Research, design | delivery',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Remove skill 1' }))
    expect(useResumeStore.getState().resume.skills).toEqual([
      'React',
      'Privacy UX',
    ])
  })

  it('enforces list limits in editor controls', () => {
    useResumeStore
      .getState()
      .updateSkills(
        Array.from(
          { length: resumeLimits.skill.items },
          (_, index) => `Skill ${index + 1}`,
        ),
      )

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Skills' }))

    expect(screen.getByRole('button', { name: 'Add skill' })).toBeDisabled()
    expect(screen.getByLabelText('Skill 1')).toHaveAttribute(
      'maxlength',
      String(resumeLimits.skill.item),
    )
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

    const exportedBlob = firstCall[0]
    const exportedJson = JSON.parse(await exportedBlob.text()) as unknown

    expect(exportedJson).toMatchObject({
      schemaVersion: 1,
      resume: {
        basics: { name: 'Sample Candidate' },
        template: 'classic-ats',
      },
    })
    expect(parseResumeJson(JSON.stringify(exportedJson)).success).toBe(true)
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:resume-json')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('blocks JSON and PDF export when the draft violates the resume schema', async () => {
    const createObjectUrl = vi.fn<(blob: Blob) => string>()

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    })

    render(<App />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'not-an-email' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Export JSON' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Export blocked: fix invalid resume fields first.',
    )
    expect(createObjectUrl).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }))

    await waitFor(() => {
      expect(mockedExportResumePdf).not.toHaveBeenCalled()
    })
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Export blocked: fix invalid resume fields first.',
    )
  })

  it('exports the current in-memory resume as a browser-side PDF', async () => {
    let resolveExport: () => void = () => undefined
    const exportPromise = new Promise<void>((resolve) => {
      resolveExport = resolve
    })

    mockedExportResumePdf.mockReturnValueOnce(exportPromise)

    render(<App />)

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Fixture PDF Person' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Chinese Clean' }))
    const pdfButton = screen.getByRole('button', { name: 'Export PDF' })

    fireEvent.click(pdfButton)

    await waitFor(() => {
      expect(pdfButton).toHaveTextContent('Preparing PDF')
    })
    expect(pdfButton).toBeDisabled()

    await waitFor(() => {
      expect(mockedExportResumePdf).toHaveBeenCalledTimes(1)
    })

    expect(mockedExportResumePdf.mock.calls[0]?.[0]).toMatchObject({
      basics: { name: 'Fixture PDF Person' },
      template: 'chinese-clean',
    })

    await act(async () => {
      resolveExport()
      await exportPromise
    })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Generated PDF locally.',
    )
    expect(pdfButton).toHaveTextContent('Export PDF')
    expect(pdfButton).not.toBeDisabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('shows a local PDF export failure without rendering a link', async () => {
    mockedExportResumePdf.mockRejectedValueOnce(
      new Error('Fixture PDF export failed.'),
    )

    render(<App />)

    const pdfButton = screen.getByRole('button', { name: 'Export PDF' })

    fireEvent.click(pdfButton)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'PDF export failed. Try again in this browser.',
      )
    })

    expect(mockedExportResumePdf).toHaveBeenCalledTimes(1)
    expect(pdfButton).toHaveTextContent('Export PDF')
    expect(pdfButton).not.toBeDisabled()
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
      screen.getByRole('heading', {
        level: 3,
        name: 'Imported Fixture Person',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Imported Fixture Certificate, Imported Sample Institute',
      ),
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

  it('rejects an oversized import before reading the file', async () => {
    const oversizedFile = new File(['{}'], 'oversized-fixture.json', {
      type: 'application/json',
    })
    const textSpy = vi.spyOn(oversizedFile, 'text')

    Object.defineProperty(oversizedFile, 'size', {
      configurable: true,
      value: MAX_RESUME_JSON_BYTES + 1,
    })

    render(<App />)

    const importInput = screen.getByLabelText('Import resume JSON')

    fireEvent.change(importInput, {
      target: { files: [oversizedFile] },
    })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Import failed: the selected JSON file is too large.',
      )
    })
    expect(textSpy).not.toHaveBeenCalled()
    expect(importInput).toHaveValue('')
    expect(
      screen.getByRole('heading', { level: 3, name: 'Sample Candidate' }),
    ).toBeInTheDocument()
  })

  it('requires confirmation before clearing editable data', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Edited Fixture Person' },
    })
    const clearButton = screen.getByRole('button', {
      name: 'Clear to blank resume',
    })

    fireEvent.click(clearButton)

    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'Clear this resume?',
    )
    expect(screen.getByLabelText('Name')).toHaveValue('Edited Fixture Person')
    expect(screen.getByRole('button', { name: 'Confirm clear' })).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByLabelText('Name')).toHaveValue('Edited Fixture Person')
    expect(clearButton).toHaveFocus()

    fireEvent.click(clearButton)
    fireEvent.click(screen.getByRole('button', { name: 'Confirm clear' }))

    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(
      screen.getByRole('heading', { level: 3, name: 'Untitled resume' }),
    ).toBeInTheDocument()
    expect(screen.getByText('No work entries')).toBeInTheDocument()
  })

  it('requires confirmation before resetting to fake defaults', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Edited Fixture Person' },
    })
    const resetButton = screen.getByRole('button', {
      name: 'Reset fake defaults',
    })

    fireEvent.click(resetButton)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByLabelText('Name')).toHaveValue('Edited Fixture Person')
    expect(resetButton).toHaveFocus()

    fireEvent.click(resetButton)
    fireEvent.click(screen.getByRole('button', { name: 'Confirm reset' }))

    expect(screen.getByLabelText('Name')).toHaveValue('Sample Candidate')
    expect(resetButton).toHaveFocus()
  })
})
