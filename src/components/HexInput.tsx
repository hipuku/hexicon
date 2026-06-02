import { isValidHex, parseHex } from '@/lib/colourMatcher'
import { cn } from '@/lib/utils'

interface HexInputProps {
  id:          string
  label:       string
  value:       string
  onChange:    (v: string) => void
  placeholder?: string
  autoFocus?:  boolean
}

export function HexInput({ id, label, value, onChange, placeholder = '#A1B2C3', autoFocus = false }: HexInputProps) {
  const valid      = isValidHex(value)
  const previewHex = valid ? parseHex(value) : null
  const hasError   = value.trim().length >= 4 && !valid

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="type-annotation-sc text-void-50">
        {label}
      </label>
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border bg-void-10 transition-colors duration-150',
        hasError ? 'border-flare' : 'border-void-20 focus-within:border-void-40',
      )}>
        <div
          className="w-4 h-4 rounded-sm shrink-0 border border-void-30 transition-colors duration-150"
          style={{ backgroundColor: previewHex ?? 'transparent' }}
        />
        <input
          id={id}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          autoFocus={autoFocus}
          className="flex-1 bg-transparent outline-none type-code text-void-90 placeholder:text-void-40"
        />
      </div>
      {hasError && (
        <p className="type-annotation text-flare">Must be a # followed by 3 or 6 hex characters — e.g. #A1B2C3 or #FFF</p>
      )}
    </div>
  )
}
