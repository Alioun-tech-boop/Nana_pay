import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { cx } from '../../utils/className'
import { useOnClickOutside } from '../../utils/hooks/useOnClickOutside'
import { Icon } from '../../icons/Icon'
import field from '../field.module.css'
import styles from './combobox.module.css'

export interface ComboboxItem {
  value: string
  label: string
  hint?: string
  disabled?: boolean
  group?: string
}

interface Row {
  kind: 'option' | 'group'
  label?: string
  item?: ComboboxItem
  index?: number
}

export interface ComboboxProps {
  items: ComboboxItem[]
  value?: string
  onSelect?: (value: string) => void
  placeholder?: string
  label?: string
  hint?: string
  error?: string
  disabled?: boolean
  clearable?: boolean
  filterable?: boolean
  onInputChange?: (query: string) => void
  emptyText?: string
  id?: string
  className?: string
}

export function Combobox({
  items,
  value,
  onSelect,
  placeholder,
  label,
  hint,
  error,
  disabled,
  clearable = false,
  filterable = true,
  onInputChange,
  emptyText = 'Aucun résultat',
  id,
  className,
}: ComboboxProps) {
  const autoId = useId()
  const inputId = id ?? `${autoId}-input`
  const listboxId = `${inputId}-listbox`
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedLabel = useMemo(
    () => items.find((item) => item.value === value)?.label,
    [items, value],
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!filterable || !query) return items
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        (item.hint ? item.hint.toLowerCase().includes(query) : false),
    )
  }, [items, search, filterable])

  const rows = useMemo<Row[]>(() => {
    const result: Row[] = []
    let group: string | undefined
    filtered.forEach((item, index) => {
      const itemGroup = item.group ?? ''
      if (itemGroup !== group) {
        group = itemGroup
        if (itemGroup) result.push({ kind: 'group', label: itemGroup })
      }
      result.push({ kind: 'option', item, index })
    })
    return result
  }, [filtered])

  function moveActive(direction: 1 | -1) {
    if (!open) {
      setOpen(true)
      setActive(0)
      return
    }
    const enabled = filtered
      .map((item, index) => ({ item, index }))
      .filter((entry) => !entry.item.disabled)
    if (enabled.length === 0) {
      setActive(-1)
      return
    }
    const position = enabled.findIndex((entry) => entry.index === active)
    let next = position
    if (next === -1) {
      next = direction === 1 ? 0 : enabled.length - 1
    } else {
      next = (next + direction + enabled.length) % enabled.length
    }
    setActive(enabled[next].index)
  }

  function selectItem(item: ComboboxItem) {
    if (item.disabled) return
    setSearch(item.label)
    setOpen(false)
    setActive(-1)
    onSelect?.(item.value)
    inputRef.current?.focus()
  }

  function handleInputChange(raw: string) {
    setSearch(raw)
    setOpen(true)
    setActive(0)
    onInputChange?.(raw)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveActive(1)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveActive(-1)
      return
    }
    if (event.key === 'Enter') {
      if (open && active >= 0) {
        const item = filtered[active]
        if (item) {
          event.preventDefault()
          selectItem(item)
        }
      } else {
        event.preventDefault()
        setOpen(true)
        setActive(active >= 0 ? active : 0)
      }
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      setActive(-1)
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      const enabled = filtered.findIndex((item) => !item.disabled)
      setOpen(true)
      setActive(enabled)
    }
    if (event.key === 'End') {
      event.preventDefault()
      const lastEnabled = [...filtered].reverse().findIndex((item) => !item.disabled)
      const index = lastEnabled === -1 ? -1 : filtered.length - 1 - lastEnabled
      setOpen(true)
      setActive(index)
    }
  }

  function clearSelection() {
    setSearch('')
    setActive(-1)
    onSelect?.('')
    inputRef.current?.focus()
  }

  useOnClickOutside(() => setOpen(false), open)

  useEffect(() => {
    if (!open || active < 0) return
    const activeRow = containerRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`,
    )
    activeRow?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const displayValue = search || selectedLabel || ''
  const errorId = error ? `${inputId}-error` : undefined
  const hintId = hint && !error ? `${inputId}-hint` : undefined

  return (
    <div className={cx(field.field, className)} ref={containerRef}>
      {label ? (
        <label htmlFor={inputId} className={field.label}>
          {label}
        </label>
      ) : null}
      <div className={cx(field.control, styles.control, error && field['control--error'], disabled && styles['control--disabled'])}>
        <input
          id={inputId}
          ref={inputRef}
          role="combobox"
          className={field.input}
          value={displayValue}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-activedescendant={open && active >= 0 ? `${listboxId}-opt-${active}` : undefined}
          aria-autocomplete="list"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
        />
        {clearable && displayValue && !disabled ? (
          <button
            type="button"
            className={styles.action}
            onClick={clearSelection}
            aria-label="Effacer la sélection"
          >
            <Icon name="close" size={16} />
          </button>
        ) : null}
        <span className={styles.action} aria-hidden="true">
          <Icon name="chevron-down" size={16} />
        </span>
      </div>
      {error ? (
        <p id={errorId} className={field.error} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={field.hint}>
          {hint}
        </p>
      ) : null}
      {open && !disabled ? (
        <div className={styles.listbox}>
          {filtered.length === 0 ? (
            <p className={styles.empty} role="status">
              {emptyText}
            </p>
          ) : (
            <ul id={listboxId} className={styles.list} role="listbox" aria-label={label}>
              {rows.map((row) => {
                if (row.kind === 'group') {
                  return (
                    <li key={`group-${row.label}`} className={styles.group} role="presentation">
                      {row.label}
                    </li>
                  )
                }
                const item = row.item
                const rowIndex = row.index
                if (!item || rowIndex === undefined) return null
                return (
                  <li
                    key={item.value}
                    id={`${listboxId}-opt-${rowIndex}`}
                    role="option"
                    aria-selected={value === item.value}
                    aria-disabled={item.disabled || undefined}
                    data-index={rowIndex}
                    className={cx(
                      styles.option,
                      active === rowIndex && styles['option--active'],
                      value === item.value && styles['option--selected'],
                      item.disabled && styles['option--disabled'],
                    )}
                    onMouseEnter={() => !item.disabled && setActive(rowIndex)}
                    onClick={() => selectItem(item)}
                  >
                    <span className={styles.optionText}>
                      <span className={styles.optionLabel}>{item.label}</span>
                      {item.hint ? <span className={styles.optionHint}>{item.hint}</span> : null}
                    </span>
                    {value === item.value ? (
                      <span className={styles.optionCheck}>
                        <Icon name="check" size={16} />
                      </span>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}