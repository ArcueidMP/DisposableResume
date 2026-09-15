export type PdfPreviewSchedulerOptions<TInput, TOutput> = {
  /** Quiet period after the last scheduled input before a render starts. */
  delayMs: number
  onError: (error: unknown) => void
  onRenderStart: () => void
  onSuccess: (output: TOutput, input: TInput) => void
  render: (input: TInput) => Promise<TOutput>
}

export type PdfPreviewScheduler<TInput> = {
  /** Drops pending work and ignores the outcome of any in-flight render. */
  dispose: () => void
  /**
   * Replaces the pending input. Renders after the quiet period, or right away
   * with `immediate`; either way a render that is already running finishes
   * first.
   */
  schedule: (input: TInput, options?: { immediate?: boolean }) => void
}

/**
 * Turns a stream of edits into at most one in-flight render. Rapid edits
 * coalesce into a single render of the newest input, and input that arrives
 * while a render is running is rendered afterwards, so the last delivered
 * result always matches the last scheduled input.
 */
export function createPdfPreviewScheduler<TInput, TOutput>({
  delayMs,
  onError,
  onRenderStart,
  onSuccess,
  render,
}: PdfPreviewSchedulerOptions<TInput, TOutput>): PdfPreviewScheduler<TInput> {
  let disposed = false
  let inFlight = false
  let pendingInput: { value: TInput } | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  async function run(input: TInput) {
    inFlight = true
    onRenderStart()

    try {
      const output = await render(input)

      if (!disposed) {
        onSuccess(output, input)
      }
    } catch (error) {
      if (!disposed) {
        onError(error)
      }
    } finally {
      inFlight = false

      // Input that arrived mid-render renders now unless the user is still
      // typing, in which case the pending timer starts it after they pause.
      if (timer === null) {
        start()
      }
    }
  }

  function start() {
    if (disposed || inFlight || pendingInput === null) {
      return
    }

    const input = pendingInput.value

    pendingInput = null
    void run(input)
  }

  return {
    dispose() {
      disposed = true
      pendingInput = null
      clearTimer()
    },
    schedule(input, { immediate = false } = {}) {
      if (disposed) {
        return
      }

      pendingInput = { value: input }
      clearTimer()

      if (immediate) {
        start()
        return
      }

      timer = setTimeout(() => {
        timer = null
        start()
      }, delayMs)
    },
  }
}
