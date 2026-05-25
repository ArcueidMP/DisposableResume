import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  Brush,
  Download,
  FileInput,
  FileText,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { createDefaultResume, createEmptyResume } from './resume/defaults'
import { exportResumePdf } from './pdf/exportResumePdf'
import { createJsonFilename } from './pdf/filenames'
import { resumeTemplateOptions } from './resume/schema'
import type {
  Resume,
  ResumeBasics,
  ResumeEducation,
  ResumeLink,
  ResumeProject,
  ResumeTemplate,
  ResumeWork,
} from './resume/types'
import { validateResume } from './resume/validation'
import { useResumeStore } from './store/resume-store'

const resumeSections = [
  'Basic info',
  'Work experience',
  'Education',
  'Projects',
  'Skills',
] as const

type ResumeSection = (typeof resumeSections)[number]
type ImportStatus = { kind: 'error' | 'success'; text: string } | null
type ExportStatus = { kind: 'error' | 'success'; text: string } | null

const inputClass =
  'rounded-md border border-[#cbd6c5] px-3 py-2 text-[#121612] outline-none transition focus:border-[#244d34] focus:ring-2 focus:ring-[#bed2c4]'
const textAreaClass = `${inputClass} min-h-24 resize-y`
const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-md border border-[#d8ded2] px-3 py-2 text-sm font-medium text-[#354238] transition hover:border-[#91ad98] hover:bg-[#f3f7f1] disabled:cursor-not-allowed disabled:opacity-60'
const dangerButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-md border border-[#ecc2bd] px-3 py-2 text-sm font-medium text-[#6f2b23] transition hover:border-[#ce8d85] hover:bg-[#fff4f2]'
const sectionButtonClass =
  'rounded-md border border-[#d8ded2] px-3 py-2 text-left text-sm text-[#354238] transition hover:border-[#91ad98] hover:bg-[#f3f7f1] aria-pressed:border-[#244d34] aria-pressed:bg-[#e4f3e8] aria-pressed:text-[#163221]'

function formatLinks(links: ResumeLink[]) {
  return links.map((link) => `${link.label} | ${link.url}`).join('\n')
}

function formatLines(lines: string[]) {
  return lines.join('\n')
}

function getTemplateLabel(template: ResumeTemplate) {
  return (
    resumeTemplateOptions.find((option) => option.id === template)?.label ??
    'Classic ATS'
  )
}

function parseLinks(value: string): ResumeLink[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [labelPart = '', urlPart] = line
        .split('|')
        .map((part) => part.trim())

      return {
        label: urlPart === undefined ? `Link ${index + 1}` : labelPart,
        url: urlPart ?? labelPart,
      }
    })
}

function parseLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function parseSkills(value: string) {
  return value
    .split(/[\n,]/)
    .map((skill) => skill.trim())
    .filter(Boolean)
}

function contactLine(basics: ResumeBasics) {
  return [basics.email, basics.phone, basics.location].filter(Boolean).join(' | ')
}

function TextInput({
  ariaLabel,
  label,
  onChange,
  type = 'text',
  value,
}: {
  ariaLabel?: string
  label: string
  onChange: (value: string) => void
  type?: string
  value: string
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#354238]">
      <span>{label}</span>
      <input
        aria-label={ariaLabel ?? label}
        className={inputClass}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  )
}

function TextAreaInput({
  ariaLabel,
  label,
  onChange,
  placeholder,
  value,
}: {
  ariaLabel?: string
  label: string
  onChange: (value: string) => void
  placeholder?: string
  value: string
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#354238]">
      <span>{label}</span>
      <textarea
        aria-label={ariaLabel ?? label}
        className={textAreaClass}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  )
}

function BasicsEditor({
  basics,
  linksDraft,
  onBasicsChange,
  onLinksChange,
}: {
  basics: ResumeBasics
  linksDraft: string
  onBasicsChange: (basics: Partial<ResumeBasics>) => void
  onLinksChange: (value: string) => void
}) {
  return (
    <fieldset className="grid gap-4">
      <legend className="text-base font-semibold text-[#121612]">Basics</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Name"
          onChange={(name) => onBasicsChange({ name })}
          value={basics.name}
        />
        <TextInput
          label="Email"
          onChange={(email) => onBasicsChange({ email })}
          type="email"
          value={basics.email}
        />
        <TextInput
          label="Phone"
          onChange={(phone) => onBasicsChange({ phone })}
          type="tel"
          value={basics.phone}
        />
        <TextInput
          label="Location"
          onChange={(location) => onBasicsChange({ location })}
          value={basics.location}
        />
      </div>
      <TextAreaInput
        label="Links"
        onChange={onLinksChange}
        placeholder="Portfolio | https://example.invalid"
        value={linksDraft}
      />
    </fieldset>
  )
}

function WorkEditor({
  onAdd,
  onRemove,
  onUpdate,
  work,
}: {
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, work: Partial<Omit<ResumeWork, 'id'>>) => void
  work: ResumeWork[]
}) {
  return (
    <section className="grid gap-4" aria-labelledby="work-editor-title">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[#121612]" id="work-editor-title">
          Work experience
        </h3>
        <button className={secondaryButtonClass} onClick={onAdd} type="button">
          <Plus aria-hidden="true" size={16} />
          Add work
        </button>
      </div>
      <div className="grid gap-4">
        {work.map((item, index) => (
          <article
            className="grid gap-4 rounded-lg border border-[#d8ded2] bg-[#fbfbf8] p-4"
            key={item.id}
          >
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-semibold text-[#121612]">Work {index + 1}</h4>
              <button
                aria-label={`Remove work item ${index + 1}`}
                className={dangerButtonClass}
                onClick={() => onRemove(item.id)}
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} />
                Remove
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                ariaLabel={`Work role ${index + 1}`}
                label="Role"
                onChange={(role) => onUpdate(item.id, { role })}
                value={item.role}
              />
              <TextInput
                ariaLabel={`Work organization ${index + 1}`}
                label="Organization"
                onChange={(organization) => onUpdate(item.id, { organization })}
                value={item.organization}
              />
              <TextInput
                ariaLabel={`Work location ${index + 1}`}
                label="Location"
                onChange={(location) => onUpdate(item.id, { location })}
                value={item.location}
              />
              <TextInput
                ariaLabel={`Work start date ${index + 1}`}
                label="Start"
                onChange={(startDate) => onUpdate(item.id, { startDate })}
                value={item.startDate}
              />
              <TextInput
                ariaLabel={`Work end date ${index + 1}`}
                label="End"
                onChange={(endDate) => onUpdate(item.id, { endDate })}
                value={item.endDate}
              />
            </div>
            <TextAreaInput
              ariaLabel={`Work highlights ${index + 1}`}
              label="Highlights"
              onChange={(highlights) =>
                onUpdate(item.id, { highlights: parseLines(highlights) })
              }
              value={formatLines(item.highlights)}
            />
          </article>
        ))}
      </div>
    </section>
  )
}

function EducationEditor({
  education,
  onAdd,
  onRemove,
  onUpdate,
}: {
  education: ResumeEducation[]
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, education: Partial<Omit<ResumeEducation, 'id'>>) => void
}) {
  return (
    <section className="grid gap-4" aria-labelledby="education-editor-title">
      <div className="flex items-center justify-between gap-3">
        <h3
          className="text-base font-semibold text-[#121612]"
          id="education-editor-title"
        >
          Education
        </h3>
        <button className={secondaryButtonClass} onClick={onAdd} type="button">
          <Plus aria-hidden="true" size={16} />
          Add education
        </button>
      </div>
      <div className="grid gap-4">
        {education.map((item, index) => (
          <article
            className="grid gap-4 rounded-lg border border-[#d8ded2] bg-[#fbfbf8] p-4"
            key={item.id}
          >
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-semibold text-[#121612]">
                Education {index + 1}
              </h4>
              <button
                aria-label={`Remove education item ${index + 1}`}
                className={dangerButtonClass}
                onClick={() => onRemove(item.id)}
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} />
                Remove
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                ariaLabel={`Education school ${index + 1}`}
                label="School"
                onChange={(school) => onUpdate(item.id, { school })}
                value={item.school}
              />
              <TextInput
                ariaLabel={`Education credential ${index + 1}`}
                label="Credential"
                onChange={(credential) => onUpdate(item.id, { credential })}
                value={item.credential}
              />
              <TextInput
                ariaLabel={`Education location ${index + 1}`}
                label="Location"
                onChange={(location) => onUpdate(item.id, { location })}
                value={item.location}
              />
              <TextInput
                ariaLabel={`Education start date ${index + 1}`}
                label="Start"
                onChange={(startDate) => onUpdate(item.id, { startDate })}
                value={item.startDate}
              />
              <TextInput
                ariaLabel={`Education end date ${index + 1}`}
                label="End"
                onChange={(endDate) => onUpdate(item.id, { endDate })}
                value={item.endDate}
              />
            </div>
            <TextAreaInput
              ariaLabel={`Education details ${index + 1}`}
              label="Details"
              onChange={(details) =>
                onUpdate(item.id, { details: parseLines(details) })
              }
              value={formatLines(item.details)}
            />
          </article>
        ))}
      </div>
    </section>
  )
}

function ProjectsEditor({
  onAdd,
  onRemove,
  onUpdate,
  projects,
}: {
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, project: Partial<Omit<ResumeProject, 'id'>>) => void
  projects: ResumeProject[]
}) {
  return (
    <section className="grid gap-4" aria-labelledby="projects-editor-title">
      <div className="flex items-center justify-between gap-3">
        <h3
          className="text-base font-semibold text-[#121612]"
          id="projects-editor-title"
        >
          Projects
        </h3>
        <button className={secondaryButtonClass} onClick={onAdd} type="button">
          <Plus aria-hidden="true" size={16} />
          Add project
        </button>
      </div>
      <div className="grid gap-4">
        {projects.map((item, index) => (
          <article
            className="grid gap-4 rounded-lg border border-[#d8ded2] bg-[#fbfbf8] p-4"
            key={item.id}
          >
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-semibold text-[#121612]">
                Project {index + 1}
              </h4>
              <button
                aria-label={`Remove project item ${index + 1}`}
                className={dangerButtonClass}
                onClick={() => onRemove(item.id)}
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} />
                Remove
              </button>
            </div>
            <TextInput
              ariaLabel={`Project name ${index + 1}`}
              label="Name"
              onChange={(name) => onUpdate(item.id, { name })}
              value={item.name}
            />
            <TextAreaInput
              ariaLabel={`Project description ${index + 1}`}
              label="Description"
              onChange={(description) => onUpdate(item.id, { description })}
              value={item.description}
            />
            <TextAreaInput
              ariaLabel={`Project highlights ${index + 1}`}
              label="Highlights"
              onChange={(highlights) =>
                onUpdate(item.id, { highlights: parseLines(highlights) })
              }
              value={formatLines(item.highlights)}
            />
          </article>
        ))}
      </div>
    </section>
  )
}

function SkillsEditor({
  onSkillsChange,
  skillsDraft,
}: {
  onSkillsChange: (value: string) => void
  skillsDraft: string
}) {
  return (
    <fieldset className="grid gap-4">
      <legend className="text-base font-semibold text-[#121612]">Skills</legend>
      <TextAreaInput
        label="Skills"
        onChange={onSkillsChange}
        value={skillsDraft}
      />
    </fieldset>
  )
}

function Preview({ resume, selectedTemplateLabel }: { resume: Resume; selectedTemplateLabel: string }) {
  const basicsContact = contactLine(resume.basics)

  return (
    <article
      aria-label="Resume preview shell"
      className="mt-5 min-h-96 rounded-lg border border-[#d8ded2] bg-[#fbfbf8] p-5 shadow-sm"
    >
      <p className="text-sm text-[#617064]">
        Preview style: {selectedTemplateLabel}
      </p>
      <h3 className="mt-5 text-2xl font-semibold text-[#121612]">
        {resume.basics.name || 'Untitled resume'}
      </h3>
      {basicsContact ? (
        <p className="mt-2 text-sm leading-6 text-[#354238]">{basicsContact}</p>
      ) : null}
      {resume.basics.links.length > 0 ? (
        <p className="mt-2 text-sm leading-6 text-[#354238]">
          {resume.basics.links
            .map((link) => `${link.label}: ${link.url}`)
            .join(' | ')}
        </p>
      ) : null}

      <div className="mt-7 grid gap-5">
        <section>
          <h4 className="text-sm font-semibold uppercase text-[#244d34]">
            Skills
          </h4>
          <p className="mt-2 text-sm leading-6 text-[#354238]">
            {resume.skills.length > 0 ? resume.skills.join(' | ') : 'No skills'}
          </p>
        </section>

        <section>
          <h4 className="text-sm font-semibold uppercase text-[#244d34]">Work</h4>
          {resume.work.length > 0 ? (
            resume.work.map((item) => (
              <div className="mt-2 text-sm text-[#354238]" key={item.id}>
                <p className="font-medium text-[#121612]">
                  {[item.role, item.organization].filter(Boolean).join(', ') ||
                    'Untitled work item'}
                </p>
                <p>
                  {[item.startDate, item.endDate].filter(Boolean).join(' - ')}
                  {item.location ? ` | ${item.location}` : ''}
                </p>
                {item.highlights.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {item.highlights.map((highlight, highlightIndex) => (
                      <li key={`${item.id}-highlight-${highlightIndex}`}>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))
          ) : (
            <p className="mt-2 text-sm text-[#617064]">No work entries</p>
          )}
        </section>

        <section>
          <h4 className="text-sm font-semibold uppercase text-[#244d34]">
            Education
          </h4>
          {resume.education.length > 0 ? (
            resume.education.map((item) => (
              <div className="mt-2 text-sm text-[#354238]" key={item.id}>
                <p className="font-medium text-[#121612]">
                  {[item.credential, item.school].filter(Boolean).join(', ') ||
                    'Untitled education item'}
                </p>
                <p>
                  {[item.startDate, item.endDate].filter(Boolean).join(' - ')}
                  {item.location ? ` | ${item.location}` : ''}
                </p>
                {item.details.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {item.details.map((detail, detailIndex) => (
                      <li key={`${item.id}-detail-${detailIndex}`}>{detail}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))
          ) : (
            <p className="mt-2 text-sm text-[#617064]">No education entries</p>
          )}
        </section>

        <section>
          <h4 className="text-sm font-semibold uppercase text-[#244d34]">
            Projects
          </h4>
          {resume.projects.length > 0 ? (
            resume.projects.map((item) => (
              <div className="mt-2 text-sm text-[#354238]" key={item.id}>
                <p className="font-medium text-[#121612]">
                  {item.name || 'Untitled project'}
                </p>
                {item.description ? <p>{item.description}</p> : null}
                {item.highlights.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {item.highlights.map((highlight, highlightIndex) => (
                      <li key={`${item.id}-highlight-${highlightIndex}`}>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))
          ) : (
            <p className="mt-2 text-sm text-[#617064]">No project entries</p>
          )}
        </section>
      </div>
    </article>
  )
}

function App() {
  const resume = useResumeStore((state) => state.resume)
  const replaceResume = useResumeStore((state) => state.replaceResume)
  const updateBasics = useResumeStore((state) => state.updateBasics)
  const updateSkills = useResumeStore((state) => state.updateSkills)
  const addWork = useResumeStore((state) => state.addWork)
  const updateWork = useResumeStore((state) => state.updateWork)
  const removeWork = useResumeStore((state) => state.removeWork)
  const addEducation = useResumeStore((state) => state.addEducation)
  const updateEducation = useResumeStore((state) => state.updateEducation)
  const removeEducation = useResumeStore((state) => state.removeEducation)
  const addProject = useResumeStore((state) => state.addProject)
  const updateProject = useResumeStore((state) => state.updateProject)
  const removeProject = useResumeStore((state) => state.removeProject)
  const selectTemplate = useResumeStore((state) => state.selectTemplate)
  const clearResume = useResumeStore((state) => state.clearResume)
  const resetToDefaults = useResumeStore((state) => state.resetToDefaults)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [activeSection, setActiveSection] =
    useState<ResumeSection>('Basic info')
  const [linksDraft, setLinksDraft] = useState(formatLinks(resume.basics.links))
  const [skillsDraft, setSkillsDraft] = useState(resume.skills.join(', '))
  const [importStatus, setImportStatus] = useState<ImportStatus>(null)
  const [exportStatus, setExportStatus] = useState<ExportStatus>(null)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  const selectedTemplateLabel = getTemplateLabel(resume.template)

  function syncDrafts(nextResume: Resume) {
    setLinksDraft(formatLinks(nextResume.basics.links))
    setSkillsDraft(nextResume.skills.join(', '))
  }

  function handleLinksChange(value: string) {
    setLinksDraft(value)
    updateBasics({ links: parseLinks(value) })
  }

  function handleSkillsChange(value: string) {
    setSkillsDraft(value)
    updateSkills(parseSkills(value))
  }

  function handleExportJson() {
    const blob = new Blob([JSON.stringify(resume, null, 2)], {
      type: 'application/json',
    })
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = objectUrl
    link.download = createJsonFilename()
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
  }

  async function handleExportPdf() {
    if (isExportingPdf) {
      return
    }

    setExportStatus(null)
    setIsExportingPdf(true)

    try {
      await exportResumePdf(resume)
      setExportStatus({
        kind: 'success',
        text: 'Generated PDF locally.',
      })
    } catch {
      setExportStatus({
        kind: 'error',
        text: 'PDF export failed. Try again in this browser.',
      })
    } finally {
      setIsExportingPdf(false)
    }
  }

  async function handleImportJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (file === undefined) {
      return
    }

    try {
      const parsedJson = JSON.parse(await file.text()) as unknown
      const parsedResume = validateResume(parsedJson)

      if (!parsedResume.success) {
        setImportStatus({
          kind: 'error',
          text: 'Import failed: choose a valid DisposableResume JSON file.',
        })
        return
      }

      replaceResume(parsedResume.data)
      syncDrafts(parsedResume.data)
      setImportStatus({
        kind: 'success',
        text: 'Imported validated JSON locally.',
      })
    } catch {
      setImportStatus({
        kind: 'error',
        text: 'Import failed: choose a valid DisposableResume JSON file.',
      })
    } finally {
      event.target.value = ''
    }
  }

  function handleClear() {
    const nextResume = createEmptyResume()

    clearResume()
    syncDrafts(nextResume)
    setImportStatus(null)
    setExportStatus(null)
  }

  function handleReset() {
    const nextResume = createDefaultResume()

    resetToDefaults()
    syncDrafts(nextResume)
    setImportStatus(null)
    setExportStatus(null)
  }

  function renderEditor() {
    if (activeSection === 'Basic info') {
      return (
        <BasicsEditor
          basics={resume.basics}
          linksDraft={linksDraft}
          onBasicsChange={updateBasics}
          onLinksChange={handleLinksChange}
        />
      )
    }

    if (activeSection === 'Work experience') {
      return (
        <WorkEditor
          onAdd={addWork}
          onRemove={removeWork}
          onUpdate={updateWork}
          work={resume.work}
        />
      )
    }

    if (activeSection === 'Education') {
      return (
        <EducationEditor
          education={resume.education}
          onAdd={addEducation}
          onRemove={removeEducation}
          onUpdate={updateEducation}
        />
      )
    }

    if (activeSection === 'Projects') {
      return (
        <ProjectsEditor
          onAdd={addProject}
          onRemove={removeProject}
          onUpdate={updateProject}
          projects={resume.projects}
        />
      )
    }

    return (
      <SkillsEditor
        onSkillsChange={handleSkillsChange}
        skillsDraft={skillsDraft}
      />
    )
  }

  return (
    <main className="min-h-screen bg-[#f6f7f3] text-[#1c211c]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-[#d8ded2] py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-[#617064]">Zero-retention resume builder</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#121612]">
              DisposableResume
            </h1>
          </div>
          <div
            aria-label="Privacy boundaries"
            className="flex flex-wrap gap-2 text-sm"
          >
            {['No account', 'Browser-only', 'No telemetry'].map((item) => (
              <span
                className="inline-flex items-center gap-2 rounded-md border border-[#bed2c4] bg-[#eff7f1] px-3 py-2 text-[#25402d]"
                key={item}
              >
                <ShieldCheck aria-hidden="true" size={16} />
                {item}
              </span>
            ))}
          </div>
        </header>

        <section className="grid flex-1 gap-4 py-4 lg:grid-cols-[260px_minmax(0,1fr)_420px]">
          <aside className="rounded-lg border border-[#d8ded2] bg-white p-4">
            <div className="flex items-center gap-2">
              <FileText aria-hidden="true" size={20} />
              <h2 className="text-lg font-semibold text-[#121612]">Sections</h2>
            </div>
            <div className="mt-4 grid gap-2">
              {resumeSections.map((section) => (
                <button
                  aria-pressed={activeSection === section}
                  className={sectionButtonClass}
                  key={section}
                  onClick={() => setActiveSection(section)}
                  type="button"
                >
                  {section}
                </button>
              ))}
            </div>
          </aside>

          <section
            aria-labelledby="editor-title"
            className="rounded-lg border border-[#d8ded2] bg-white p-5"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-sm text-[#617064]">Current section</p>
                  <h2
                    className="mt-1 text-2xl font-semibold text-[#121612]"
                    id="editor-title"
                  >
                    {activeSection}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={secondaryButtonClass}
                    disabled={isExportingPdf}
                    onClick={handleExportPdf}
                    type="button"
                  >
                    <Download aria-hidden="true" size={16} />
                    {isExportingPdf ? 'Preparing PDF' : 'Export PDF'}
                  </button>
                  <button
                    className={secondaryButtonClass}
                    onClick={handleExportJson}
                    type="button"
                  >
                    <Download aria-hidden="true" size={16} />
                    Export JSON
                  </button>
                  <button
                    className={secondaryButtonClass}
                    onClick={() => importInputRef.current?.click()}
                    type="button"
                  >
                    <FileInput aria-hidden="true" size={16} />
                    Import JSON
                  </button>
                  <input
                    accept="application/json,.json"
                    aria-label="Import resume JSON"
                    className="sr-only"
                    onChange={handleImportJson}
                    ref={importInputRef}
                    type="file"
                  />
                  <button
                    className={secondaryButtonClass}
                    onClick={handleClear}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={16} />
                    Clear to blank resume
                  </button>
                  <button
                    className={secondaryButtonClass}
                    onClick={handleReset}
                    type="button"
                  >
                    <RotateCcw aria-hidden="true" size={16} />
                    Reset fake defaults
                  </button>
                </div>
              </div>
              {importStatus ? (
                <p
                  className={
                    importStatus.kind === 'error'
                      ? 'rounded-md border border-[#ecc2bd] bg-[#fff4f2] px-3 py-2 text-sm text-[#6f2b23]'
                      : 'rounded-md border border-[#bed2c4] bg-[#eff7f1] px-3 py-2 text-sm text-[#25402d]'
                  }
                  role={importStatus.kind === 'error' ? 'alert' : 'status'}
                >
                  {importStatus.text}
                </p>
              ) : null}
              {exportStatus ? (
                <p
                  className={
                    exportStatus.kind === 'error'
                      ? 'rounded-md border border-[#ecc2bd] bg-[#fff4f2] px-3 py-2 text-sm text-[#6f2b23]'
                      : 'rounded-md border border-[#bed2c4] bg-[#eff7f1] px-3 py-2 text-sm text-[#25402d]'
                  }
                  role={exportStatus.kind === 'error' ? 'alert' : 'status'}
                >
                  {exportStatus.text}
                </p>
              ) : null}
            </div>

            <div className="mt-8 grid gap-6">{renderEditor()}</div>
          </section>

          <aside className="rounded-lg border border-[#d8ded2] bg-white p-4">
            <div className="flex items-center gap-2">
              <Brush aria-hidden="true" size={20} />
              <h2 className="text-lg font-semibold text-[#121612]">Template</h2>
            </div>

            <div
              aria-label="Resume template"
              className="mt-4 grid gap-2"
              role="group"
            >
              {resumeTemplateOptions.map((template) => (
                <button
                  aria-pressed={resume.template === template.id}
                  className={sectionButtonClass}
                  key={template.id}
                  onClick={() => selectTemplate(template.id)}
                  type="button"
                >
                  {template.label}
                </button>
              ))}
            </div>

            <Preview
              resume={resume}
              selectedTemplateLabel={selectedTemplateLabel}
            />
          </aside>
        </section>
      </div>
    </main>
  )
}

export default App
