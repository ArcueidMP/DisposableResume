import { Brush, LoaderCircle } from 'lucide-react'
import { resumeTemplateOptions } from '../resume/schema'
import { useResumeStore } from '../store/resume-store'
import { sectionButtonClass } from '../ui/controls'
import {
  useResumePdfPreview,
  type ResumePdfPreviewState,
} from './useResumePdfPreview'

// Asks the browser's PDF viewer to hide its toolbar and side panes and fit the
// page width. Viewers that do not understand these parameters ignore them.
const PDF_VIEWER_FRAGMENT = '#toolbar=0&navpanes=0&view=FitH'

const previewStatusLabels = {
  error: 'Preview unavailable',
  ready: 'Up to date',
  rendering: 'Rendering',
} satisfies Record<ResumePdfPreviewState['status'], string>

function PreviewPlaceholder({
  status,
}: {
  status: ResumePdfPreviewState['status']
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-[#617064]">
      {status === 'error' ? (
        <p>The PDF preview could not be rendered.</p>
      ) : (
        <>
          <LoaderCircle
            aria-hidden="true"
            className="animate-spin text-[#617064]"
            size={20}
          />
          <p>Rendering the PDF preview in this browser.</p>
        </>
      )}
    </div>
  )
}

export function ResumePreviewPanel() {
  const resume = useResumeStore((state) => state.resume)
  const selectTemplate = useResumeStore((state) => state.selectTemplate)
  const preview = useResumePdfPreview(resume)
  const statusLabel =
    preview.status === 'rendering' && preview.url !== null
      ? 'Updating'
      : previewStatusLabels[preview.status]

  return (
    <aside className="flex flex-col rounded-lg border border-[#d8ded2] bg-white p-4 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:min-h-[36rem] lg:self-start">
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

      <div className="mt-5 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#121612]">PDF preview</h3>
        <p
          className="text-xs text-[#617064]"
          data-preview-status={preview.status}
        >
          {statusLabel}
        </p>
      </div>
      <p className="mt-1 text-xs text-[#617064]">
        Rendered in this browser by the same template code as Export PDF.
      </p>

      <div className="mt-3 flex h-[70vh] min-h-96 flex-col overflow-hidden rounded-md border border-[#c7cdc4] bg-[#e9ebe6] lg:h-auto lg:min-h-0 lg:flex-1">
        {preview.url === null ? (
          <PreviewPlaceholder status={preview.status} />
        ) : (
          <iframe
            className="h-full w-full flex-1 border-0"
            src={`${preview.url}${PDF_VIEWER_FRAGMENT}`}
            title="Resume PDF preview"
          />
        )}
      </div>

      {preview.status === 'error' ? (
        <p
          className="mt-3 rounded-md border border-[#ecc2bd] bg-[#fff4f2] px-3 py-2 text-sm text-[#6f2b23]"
          role="alert"
        >
          The PDF preview could not be rendered in this browser. Export PDF may
          still work.
        </p>
      ) : null}
    </aside>
  )
}
