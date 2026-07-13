import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import type { MoveDirection } from '../store/resume-store'
import { dangerButtonClass, secondaryButtonClass } from '../ui/controls'

type FocusRequest = {
  controlId: string
}

type ReorderAnnouncement = {
  message: string
  revision: number
}

type ReorderContextValue = {
  completeMove: (
    groupId: string,
    itemName: string,
    index: number,
    total: number,
    direction: MoveDirection,
  ) => void
}

const ReorderContext = createContext<ReorderContextValue | undefined>(undefined)

function reorderControlId(
  groupId: string,
  index: number,
  direction: MoveDirection,
) {
  return `reorder-${groupId}-${index}-${direction}`
}

export function ReorderCoordinator({ children }: { children: ReactNode }) {
  const [announcement, setAnnouncement] = useState<ReorderAnnouncement>({
    message: '',
    revision: 0,
  })
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null)

  const completeMove = useCallback(
    (
      groupId: string,
      itemName: string,
      index: number,
      total: number,
      direction: MoveDirection,
    ) => {
      const destination = direction === 'up' ? index - 1 : index + 1
      const focusDirection =
        destination === 0
          ? 'down'
          : destination === total - 1
            ? 'up'
            : direction

      setAnnouncement((current) => ({
        message: `Moved ${itemName} to position ${destination + 1} of ${total}.`,
        revision: current.revision + 1,
      }))
      setFocusRequest({
        controlId: reorderControlId(groupId, destination, focusDirection),
      })
    },
    [],
  )

  useLayoutEffect(() => {
    if (focusRequest === null) {
      return
    }

    document.getElementById(focusRequest.controlId)?.focus()
  }, [focusRequest])

  return (
    <ReorderContext.Provider value={{ completeMove }}>
      {children}
      <p aria-atomic="true" aria-live="polite" className="sr-only">
        <span key={announcement.revision}>{announcement.message}</span>
      </p>
    </ReorderContext.Provider>
  )
}

function useReorderCoordinator() {
  const context = useContext(ReorderContext)

  if (context === undefined) {
    throw new Error(
      'Reorder controls must be rendered inside their coordinator.',
    )
  }

  return context
}

function ReorderControls({
  groupId,
  index,
  itemName,
  onMove,
  total,
}: {
  groupId: string
  index: number
  itemName: string
  onMove: (direction: MoveDirection) => void
  total: number
}) {
  const { completeMove } = useReorderCoordinator()

  const move = (direction: MoveDirection) => {
    onMove(direction)
    completeMove(groupId, itemName, index, total, direction)
  }

  return (
    <div
      aria-label={`Reorder ${itemName} ${index + 1}`}
      className="flex gap-2"
      role="group"
    >
      <button
        aria-label={`Move ${itemName} ${index + 1} of ${total} up`}
        className={secondaryButtonClass}
        disabled={index === 0}
        id={reorderControlId(groupId, index, 'up')}
        onClick={() => move('up')}
        type="button"
      >
        <ArrowUp aria-hidden="true" size={16} />
        <span className="sr-only">Up</span>
      </button>
      <button
        aria-label={`Move ${itemName} ${index + 1} of ${total} down`}
        className={secondaryButtonClass}
        disabled={index === total - 1}
        id={reorderControlId(groupId, index, 'down')}
        onClick={() => move('down')}
        type="button"
      >
        <ArrowDown aria-hidden="true" size={16} />
        <span className="sr-only">Down</span>
      </button>
    </div>
  )
}

export function ReorderableItemActions({
  className = '',
  groupId,
  index,
  itemName,
  onMove,
  onRemove,
  removeLabel,
  total,
}: {
  className?: string
  groupId: string
  index: number
  itemName: string
  onMove: (direction: MoveDirection) => void
  onRemove: () => void
  removeLabel: string
  total: number
}) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <ReorderControls
        groupId={groupId}
        index={index}
        itemName={itemName}
        onMove={onMove}
        total={total}
      />
      <button
        aria-label={removeLabel}
        className={dangerButtonClass}
        onClick={onRemove}
        type="button"
      >
        <Trash2 aria-hidden="true" size={16} />
        Remove
      </button>
    </div>
  )
}
