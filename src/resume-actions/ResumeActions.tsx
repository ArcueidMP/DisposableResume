import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, RefObject } from 'react'
import { Download, FileInput, RotateCcw, Trash2 } from 'lucide-react'
import { downloadBlob } from '../browser/download'
import { createJsonFilename } from '../pdf/filenames'
import {
  MAX_RESUME_JSON_BYTES,
  parseResumeJson,
  serializeResumeJson,
} from '../resume/json'
import { validateResume } from '../resume/validation'
import { useResumeStore } from '../store/resume-store'
import { dangerButtonClass, secondaryButtonClass } from '../ui/controls'

type ActionStatus = { kind: 'error' | 'success'; text: string } | null
type DestructiveAction = 'clear' | 'reset'

function StatusMessage({ status }: { status: Exclude<ActionStatus, null> }) {
  return (
    <p
      className={
        status.kind === 'error'
          ? 'rounded-md border border-[#ecc2bd] bg-[#fff4f2] px-3 py-2 text-sm text-[#6f2b23]'
          : 'rounded-md border border-[#bed2c4] bg-[#eff7f1] px-3 py-2 text-sm text-[#25402d]'
      }
      role={status.kind === 'error' ? 'alert' : 'status'}
    >
      {status.text}
    </p>
  )
}

function DestructiveConfirmation({
  action,
  confirmationButtonRef,
  onCancel,
  onConfirm,
}: {
  action: DestructiveAction
  confirmationButtonRef: RefObject<HTMLButtonElement | null>
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      aria-labelledby="destructive-confirmation-title"
      className="rounded-md border border-[#ecc2bd] bg-[#fff4f2] p-4 text-[#6f2b23]"
      role="alertdialog"
    >
      <p className="font-semibold" id="destructive-confirmation-title">
        {action === 'clear' ? 'Clear this resume?' : 'Reset to fake defaults?'}
      </p>
      <p className="mt-1 text-sm">
        This replaces the current in-memory resume and cannot be undone.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className={dangerButtonClass}
          onClick={onConfirm}
          ref={confirmationButtonRef}
          type="button"
        >
          {action === 'clear' ? 'Confirm clear' : 'Confirm reset'}
        </button>
        <button
          className={secondaryButtonClass}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export function ResumeActions({ sectionTitle }: { sectionTitle: string }) {
  const resume = useResumeStore((state) => state.resume)
  const replaceResume = useResumeStore((state) => state.replaceResume)
  const clearResume = useResumeStore((state) => state.clearResume)
  const resetToDefaults = useResumeStore((state) => state.resetToDefaults)
  const importInputRef = useRef<HTMLInputElement>(null)
  const clearButtonRef = useRef<HTMLButtonElement>(null)
  const resetButtonRef = useRef<HTMLButtonElement>(null)
  const confirmationButtonRef = useRef<HTMLButtonElement>(null)
  const [importStatus, setImportStatus] = useState<ActionStatus>(null)
  const [exportStatus, setExportStatus] = useState<ActionStatus>(null)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [pendingAction, setPendingAction] = useState<DestructiveAction | null>(
    null,
  )

  useEffect(() => {
    if (pendingAction !== null) {
      confirmationButtonRef.current?.focus()
    }
  }, [pendingAction])

  function handleExportJson() {
    setExportStatus(null)

    const validatedResume = validateResume(resume)

    if (!validatedResume.success) {
      setExportStatus({
        kind: 'error',
        text: 'Export blocked: fix invalid resume fields first.',
      })
      return
    }

    const blob = new Blob([serializeResumeJson(validatedResume.data)], {
      type: 'application/json',
    })

    downloadBlob(blob, createJsonFilename())
  }

  async function handleExportPdf() {
    if (isExportingPdf) {
      return
    }

    setExportStatus(null)

    const validatedResume = validateResume(resume)

    if (!validatedResume.success) {
      setExportStatus({
        kind: 'error',
        text: 'Export blocked: fix invalid resume fields first.',
      })
      return
    }

    setIsExportingPdf(true)

    try {
      const { exportResumePdf } = await import('../pdf/exportResumePdf')

      await exportResumePdf(validatedResume.data)
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
      if (file.size > MAX_RESUME_JSON_BYTES) {
        setImportStatus({
          kind: 'error',
          text: 'Import failed: the selected JSON file is too large.',
        })
        return
      }

      let fileContents: string

      try {
        fileContents = await file.text()
      } catch {
        setImportStatus({
          kind: 'error',
          text: 'Import failed: the selected file could not be read.',
        })
        return
      }

      const parsedResume = parseResumeJson(fileContents)

      if (!parsedResume.success) {
        setImportStatus({
          kind: 'error',
          text:
            parsedResume.code === 'unsupported-version'
              ? 'Import failed: this DisposableResume JSON version is not supported.'
              : 'Import failed: choose a valid DisposableResume JSON file.',
        })
        return
      }

      replaceResume(parsedResume.resume)
      setImportStatus({
        kind: 'success',
        text: 'Imported validated JSON locally.',
      })
    } finally {
      event.target.value = ''
    }
  }

  function clearStatuses() {
    setImportStatus(null)
    setExportStatus(null)
  }

  function cancelDestructiveAction() {
    const trigger = pendingAction === 'clear' ? clearButtonRef : resetButtonRef

    setPendingAction(null)
    trigger.current?.focus()
  }

  function confirmDestructiveAction() {
    if (pendingAction === null) {
      throw new Error('No destructive action is pending.')
    }

    const action = pendingAction
    const trigger = action === 'clear' ? clearButtonRef : resetButtonRef

    setPendingAction(null)

    if (action === 'clear') {
      clearResume()
    } else {
      resetToDefaults()
    }

    clearStatuses()
    trigger.current?.focus()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm text-[#617064]">Current section</p>
          <h2
            className="mt-1 text-2xl font-semibold text-[#121612]"
            id="editor-title"
          >
            {sectionTitle}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={secondaryButtonClass}
            disabled={isExportingPdf}
            onClick={() => void handleExportPdf()}
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
            onChange={(event) => void handleImportJson(event)}
            ref={importInputRef}
            type="file"
          />
          <button
            className={dangerButtonClass}
            onClick={() => setPendingAction('clear')}
            ref={clearButtonRef}
            type="button"
          >
            <Trash2 aria-hidden="true" size={16} />
            Clear to blank resume
          </button>
          <button
            className={dangerButtonClass}
            onClick={() => setPendingAction('reset')}
            ref={resetButtonRef}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={16} />
            Reset fake defaults
          </button>
        </div>
      </div>
      {pendingAction ? (
        <DestructiveConfirmation
          action={pendingAction}
          confirmationButtonRef={confirmationButtonRef}
          onCancel={cancelDestructiveAction}
          onConfirm={confirmDestructiveAction}
        />
      ) : null}
      {importStatus ? <StatusMessage status={importStatus} /> : null}
      {exportStatus ? <StatusMessage status={exportStatus} /> : null}
    </div>
  )
}
