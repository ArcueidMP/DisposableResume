export const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-md border border-[#d8ded2] px-3 py-2 text-sm font-medium text-[#354238] transition hover:border-[#91ad98] hover:bg-[#f3f7f1] disabled:cursor-not-allowed disabled:opacity-60'

export const dangerButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-md border border-[#ecc2bd] px-3 py-2 text-sm font-medium text-[#6f2b23] transition hover:border-[#ce8d85] hover:bg-[#fff4f2]'

export const sectionButtonClass =
  'rounded-md border border-[#d8ded2] px-3 py-2 text-left text-sm text-[#354238] transition hover:border-[#91ad98] hover:bg-[#f3f7f1] aria-pressed:border-[#244d34] aria-pressed:bg-[#e4f3e8] aria-pressed:text-[#163221]'

const inputClass =
  'rounded-md border border-[#cbd6c5] px-3 py-2 text-[#121612] outline-none transition focus:border-[#244d34] focus:ring-2 focus:ring-[#bed2c4]'
const textAreaClass = `${inputClass} min-h-24 resize-y`

export function TextInput({
  ariaLabel,
  label,
  maxLength,
  onChange,
  type = 'text',
  value,
}: {
  ariaLabel?: string
  label: string
  maxLength?: number
  onChange: (value: string) => void
  type?: string
  value: string
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#354238]">
      <span>{label}</span>
      <input
        aria-label={ariaLabel ?? label}
        autoComplete="off"
        className={inputClass}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        type={type}
        value={value}
      />
    </label>
  )
}

export function TextAreaInput({
  ariaLabel,
  label,
  maxLength,
  onChange,
  value,
}: {
  ariaLabel?: string
  label: string
  maxLength?: number
  onChange: (value: string) => void
  value: string
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#354238]">
      <span>{label}</span>
      <textarea
        aria-label={ariaLabel ?? label}
        autoComplete="off"
        className={textAreaClass}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        value={value}
      />
    </label>
  )
}
