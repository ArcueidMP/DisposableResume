import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPdfPreviewScheduler } from './pdf-preview-scheduler'

type Deferred = {
  reject: (error: unknown) => void
  resolve: (value: string) => void
}

const DELAY_MS = 300

function createHarness() {
  const deferreds: Deferred[] = []
  const onError = vi.fn<(error: unknown) => void>()
  const onRenderStart = vi.fn<() => void>()
  const onSuccess = vi.fn<(output: string, input: string) => void>()
  const render = vi.fn(
    (input: string) =>
      new Promise<string>((resolve, reject) => {
        deferreds.push({ reject, resolve })
        void input
      }),
  )
  const scheduler = createPdfPreviewScheduler<string, string>({
    delayMs: DELAY_MS,
    onError,
    onRenderStart,
    onSuccess,
    render,
  })

  return { deferreds, onError, onRenderStart, onSuccess, render, scheduler }
}

function renderedInputs(harness: ReturnType<typeof createHarness>) {
  return harness.render.mock.calls.map(([input]) => input)
}

async function settle(
  harness: ReturnType<typeof createHarness>,
  index: number,
) {
  const deferred = harness.deferreds[index]

  if (deferred === undefined) {
    throw new Error(`No render ${index} is in flight.`)
  }

  deferred.resolve(`pdf:${renderedInputs(harness)[index]}`)
  await vi.advanceTimersByTimeAsync(0)
}

describe('createPdfPreviewScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders immediately on request and otherwise after the quiet period', async () => {
    const harness = createHarness()

    harness.scheduler.schedule('first', { immediate: true })

    expect(renderedInputs(harness)).toEqual(['first'])
    expect(harness.onRenderStart).toHaveBeenCalledTimes(1)

    await settle(harness, 0)

    expect(harness.onSuccess).toHaveBeenLastCalledWith('pdf:first', 'first')

    harness.scheduler.schedule('second')
    await vi.advanceTimersByTimeAsync(DELAY_MS - 1)

    expect(renderedInputs(harness)).toEqual(['first'])

    await vi.advanceTimersByTimeAsync(1)

    expect(renderedInputs(harness)).toEqual(['first', 'second'])
  })

  it('coalesces rapid edits into one render of the newest input', async () => {
    const harness = createHarness()

    harness.scheduler.schedule('a')
    await vi.advanceTimersByTimeAsync(DELAY_MS / 2)
    harness.scheduler.schedule('ab')
    await vi.advanceTimersByTimeAsync(DELAY_MS / 2)
    harness.scheduler.schedule('abc')
    await vi.advanceTimersByTimeAsync(DELAY_MS)

    expect(renderedInputs(harness)).toEqual(['abc'])
  })

  it('never overlaps renders and renders the newest input afterwards', async () => {
    const harness = createHarness()

    harness.scheduler.schedule('first', { immediate: true })
    harness.scheduler.schedule('second', { immediate: true })
    harness.scheduler.schedule('third', { immediate: true })

    expect(renderedInputs(harness)).toEqual(['first'])

    await settle(harness, 0)

    expect(renderedInputs(harness)).toEqual(['first', 'third'])
    expect(harness.onSuccess.mock.calls.map(([output]) => output)).toEqual([
      'pdf:first',
    ])

    await settle(harness, 1)

    expect(harness.onSuccess).toHaveBeenLastCalledWith('pdf:third', 'third')
    expect(harness.onRenderStart).toHaveBeenCalledTimes(2)
  })

  it('waits for the quiet period when edits arrive mid-render', async () => {
    const harness = createHarness()

    harness.scheduler.schedule('first', { immediate: true })
    harness.scheduler.schedule('typing')
    await settle(harness, 0)

    // The user is still typing: finishing a render must not start another.
    expect(renderedInputs(harness)).toEqual(['first'])

    await vi.advanceTimersByTimeAsync(DELAY_MS)

    expect(renderedInputs(harness)).toEqual(['first', 'typing'])
  })

  it('reports a failed render and keeps rendering afterwards', async () => {
    const harness = createHarness()
    const failure = new Error('fixture render failure')

    harness.scheduler.schedule('broken', { immediate: true })
    harness.deferreds[0]?.reject(failure)
    await vi.advanceTimersByTimeAsync(0)

    expect(harness.onError).toHaveBeenCalledWith(failure)
    expect(harness.onSuccess).not.toHaveBeenCalled()

    harness.scheduler.schedule('fixed', { immediate: true })
    await settle(harness, 1)

    expect(harness.onSuccess).toHaveBeenLastCalledWith('pdf:fixed', 'fixed')
  })

  it('ignores in-flight results and new work after dispose', async () => {
    const harness = createHarness()

    harness.scheduler.schedule('first', { immediate: true })
    harness.scheduler.schedule('queued')
    harness.scheduler.dispose()
    await settle(harness, 0)
    await vi.advanceTimersByTimeAsync(DELAY_MS)
    harness.scheduler.schedule('late', { immediate: true })

    expect(harness.onSuccess).not.toHaveBeenCalled()
    expect(harness.onError).not.toHaveBeenCalled()
    expect(renderedInputs(harness)).toEqual(['first'])
  })
})
