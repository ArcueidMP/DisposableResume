import { useState } from 'react'
import { FileText, ShieldCheck } from 'lucide-react'
import { ResumeActions } from './resume-actions/ResumeActions'
import { ResumeEditor } from './resume-editor/ResumeEditor'
import { resumeSections, type ResumeSection } from './resume-editor/sections'
import { ResumePreviewPanel } from './resume-preview/ResumePreview'
import { sectionButtonClass } from './ui/controls'

function App() {
  const [activeSection, setActiveSection] =
    useState<ResumeSection>('Basic info')

  return (
    <main className="min-h-screen bg-[#f6f7f3] text-[#1c211c]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-[#d8ded2] py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-[#617064]">
              Zero-retention resume builder
            </p>
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
              <ResumeActions sectionTitle={activeSection} />
            </div>

            <div className="mt-8 grid gap-6">
              <ResumeEditor section={activeSection} />
            </div>
          </section>

          <ResumePreviewPanel />
        </section>
      </div>
    </main>
  )
}

export default App
