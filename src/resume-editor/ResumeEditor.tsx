import { Plus, Trash2 } from 'lucide-react'
import { resumeLimits } from '../resume/schema'
import type { ResumeLink } from '../resume/types'
import { useResumeStore } from '../store/resume-store'
import {
  dangerButtonClass,
  secondaryButtonClass,
  TextAreaInput,
  TextInput,
} from '../ui/controls'
import type { ResumeSection } from './sections'

function StringListEditor({
  itemLabel,
  itemName,
  label,
  maxItems,
  maxLength,
  onChange,
  values,
}: {
  itemLabel: string
  itemName: string
  label: string
  maxItems: number
  maxLength: number
  onChange: (values: string[]) => void
  values: string[]
}) {
  return (
    <fieldset aria-label={label} className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[#354238]">{label}</span>
        <button
          aria-label={`Add ${itemName}`}
          className={secondaryButtonClass}
          disabled={values.length >= maxItems}
          onClick={() => onChange([...values, ''])}
          type="button"
        >
          <Plus aria-hidden="true" size={16} />
          Add {itemLabel.toLowerCase()}
        </button>
      </div>
      {values.map((value, index) => (
        <div
          className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
          key={index}
        >
          <TextAreaInput
            ariaLabel={`${itemName} ${index + 1}`}
            label={`${itemLabel} ${index + 1}`}
            maxLength={maxLength}
            onChange={(nextValue) =>
              onChange(
                values.map((item, itemIndex) =>
                  itemIndex === index ? nextValue : item,
                ),
              )
            }
            value={value}
          />
          <button
            aria-label={`Remove ${itemName} ${index + 1}`}
            className={`${dangerButtonClass} sm:self-end`}
            onClick={() =>
              onChange(values.filter((_, itemIndex) => itemIndex !== index))
            }
            type="button"
          >
            <Trash2 aria-hidden="true" size={16} />
            Remove
          </button>
        </div>
      ))}
    </fieldset>
  )
}

function LinksEditor({
  links,
  onChange,
}: {
  links: ResumeLink[]
  onChange: (links: ResumeLink[]) => void
}) {
  return (
    <fieldset aria-label="Links" className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[#354238]">Links</span>
        <button
          className={secondaryButtonClass}
          disabled={links.length >= resumeLimits.basics.links}
          onClick={() => onChange([...links, { label: '', url: '' }])}
          type="button"
        >
          <Plus aria-hidden="true" size={16} />
          Add link
        </button>
      </div>
      {links.map((link, index) => (
        <article
          className="grid gap-3 rounded-lg border border-[#d8ded2] bg-[#fbfbf8] p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]"
          key={index}
        >
          <TextInput
            ariaLabel={`Link label ${index + 1}`}
            label="Label"
            maxLength={resumeLimits.link.label}
            onChange={(label) =>
              onChange(
                links.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, label } : item,
                ),
              )
            }
            value={link.label}
          />
          <TextInput
            ariaLabel={`Link URL ${index + 1}`}
            label="URL"
            maxLength={resumeLimits.link.url}
            onChange={(url) =>
              onChange(
                links.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, url } : item,
                ),
              )
            }
            type="url"
            value={link.url}
          />
          <button
            aria-label={`Remove link ${index + 1}`}
            className={`${dangerButtonClass} sm:self-end`}
            onClick={() =>
              onChange(links.filter((_, itemIndex) => itemIndex !== index))
            }
            type="button"
          >
            <Trash2 aria-hidden="true" size={16} />
            Remove
          </button>
        </article>
      ))}
    </fieldset>
  )
}

function BasicsEditor() {
  const basics = useResumeStore((state) => state.resume.basics)
  const updateBasics = useResumeStore((state) => state.updateBasics)

  return (
    <fieldset className="grid gap-4">
      <legend className="text-base font-semibold text-[#121612]">Basics</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Name"
          maxLength={resumeLimits.basics.name}
          onChange={(name) => updateBasics({ name })}
          value={basics.name}
        />
        <TextInput
          label="Email"
          maxLength={resumeLimits.basics.email}
          onChange={(email) => updateBasics({ email })}
          type="email"
          value={basics.email}
        />
        <TextInput
          label="Phone"
          maxLength={resumeLimits.basics.phone}
          onChange={(phone) => updateBasics({ phone })}
          type="tel"
          value={basics.phone}
        />
        <TextInput
          label="Location"
          maxLength={resumeLimits.basics.location}
          onChange={(location) => updateBasics({ location })}
          value={basics.location}
        />
      </div>
      <LinksEditor
        links={basics.links}
        onChange={(links) => updateBasics({ links })}
      />
    </fieldset>
  )
}

function WorkEditor() {
  const work = useResumeStore((state) => state.resume.work)
  const addWork = useResumeStore((state) => state.addWork)
  const updateWork = useResumeStore((state) => state.updateWork)
  const removeWork = useResumeStore((state) => state.removeWork)

  return (
    <section className="grid gap-4" aria-labelledby="work-editor-title">
      <div className="flex items-center justify-between gap-3">
        <h3
          className="text-base font-semibold text-[#121612]"
          id="work-editor-title"
        >
          Work experience
        </h3>
        <button
          className={secondaryButtonClass}
          disabled={work.length >= resumeLimits.work.items}
          onClick={addWork}
          type="button"
        >
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
                onClick={() => removeWork(item.id)}
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
                maxLength={resumeLimits.work.role}
                onChange={(role) => updateWork(item.id, { role })}
                value={item.role}
              />
              <TextInput
                ariaLabel={`Work organization ${index + 1}`}
                label="Organization"
                maxLength={resumeLimits.work.organization}
                onChange={(organization) =>
                  updateWork(item.id, { organization })
                }
                value={item.organization}
              />
              <TextInput
                ariaLabel={`Work location ${index + 1}`}
                label="Location"
                maxLength={resumeLimits.shared.location}
                onChange={(location) => updateWork(item.id, { location })}
                value={item.location}
              />
              <TextInput
                ariaLabel={`Work start date ${index + 1}`}
                label="Start"
                maxLength={resumeLimits.shared.date}
                onChange={(startDate) => updateWork(item.id, { startDate })}
                value={item.startDate}
              />
              <TextInput
                ariaLabel={`Work end date ${index + 1}`}
                label="End"
                maxLength={resumeLimits.shared.date}
                onChange={(endDate) => updateWork(item.id, { endDate })}
                value={item.endDate}
              />
            </div>
            <StringListEditor
              itemLabel="Highlight"
              itemName={`Work ${index + 1} highlight`}
              label="Highlights"
              maxItems={resumeLimits.work.highlights}
              maxLength={resumeLimits.work.highlight}
              onChange={(highlights) => updateWork(item.id, { highlights })}
              values={item.highlights}
            />
          </article>
        ))}
      </div>
    </section>
  )
}

function EducationEditor() {
  const education = useResumeStore((state) => state.resume.education)
  const addEducation = useResumeStore((state) => state.addEducation)
  const updateEducation = useResumeStore((state) => state.updateEducation)
  const removeEducation = useResumeStore((state) => state.removeEducation)

  return (
    <section className="grid gap-4" aria-labelledby="education-editor-title">
      <div className="flex items-center justify-between gap-3">
        <h3
          className="text-base font-semibold text-[#121612]"
          id="education-editor-title"
        >
          Education
        </h3>
        <button
          className={secondaryButtonClass}
          disabled={education.length >= resumeLimits.education.items}
          onClick={addEducation}
          type="button"
        >
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
                onClick={() => removeEducation(item.id)}
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
                maxLength={resumeLimits.education.school}
                onChange={(school) => updateEducation(item.id, { school })}
                value={item.school}
              />
              <TextInput
                ariaLabel={`Education credential ${index + 1}`}
                label="Credential"
                maxLength={resumeLimits.education.credential}
                onChange={(credential) =>
                  updateEducation(item.id, { credential })
                }
                value={item.credential}
              />
              <TextInput
                ariaLabel={`Education location ${index + 1}`}
                label="Location"
                maxLength={resumeLimits.shared.location}
                onChange={(location) => updateEducation(item.id, { location })}
                value={item.location}
              />
              <TextInput
                ariaLabel={`Education start date ${index + 1}`}
                label="Start"
                maxLength={resumeLimits.shared.date}
                onChange={(startDate) =>
                  updateEducation(item.id, { startDate })
                }
                value={item.startDate}
              />
              <TextInput
                ariaLabel={`Education end date ${index + 1}`}
                label="End"
                maxLength={resumeLimits.shared.date}
                onChange={(endDate) => updateEducation(item.id, { endDate })}
                value={item.endDate}
              />
            </div>
            <StringListEditor
              itemLabel="Detail"
              itemName={`Education ${index + 1} detail`}
              label="Details"
              maxItems={resumeLimits.education.details}
              maxLength={resumeLimits.education.detail}
              onChange={(details) => updateEducation(item.id, { details })}
              values={item.details}
            />
          </article>
        ))}
      </div>
    </section>
  )
}

function ProjectsEditor() {
  const projects = useResumeStore((state) => state.resume.projects)
  const addProject = useResumeStore((state) => state.addProject)
  const updateProject = useResumeStore((state) => state.updateProject)
  const removeProject = useResumeStore((state) => state.removeProject)

  return (
    <section className="grid gap-4" aria-labelledby="projects-editor-title">
      <div className="flex items-center justify-between gap-3">
        <h3
          className="text-base font-semibold text-[#121612]"
          id="projects-editor-title"
        >
          Projects
        </h3>
        <button
          className={secondaryButtonClass}
          disabled={projects.length >= resumeLimits.project.items}
          onClick={addProject}
          type="button"
        >
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
                onClick={() => removeProject(item.id)}
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} />
                Remove
              </button>
            </div>
            <TextInput
              ariaLabel={`Project name ${index + 1}`}
              label="Name"
              maxLength={resumeLimits.project.name}
              onChange={(name) => updateProject(item.id, { name })}
              value={item.name}
            />
            <TextAreaInput
              ariaLabel={`Project description ${index + 1}`}
              label="Description"
              maxLength={resumeLimits.project.description}
              onChange={(description) =>
                updateProject(item.id, { description })
              }
              value={item.description}
            />
            <StringListEditor
              itemLabel="Highlight"
              itemName={`Project ${index + 1} highlight`}
              label="Highlights"
              maxItems={resumeLimits.project.highlights}
              maxLength={resumeLimits.project.highlight}
              onChange={(highlights) => updateProject(item.id, { highlights })}
              values={item.highlights}
            />
          </article>
        ))}
      </div>
    </section>
  )
}

function SkillsEditor() {
  const skills = useResumeStore((state) => state.resume.skills)
  const updateSkills = useResumeStore((state) => state.updateSkills)

  return (
    <fieldset className="grid gap-4">
      <legend className="text-base font-semibold text-[#121612]">Skills</legend>
      <div className="flex justify-end">
        <button
          className={secondaryButtonClass}
          disabled={skills.length >= resumeLimits.skill.items}
          onClick={() => updateSkills([...skills, ''])}
          type="button"
        >
          <Plus aria-hidden="true" size={16} />
          Add skill
        </button>
      </div>
      {skills.map((skill, index) => (
        <div
          className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
          key={index}
        >
          <TextInput
            ariaLabel={`Skill ${index + 1}`}
            label={`Skill ${index + 1}`}
            maxLength={resumeLimits.skill.item}
            onChange={(value) =>
              updateSkills(
                skills.map((item, itemIndex) =>
                  itemIndex === index ? value : item,
                ),
              )
            }
            value={skill}
          />
          <button
            aria-label={`Remove skill ${index + 1}`}
            className={`${dangerButtonClass} sm:self-end`}
            onClick={() =>
              updateSkills(skills.filter((_, itemIndex) => itemIndex !== index))
            }
            type="button"
          >
            <Trash2 aria-hidden="true" size={16} />
            Remove
          </button>
        </div>
      ))}
    </fieldset>
  )
}

export function ResumeEditor({ section }: { section: ResumeSection }) {
  switch (section) {
    case 'Basic info':
      return <BasicsEditor />
    case 'Work experience':
      return <WorkEditor />
    case 'Education':
      return <EducationEditor />
    case 'Projects':
      return <ProjectsEditor />
    case 'Skills':
      return <SkillsEditor />
  }
}
