import type { ReactNode } from 'react'
import { Brush } from 'lucide-react'
import {
  createResumePresentation,
  type ResumePresentation,
  type ResumePresentationSection,
} from '../resume/presentation'
import { resumeTemplateOptions } from '../resume/schema'
import type { ResumeTemplate } from '../resume/types'
import { useResumeStore } from '../store/resume-store'
import { sectionButtonClass } from '../ui/controls'

type PreviewSkillLayout = 'inline' | 'pills'

type PreviewTemplateStyle = {
  body: string
  contact: string
  content: string
  eyebrow: string
  header: string
  item: string
  itemTitle: string
  layout: string
  links: string
  list: string
  muted: string
  name: string
  section: string
  sectionTitle: string
  shell: string
  skillItem: string
  skillLayout: PreviewSkillLayout
  skillList: string
  skillSeparator: string
}

const previewTemplateStyles = {
  'classic-ats': {
    body: 'text-sm leading-6 text-[#2d312d]',
    contact: 'mt-2 text-sm leading-6 text-[#303530]',
    content: 'mt-7 grid gap-5',
    eyebrow: 'text-xs font-semibold uppercase text-[#5e655e]',
    header: 'border-b border-[#a9afa7] pb-4 text-center',
    item: 'mt-3 text-sm text-[#303530]',
    itemTitle: 'font-bold text-[#111411]',
    layout: 'classic-centered',
    links: 'mt-2 text-sm leading-6 text-[#303530]',
    list: 'mt-2 list-disc space-y-1 pl-5',
    muted: 'mt-2 text-sm text-[#6a7068]',
    name: 'mt-4 text-2xl font-bold text-[#111411]',
    section: '',
    sectionTitle:
      'border-b border-[#c4c9c0] pb-1 text-xs font-bold uppercase text-[#111411]',
    shell:
      'mt-5 min-h-96 rounded-md border border-[#c7cdc4] bg-white p-6 font-serif shadow-sm',
    skillItem: '',
    skillLayout: 'inline',
    skillList: 'mt-2 text-sm leading-6 text-[#2d312d]',
    skillSeparator: ' | ',
  },
  'modern-ats': {
    body: 'text-sm leading-6 text-[#253642]',
    contact: 'mt-2 text-sm leading-6 text-[#304454]',
    content: 'mt-5 grid gap-4',
    eyebrow: 'text-xs font-semibold uppercase text-[#2f6f73]',
    header:
      'border-l-4 border-[#2f6f73] bg-white py-4 pl-4 pr-3 text-left shadow-sm',
    item: 'mt-3 text-sm text-[#304454]',
    itemTitle: 'font-semibold text-[#14212a]',
    layout: 'modern-accented',
    links: 'mt-2 text-sm leading-6 text-[#304454]',
    list: 'mt-2 list-disc space-y-1 pl-5',
    muted: 'mt-2 text-sm text-[#657684]',
    name: 'mt-3 text-2xl font-semibold text-[#14212a]',
    section: 'rounded-md border border-[#d6e0e7] bg-white px-4 py-3 shadow-sm',
    sectionTitle: 'text-xs font-bold uppercase text-[#2f6f73]',
    shell:
      'mt-5 min-h-96 rounded-lg border border-[#b7c7d6] bg-[#f8fbff] p-5 font-sans shadow-sm',
    skillItem:
      'rounded-md border border-[#c9dde0] bg-[#edf7f8] px-2.5 py-1 text-xs font-medium text-[#1f565a]',
    skillLayout: 'pills',
    skillList: 'mt-3 flex flex-wrap gap-2',
    skillSeparator: '',
  },
  'chinese-clean': {
    body: 'text-sm leading-7 text-[#2e2a27]',
    contact: 'mt-2 text-sm leading-6 text-[#4b4540]',
    content: 'mt-8 grid gap-6',
    eyebrow: 'text-xs font-semibold uppercase text-[#8a4b3c]',
    header: 'border-b border-[#d8d1c5] pb-5 text-left',
    item: 'mt-3 text-sm text-[#4b4540]',
    itemTitle: 'font-medium text-[#191715]',
    layout: 'chinese-clean',
    links: 'mt-2 text-sm leading-6 text-[#4b4540]',
    list: 'mt-2 list-disc space-y-1 pl-5 marker:text-[#8a4b3c]',
    muted: 'mt-2 text-sm text-[#756e66]',
    name: 'mt-3 text-2xl font-medium text-[#191715]',
    section: 'border-b border-[#ebe5dc] pb-5 last:border-b-0 last:pb-0',
    sectionTitle: 'text-xs font-semibold uppercase text-[#8a4b3c]',
    shell:
      'mt-5 min-h-96 rounded-lg border border-[#ded8d2] bg-[#fffdf8] p-7 font-sans shadow-sm',
    skillItem: '',
    skillLayout: 'inline',
    skillList: 'mt-2 text-sm leading-7 text-[#2e2a27]',
    skillSeparator: ' / ',
  },
} satisfies Record<ResumeTemplate, PreviewTemplateStyle>

function getTemplateLabel(template: ResumeTemplate) {
  const option = resumeTemplateOptions.find(
    (candidate) => candidate.id === template,
  )

  if (option === undefined) {
    throw new Error('Unsupported resume preview template.')
  }

  return option.label
}

function PreviewSkills({
  skills,
  styles,
}: {
  skills: readonly string[]
  styles: PreviewTemplateStyle
}) {
  if (skills.length === 0) {
    return <p className={styles.muted}>No skills</p>
  }

  if (styles.skillLayout === 'pills') {
    return (
      <ul className={styles.skillList} data-preview-skills-layout="pills">
        {skills.map((skill, skillIndex) => (
          <li className={styles.skillItem} key={`skill-${skillIndex}`}>
            {skill}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <p className={styles.skillList} data-preview-skills-layout="inline">
      {skills.join(styles.skillSeparator)}
    </p>
  )
}

const previewSectionTitles = {
  skills: 'Skills',
  work: 'Work',
  education: 'Education',
  projects: 'Projects',
} satisfies Record<ResumePresentationSection['kind'], string>

function PreviewSection({
  section,
  styles,
}: {
  section: ResumePresentationSection
  styles: PreviewTemplateStyle
}) {
  let content: ReactNode

  switch (section.kind) {
    case 'skills':
      content = <PreviewSkills skills={section.items} styles={styles} />
      break
    case 'work':
      content =
        section.items.length > 0 ? (
          section.items.map((item) => (
            <div className={styles.item} key={item.id}>
              <p className={styles.itemTitle}>
                {[item.role, item.organization].filter(Boolean).join(', ') ||
                  'Untitled work item'}
              </p>
              {item.meta ? <p className={styles.body}>{item.meta}</p> : null}
              {item.highlights.length > 0 ? (
                <ul className={styles.list}>
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
          <p className={styles.muted}>No work entries</p>
        )
      break
    case 'education':
      content =
        section.items.length > 0 ? (
          section.items.map((item) => (
            <div className={styles.item} key={item.id}>
              <p className={styles.itemTitle}>
                {[item.credential, item.school].filter(Boolean).join(', ') ||
                  'Untitled education item'}
              </p>
              {item.meta ? <p className={styles.body}>{item.meta}</p> : null}
              {item.details.length > 0 ? (
                <ul className={styles.list}>
                  {item.details.map((detail, detailIndex) => (
                    <li key={`${item.id}-detail-${detailIndex}`}>{detail}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))
        ) : (
          <p className={styles.muted}>No education entries</p>
        )
      break
    case 'projects':
      content =
        section.items.length > 0 ? (
          section.items.map((item) => (
            <div className={styles.item} key={item.id}>
              <p className={styles.itemTitle}>
                {item.name || 'Untitled project'}
              </p>
              {item.description ? (
                <p className={styles.body}>{item.description}</p>
              ) : null}
              {item.highlights.length > 0 ? (
                <ul className={styles.list}>
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
          <p className={styles.muted}>No project entries</p>
        )
      break
  }

  return (
    <section className={styles.section}>
      <h4 className={styles.sectionTitle}>
        {previewSectionTitles[section.kind]}
      </h4>
      {content}
    </section>
  )
}

function Preview({
  presentation,
  selectedTemplateLabel,
}: {
  presentation: ResumePresentation
  selectedTemplateLabel: string
}) {
  const styles = previewTemplateStyles[presentation.template]

  return (
    <article
      aria-label="Resume preview shell"
      className={styles.shell}
      data-preview-layout={styles.layout}
      data-preview-template={presentation.template}
    >
      <header className={styles.header} data-preview-header="true">
        <p className={styles.eyebrow}>Preview style: {selectedTemplateLabel}</p>
        <h3 className={styles.name}>
          {presentation.header.name || 'Untitled resume'}
        </h3>
        {presentation.header.contact ? (
          <p className={styles.contact}>{presentation.header.contact}</p>
        ) : null}
        {presentation.header.links.length > 0 ? (
          <p className={styles.links}>
            {presentation.header.links.join(' | ')}
          </p>
        ) : null}
      </header>

      <div className={styles.content}>
        {presentation.sections.map((section) => (
          <PreviewSection
            key={section.kind}
            section={section}
            styles={styles}
          />
        ))}
      </div>
    </article>
  )
}

export function ResumePreviewPanel() {
  const resume = useResumeStore((state) => state.resume)
  const selectTemplate = useResumeStore((state) => state.selectTemplate)
  const selectedTemplateLabel = getTemplateLabel(resume.template)

  return (
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
        presentation={createResumePresentation(resume)}
        selectedTemplateLabel={selectedTemplateLabel}
      />
    </aside>
  )
}
