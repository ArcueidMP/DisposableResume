import { useState } from 'react'
import { Brush, FileText, ShieldCheck } from 'lucide-react'

const resumeSections = [
  'Basic info',
  'Work experience',
  'Education',
  'Projects',
  'Skills',
] as const

const templates = ['Classic ATS', 'Modern ATS', 'Chinese Clean'] as const

type ResumeSection = (typeof resumeSections)[number]
type ResumeTemplate = (typeof templates)[number]

function App() {
  const [activeSection, setActiveSection] =
    useState<ResumeSection>('Basic info')
  const [selectedTemplate, setSelectedTemplate] =
    useState<ResumeTemplate>('Classic ATS')

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

        <section className="grid flex-1 gap-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
          <aside className="rounded-lg border border-[#d8ded2] bg-white p-4">
            <div className="flex items-center gap-2">
              <FileText aria-hidden="true" size={20} />
              <h2 className="text-lg font-semibold text-[#121612]">Sections</h2>
            </div>
            <div className="mt-4 grid gap-2">
              {resumeSections.map((section) => (
                <button
                  aria-pressed={activeSection === section}
                  className="rounded-md border border-[#d8ded2] px-3 py-2 text-left text-sm text-[#354238] transition hover:border-[#91ad98] hover:bg-[#f3f7f1] aria-pressed:border-[#244d34] aria-pressed:bg-[#e4f3e8] aria-pressed:text-[#163221]"
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[#617064]">Current section</p>
                <h2
                  className="mt-1 text-2xl font-semibold text-[#121612]"
                  id="editor-title"
                >
                  {activeSection}
                </h2>
              </div>
              <span className="rounded-md bg-[#fff2cc] px-3 py-2 text-sm text-[#5d4612]">
                Foundation
              </span>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="h-28 rounded-lg border border-dashed border-[#c9d1c3] bg-[#fafbf8]" />
              <div className="h-28 rounded-lg border border-dashed border-[#c9d1c3] bg-[#fafbf8]" />
              <div className="h-36 rounded-lg border border-dashed border-[#c9d1c3] bg-[#fafbf8] sm:col-span-2" />
            </div>
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
              {templates.map((template) => (
                <button
                  aria-pressed={selectedTemplate === template}
                  className="rounded-md border border-[#d8ded2] px-3 py-2 text-left text-sm text-[#354238] transition hover:border-[#91ad98] hover:bg-[#f3f7f1] aria-pressed:border-[#244d34] aria-pressed:bg-[#e4f3e8] aria-pressed:text-[#163221]"
                  key={template}
                  onClick={() => setSelectedTemplate(template)}
                  type="button"
                >
                  {template}
                </button>
              ))}
            </div>

            <article
              aria-label="Resume preview shell"
              className="mt-5 min-h-96 rounded-lg border border-[#d8ded2] bg-[#fbfbf8] p-5 shadow-sm"
            >
              <p className="text-sm text-[#617064]">
                Preview style: {selectedTemplate}
              </p>
              <div className="mt-5 h-7 w-3/4 rounded-md bg-[#20251f]" />
              <div className="mt-3 h-3 w-1/2 rounded-md bg-[#b9c2b2]" />
              <div className="mt-8 grid gap-3">
                <div className="h-4 w-1/3 rounded-md bg-[#62705f]" />
                <div className="h-3 rounded-md bg-[#dce2d8]" />
                <div className="h-3 w-5/6 rounded-md bg-[#dce2d8]" />
                <div className="h-3 w-4/6 rounded-md bg-[#dce2d8]" />
              </div>
              <div className="mt-8 grid gap-3">
                <div className="h-4 w-1/3 rounded-md bg-[#62705f]" />
                <div className="h-3 rounded-md bg-[#dce2d8]" />
                <div className="h-3 w-2/3 rounded-md bg-[#dce2d8]" />
              </div>
            </article>
          </aside>
        </section>
      </div>
    </main>
  )
}

export default App
