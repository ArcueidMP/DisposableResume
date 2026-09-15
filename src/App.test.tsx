import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./pdf/exportResumePdf', () => ({
  createResumePdfBlob: vi.fn(),
  exportResumePdf: vi.fn(),
}))

import App from './App'
import { createResumePdfBlob, exportResumePdf } from './pdf/exportResumePdf'
import { createDefaultResume } from './resume/defaults'
import { MAX_RESUME_JSON_BYTES, parseResumeJson } from './resume/json'
import { resumeLimits } from './resume/schema'
import type { ResumeDraft } from './resume/types'
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

function createFixturePdfBlob() {
  return new Blob(['%PDF-1.7 fixture'], { type: 'application/pdf' })
}

function installObjectUrlFakes() {
  let objectUrlCount = 0
  const createObjectUrl = vi.fn<(blob: Blob) => string>(() => {
    objectUrlCount += 1

    return `blob:preview/${objectUrlCount}`
  })
  const revokeObjectUrl = vi.fn<(objectUrl: string) => void>()

  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: createObjectUrl,
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: revokeObjectUrl,
  })

  return { createObjectUrl, revokeObjectUrl }
}

function getPreviewFrame() {
  return screen.getByTitle('Resume PDF preview')
}

function getPreviewStatus() {
  return document
    .querySelector('[data-preview-status]')
    ?.getAttribute('data-preview-status')
}

function prepareResume(
  update: (resume: ReturnType<typeof createDefaultResume>) => void,
) {
  const resume = createDefaultResume()
  update(resume)
  useResumeStore.setState({ resume })
}

describe('App', () => {
  const mockedExportResumePdf = vi.mocked(exportResumePdf)
  const mockedCreateResumePdfBlob = vi.mocked(createResumePdfBlob)
  let objectUrlFakes: ReturnType<typeof installObjectUrlFakes>

  function lastPreviewRender(): ResumeDraft {
    const lastCall = mockedCreateResumePdfBlob.mock.calls.at(-1)

    if (lastCall === undefined) {
      throw new Error('Expected the live preview to render a PDF.')
    }

    return lastCall[0]
  }

  beforeEach(() => {
    useResumeStore.getState().resetToDefaults()
    mockedExportResumePdf.mockResolvedValue(undefined)
    mockedCreateResumePdfBlob.mockImplementation(() =>
      Promise.resolve(createFixturePdfBlob()),
    )
    objectUrlFakes = installObjectUrlFakes()
  })

  afterEach(() => {
    mockedExportResumePdf.mockReset()
    mockedCreateResumePdfBlob.mockReset()
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

  it('updates basics, skills, and template selection locally', async () => {
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

    expect(useResumeStore.getState().resume.skills[0]).toBe('Schema, Store, UI')
    expect(modernTemplate).toHaveAttribute('aria-pressed', 'true')

    // The preview renders the edited draft itself, not a validated copy.
    await waitFor(() => {
      expect(lastPreviewRender()).toMatchObject({
        basics: {
          email: 'fixture.person@example.invalid',
          location: 'Fixture City, ZZ',
          name: 'Fixture Person',
          phone: '+0 111 222 3333',
        },
        skills: ['Schema, Store, UI', 'React', 'Privacy UX'],
        template: 'modern-ats',
      })
    })
    await waitFor(() => {
      expect(getPreviewStatus()).toBe('ready')
    })
    expect(getPreviewFrame()).toHaveAttribute(
      'src',
      expect.stringMatching(/^blob:preview\/\d+#toolbar=0&navpanes=0/),
    )
  })

  it('renders each selected template through the PDF export pipeline', async () => {
    render(<App />)

    expect(getPreviewStatus()).toBe('rendering')
    expect(screen.getByText('Rendering')).toBeInTheDocument()

    await waitFor(() => {
      expect(getPreviewFrame()).toHaveAttribute(
        'src',
        'blob:preview/1#toolbar=0&navpanes=0&view=FitH',
      )
    })
    expect(lastPreviewRender().template).toBe('classic-ats')
    expect(screen.getByText('Up to date')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Modern ATS' }))

    await waitFor(() => {
      expect(lastPreviewRender().template).toBe('modern-ats')
    })
    await waitFor(() => {
      expect(getPreviewFrame()).toHaveAttribute(
        'src',
        expect.stringContaining('blob:preview/2#'),
      )
    })

    fireEvent.click(screen.getByRole('button', { name: 'Chinese Clean' }))

    await waitFor(() => {
      expect(lastPreviewRender().template).toBe('chinese-clean')
    })
    await waitFor(() => {
      expect(getPreviewFrame()).toHaveAttribute(
        'src',
        expect.stringContaining('blob:preview/3#'),
      )
    })

    // Replaced previews are revoked; the one on screen stays alive.
    expect(objectUrlFakes.revokeObjectUrl.mock.calls.flat()).toEqual([
      'blob:preview/1',
      'blob:preview/2',
    ])
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('keeps the last rendered preview on screen while a newer render is pending', async () => {
    render(<App />)

    await waitFor(() => {
      expect(getPreviewFrame()).toHaveAttribute(
        'src',
        expect.stringContaining('blob:preview/1#'),
      )
    })

    let resolveRender: (blob: Blob) => void = () => undefined

    mockedCreateResumePdfBlob.mockImplementationOnce(
      () =>
        new Promise<Blob>((resolve) => {
          resolveRender = resolve
        }),
    )

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Fixture Person' },
    })

    await waitFor(() => {
      expect(getPreviewStatus()).toBe('rendering')
    })
    expect(screen.getByText('Updating')).toBeInTheDocument()
    expect(getPreviewFrame()).toHaveAttribute(
      'src',
      expect.stringContaining('blob:preview/1#'),
    )
    expect(objectUrlFakes.revokeObjectUrl).not.toHaveBeenCalled()

    await act(async () => {
      resolveRender(createFixturePdfBlob())
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(getPreviewFrame()).toHaveAttribute(
        'src',
        expect.stringContaining('blob:preview/2#'),
      )
    })
    expect(objectUrlFakes.revokeObjectUrl.mock.calls.flat()).toEqual([
      'blob:preview/1',
    ])
    expect(getPreviewStatus()).toBe('ready')
  })

  it('reports a failed preview render and keeps export available', async () => {
    mockedCreateResumePdfBlob.mockRejectedValue(
      new Error('Fixture preview failed.'),
    )

    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'The PDF preview could not be rendered in this browser.',
      )
    })
    expect(getPreviewStatus()).toBe('error')
    expect(screen.getByText('Preview unavailable')).toBeInTheDocument()
    expect(screen.queryByTitle('Resume PDF preview')).not.toBeInTheDocument()
    expect(objectUrlFakes.createObjectUrl).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeEnabled()
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

  it('adds, updates, and removes a work item from the UI', async () => {
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

    expect(screen.getByLabelText('Work 2 highlight 1')).toHaveValue(
      'Prepared safe client-only editor fixtures.',
    )
    await waitFor(() => {
      expect(lastPreviewRender().work[1]).toMatchObject({
        highlights: ['Prepared safe client-only editor fixtures.'],
        organization: 'Example Fixture Studio',
        role: 'Fixture Builder',
      })
    })

    fireEvent.click(screen.getByRole('button', { name: 'Remove work item 2' }))

    expect(screen.queryByLabelText('Work role 2')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(lastPreviewRender().work).toHaveLength(1)
    })
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

  it.each([
    {
      button: 'Move link 2 of 2 up',
      expected: ['Second', 'First'],
      prepare: () =>
        prepareResume((resume) => {
          resume.basics.links = [
            { label: 'First', url: 'https://first.example.invalid' },
            { label: 'Second', url: 'https://second.example.invalid' },
          ]
        }),
      read: () =>
        useResumeStore.getState().resume.basics.links.map((link) => link.label),
      section: undefined,
    },
    {
      button: 'Move skill 2 of 3 up',
      expected: ['React', 'TypeScript', 'Privacy UX'],
      prepare: () => undefined,
      read: () => useResumeStore.getState().resume.skills,
      section: 'Skills',
    },
    {
      button: 'Move work item 2 of 2 up',
      expected: ['work-example-2', 'work-example-1'],
      prepare: () =>
        prepareResume((resume) => {
          resume.work.push({
            ...structuredClone(resume.work[0]!),
            id: 'work-example-2',
            role: 'Second fixture role',
          })
        }),
      read: () => useResumeStore.getState().resume.work.map((item) => item.id),
      section: 'Work experience',
    },
    {
      button: 'Move work 1 highlight 2 of 2 up',
      expected: [
        'Shaped readable interfaces for editing structured candidate details.',
        'Built privacy-minded browser tools with client-only data handling.',
      ],
      prepare: () => undefined,
      read: () => useResumeStore.getState().resume.work[0]?.highlights,
      section: 'Work experience',
    },
    {
      button: 'Move education item 2 of 2 up',
      expected: ['education-example-2', 'education-example-1'],
      prepare: () =>
        prepareResume((resume) => {
          resume.education.push({
            ...structuredClone(resume.education[0]!),
            id: 'education-example-2',
            school: 'Second Fixture Institute',
          })
        }),
      read: () =>
        useResumeStore.getState().resume.education.map((item) => item.id),
      section: 'Education',
    },
    {
      button: 'Move education 1 detail 2 of 2 up',
      expected: [
        'Second fixture detail.',
        'Completed a fake-only fixture program for product builders.',
      ],
      prepare: () =>
        prepareResume((resume) => {
          resume.education[0]?.details.push('Second fixture detail.')
        }),
      read: () => useResumeStore.getState().resume.education[0]?.details,
      section: 'Education',
    },
    {
      button: 'Move project item 2 of 2 up',
      expected: ['project-example-2', 'project-example-1'],
      prepare: () =>
        prepareResume((resume) => {
          resume.projects.push({
            ...structuredClone(resume.projects[0]!),
            id: 'project-example-2',
            name: 'Second Fixture Project',
          })
        }),
      read: () =>
        useResumeStore.getState().resume.projects.map((item) => item.id),
      section: 'Projects',
    },
    {
      button: 'Move project 1 highlight 2 of 2 up',
      expected: [
        'Kept fixture data fictional and suitable for tests.',
        'Modeled basics, skills, work, education, and project sections.',
      ],
      prepare: () => undefined,
      read: () => useResumeStore.getState().resume.projects[0]?.highlights,
      section: 'Projects',
    },
  ])(
    'connects the $button editor control to its store move action',
    ({ button, expected, prepare, read, section }) => {
      prepare()
      render(<App />)

      if (section !== undefined) {
        fireEvent.click(screen.getByRole('button', { name: section }))
      }

      fireEvent.click(screen.getByRole('button', { name: button }))

      expect(read()).toEqual(expected)
    },
  )

  it('disables boundary moves and follows a moved item with focus and status', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Skills' }))

    expect(
      screen.getByRole('button', { name: 'Move skill 1 of 3 up' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Move skill 3 of 3 down' }),
    ).toBeDisabled()

    fireEvent.click(
      screen.getByRole('button', { name: 'Move skill 2 of 3 up' }),
    )

    expect(
      screen.getByRole('button', { name: 'Move skill 1 of 3 down' }),
    ).toHaveFocus()
    expect(
      screen
        .getByText('Moved skill to position 1 of 3.')
        .closest('[aria-live="polite"]'),
    ).toBeInTheDocument()
    expect(useResumeStore.getState().resume.skills).toEqual([
      'React',
      'TypeScript',
      'Privacy UX',
    ])

    fireEvent.click(
      screen.getByRole('button', { name: 'Move skill 1 of 3 down' }),
    )

    expect(
      screen.getByRole('button', { name: 'Move skill 2 of 3 down' }),
    ).toHaveFocus()
    expect(
      screen
        .getByText('Moved skill to position 2 of 3.')
        .closest('[aria-live="polite"]'),
    ).toBeInTheDocument()
  })

  it('exports the current resume as JSON without rendering a link', async () => {
    const { createObjectUrl, revokeObjectUrl } = objectUrlFakes
    const clickedHrefs: string[] = []

    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      function recordClick(this: HTMLAnchorElement) {
        clickedHrefs.push(this.href)
      },
    )

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Export JSON' }))

    const jsonExports = createObjectUrl.mock.calls.flatMap(([blob], index) => {
      const result = createObjectUrl.mock.results[index]

      return blob.type === 'application/json' && result?.type === 'return'
        ? [{ blob, objectUrl: result.value }]
        : []
    })
    const jsonExport = jsonExports[0]

    if (jsonExport === undefined) {
      throw new Error('Expected JSON export to create an object URL.')
    }

    const exportedJson = JSON.parse(await jsonExport.blob.text()) as unknown
    const exportedUrl = jsonExport.objectUrl

    expect(jsonExports).toHaveLength(1)
    expect(exportedJson).toMatchObject({
      schemaVersion: 1,
      resume: {
        basics: { name: 'Sample Candidate' },
        template: 'classic-ats',
      },
    })
    expect(parseResumeJson(JSON.stringify(exportedJson)).success).toBe(true)
    expect(clickedHrefs).toEqual([exportedUrl])
    expect(revokeObjectUrl).toHaveBeenCalledWith(exportedUrl)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('blocks JSON and PDF export when the draft violates the resume schema', async () => {
    const { createObjectUrl } = objectUrlFakes

    render(<App />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'not-an-email' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Export JSON' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Export blocked: fix invalid resume fields first.',
    )
    expect(
      createObjectUrl.mock.calls.filter(
        ([blob]) => blob.type === 'application/json',
      ),
    ).toHaveLength(0)

    // The preview keeps rendering the draft even while export is blocked.
    await waitFor(() => {
      expect(lastPreviewRender().basics.email).toBe('not-an-email')
    })

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

    expect(screen.getByLabelText('Name')).toHaveValue('Imported Fixture Person')
    expect(useResumeStore.getState().resume.education).toEqual(
      importedResume.education,
    )
    await waitFor(() => {
      expect(lastPreviewRender()).toMatchObject({
        basics: { name: 'Imported Fixture Person' },
        education: [{ school: 'Imported Sample Institute' }],
      })
    })
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

    expect(screen.getByLabelText('Name')).toHaveValue('Sample Candidate')
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
    expect(screen.getByLabelText('Name')).toHaveValue('Sample Candidate')
  })

  it('requires confirmation before clearing editable data', async () => {
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
    expect(useResumeStore.getState().resume.work).toEqual([])
    await waitFor(() => {
      expect(lastPreviewRender()).toMatchObject({
        basics: { name: '' },
        work: [],
      })
    })
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
