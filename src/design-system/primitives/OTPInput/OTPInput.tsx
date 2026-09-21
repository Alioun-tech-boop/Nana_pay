import { useId, useRef } from 'react'
import type { ClipboardEvent, KeyboardEvent } from 'react'
import { cx } from '../../utils/className'
import styles from './otpInput.module.css'

export interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  label?: string
  hint?: string
  error?: string
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

function digitsOf(raw: string): string {
  return raw.replace(/\D/g, '')
}

export function OTPInput({
  value,
  onChange,
  length = 6,
  label,
  hint,
  error,
  disabled,
  autoFocus,
  className,
}: OTPInputProps) {
  const autoId = useId()
  const groupId = `${autoId}-group`
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  const chars = value.padEnd(length, ' ').slice(0, length)

  function focusIndex(index: number) {
    const next = Math.max(0, Math.min(length - 1, index))
    inputsRef.current[next]?.focus()
    inputsRef.current[next]?.select?.()
  }

  function setAt(index: number, text: string) {
    const digits = digitsOf(text)
    if (digits.length === 0) return
    const next = (value + '').padEnd(length, ' ')
    const out: string[] = []
    for (let i = 0; i < length; i += 1) {
      out[i] = next[i]
    }
    let cursor = index
    for (const digit of digits) {
      if (cursor >= length) break
      out[cursor] = digit
      cursor += 1
    }
    onChange(out.join('').trimEnd())
    focusIndex(cursor > length - 1 ? length - 1 : cursor)
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusIndex(index - 1)
      return
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusIndex(index + 1)
      return
    }
    if (event.key === 'Backspace') {
      if (chars[index] !== ' ') return
      event.preventDefault()
      if (index === 0) return
      const next = (value + '').padEnd(length, ' ').split('')
      next[index - 1] = ' '
      onChange(next.join('').trimEnd())
      focusIndex(index - 1)
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const text = event.clipboardData.getData('text')
    const digits = digitsOf(text)
    if (digits.length === 0) return
    setAt(index, digits)
  }

  return (
    <div className={cx(styles.field, className)}>
      {label ? (
        <p id={groupId} className={styles.label}>
          {label}
        </p>
      ) : null}
      <div className={styles.cells} role="group" aria-labelledby={label ? groupId : undefined}>
        {Array.from({ length }, (_, index) => {
          const isFilled = chars[index] !== ' '
          return (
            <input
              key={index}
              ref={(node) => {
                inputsRef.current[index] = node
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className={cx(styles.cell, isFilled && styles['cell--filled'], error && styles['cell--error'])}
              value={chars[index] === ' ' ? '' : chars[index]}
              aria-label={`Chiffre ${index + 1} sur ${length}`}
              aria-invalid={error ? true : undefined}
              disabled={disabled}
              autoFocus={autoFocus && index === 0}
              maxLength={length}
              onChange={(event) => setAt(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={(event) => handlePaste(index, event)}
              onFocus={(event) => event.target.select()}
            />
          )
        })}
      </div>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className={styles.hint}>{hint}</p>
      ) : null}
    </div>
  )
}