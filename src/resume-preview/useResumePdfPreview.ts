import { useEffect, useRef, useState } from 'react'
import type { ResumeDraft } from '../resume/types'
import {
  createPdfPreviewScheduler,
  type PdfPreviewScheduler,
} from './pdf-preview-scheduler'

/** Quiet period after the last edit before the preview re-renders. */
export const PDF_PREVIEW_DEBOUNCE_MS = 300

export type ResumePdfPreviewState = {
  status: 'rendering' | 'ready' | 'error'
  /** Object URL of the newest successfully rendered PDF, if any. */
  url: string | null
}

async function renderResumePdf(resume: ResumeDraft) {
  // Loaded on demand so the editor shell paints before the PDF renderer.
  const { createResumePdfBlob } = await import('../pdf/exportResumePdf')

  return createResumePdfBlob(resume)
}

/**
 * Keeps a rendered PDF of the current draft, produced by the same code path
 * as PDF export. Edits are debounced, renders never overlap, and the previous
 * PDF stays visible until the next one is ready.
 */
export function useResumePdfPreview(
  resume: ResumeDraft,
): ResumePdfPreviewState {
  const [state, setState] = useState<ResumePdfPreviewState>({
    status: 'rendering',
    url: null,
  })
  const schedulerRef = useRef<PdfPreviewScheduler<ResumeDraft> | null>(null)
  const hasScheduledRef = useRef(false)

  useEffect(() => {
    const scheduler = createPdfPreviewScheduler<ResumeDraft, Blob>({
      delayMs: PDF_PREVIEW_DEBOUNCE_MS,
      onError: () =>
        setState((previous) => ({ status: 'error', url: previous.url })),
      onRenderStart: () =>
        setState((previous) =>
          previous.status === 'rendering'
            ? previous
            : { status: 'rendering', url: previous.url },
        ),
      onSuccess: (blob) =>
        setState({ status: 'ready', url: URL.createObjectURL(blob) }),
      render: renderResumePdf,
    })

    schedulerRef.current = scheduler
    hasScheduledRef.current = false

    return () => {
      scheduler.dispose()
      schedulerRef.current = null
    }
  }, [])

  useEffect(() => {
    schedulerRef.current?.schedule(resume, {
      immediate: !hasScheduledRef.current,
    })
    hasScheduledRef.current = true
  }, [resume])

  // Revoke each object URL once a newer one has been committed to the DOM, and
  // the last one on unmount.
  useEffect(() => {
    const url = state.url

    if (url === null) {
      return
    }

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [state.url])

  return state
}
