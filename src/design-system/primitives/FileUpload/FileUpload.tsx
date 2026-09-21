import { useId, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { cx } from '../../utils/className'
import { formatBytes } from '../../utils/format'
import { Icon } from '../../icons/Icon'
import styles from './fileUpload.module.css'

export interface UploadedFile {
  name: string
  size: number
  type: string
}

export interface FileUploadProps {
  id?: string
  label?: string
  hint?: string
  error?: string
  accept?: string
  multiple?: boolean
  maxSize?: number
  disabled?: boolean
  readOnly?: boolean
  defaultFiles?: UploadedFile[]
  files?: UploadedFile[]
  onFilesChange?: (files: UploadedFile[]) => void
  onError?: (message: string) => void
  className?: string
}

function toFileList(files: FileList | null): UploadedFile[] {
  if (!files) return []
  return Array.from(files).map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type,
  }))
}

function isAccepted(file: UploadedFile, accept: string | undefined): boolean {
  if (!accept) return true
  const allowed = accept
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
  if (allowed.length === 0) return true
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  return allowed.some((entry) => {
    if (entry === '*/*' || entry === '.*') return true
    if (entry.startsWith('.')) return name.endsWith(entry)
    if (entry.endsWith('/*')) return type.startsWith(entry.slice(0, -1))
    return type === entry
  })
}

export function FileUpload({
  id,
  label,
  hint,
  error,
  accept,
  multiple = true,
  maxSize,
  disabled,
  readOnly,
  defaultFiles = [],
  files,
  onFilesChange,
  onError,
  className,
}: FileUploadProps) {
  const autoId = useId()
  const inputId = id ?? `${autoId}-input`
  const [internal, setInternal] = useState<UploadedFile[]>(defaultFiles)
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState<string>()
  const inputRef = useRef<HTMLInputElement>(null)
  const controlled = files !== undefined
  const current = controlled ? files ?? [] : internal

  function commit(next: UploadedFile[]) {
    if (!controlled) setInternal(next)
    onFilesChange?.(next)
  }

  function addFiles(entries: UploadedFile[]) {
    setLocalError(undefined)
    if (entries.length === 0) return
    const oversized = entries.filter((file) => maxSize !== undefined && file.size > maxSize)
    if (oversized.length > 0) {
      const message = `Fichier trop volumineux (max ${formatBytes(maxSize ?? 0)})`
      setLocalError(message)
      onError?.(message)
      return
    }
    const rejected = entries.filter((file) => !isAccepted(file, accept))
    const accepted = entries.filter((file) => isAccepted(file, accept))
    if (rejected.length > 0) {
      const message = `Type de fichier non autorisé : ${rejected.map((file) => file.name).join(', ')}.`
      setLocalError(message)
      onError?.(message)
    }
    if (accepted.length > 0) {
      commit(multiple ? [...current, ...accepted] : accepted.slice(-1))
    }
  }

  function removeFile(name: string) {
    commit(current.filter((file) => file.name !== name))
  }

  function openPicker() {
    if (!disabled && !readOnly) inputRef.current?.click()
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    setDragging(false)
    if (disabled || readOnly) return
    addFiles(toFileList(event.dataTransfer.files))
  }

  const effectiveError = error ?? localError
  const errorId = effectiveError ? `${inputId}-error` : undefined
  const hintId = hint && !effectiveError ? `${inputId}-hint` : undefined

  return (
    <div className={cx(styles.field, className)}>
      {label ? (
        <p className={styles.label} id={`${inputId}-label`}>
          {label}
        </p>
      ) : null}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className={styles.input}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => addFiles(toFileList(event.target.files))}
        aria-labelledby={label ? `${inputId}-label` : undefined}
      />
      <div
        className={cx(
          styles.zone,
          dragging && styles['zone--dragging'],
          (disabled || readOnly) && styles['zone--inactive'],
        )}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled && !readOnly) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={openPicker}
        role={readOnly || disabled ? undefined : 'button'}
        tabIndex={readOnly || disabled ? undefined : 0}
        aria-controls={inputId}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && !readOnly && !disabled) {
            event.preventDefault()
            openPicker()
          }
        }}
      >
        <span className={styles.icon} aria-hidden="true">
          <Icon name="upload" size={20} />
        </span>
        <span className={styles.zoneText}>
          {readOnly ? 'Fichier(s) joint(s)' : 'Glissez un fichier ici ou cliquez pour parcourir'}
        </span>
        {accept ? <span className={styles.accept}>{accept}</span> : null}
      </div>
      {(effectiveError ? (
        <p id={errorId} className={styles.error} role="alert">
          {effectiveError}
        </p>
      ) : hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null)}
      {current.length > 0 ? (
        <ul className={styles.list}>
          {current.map((file) => (
            <li key={`${file.name}-${file.size}`} className={styles.file}>
              <span className={styles.fileIcon} aria-hidden="true">
                <Icon name="doc" size={16} />
              </span>
              <span className={styles.fileMeta}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{formatBytes(file.size)}</span>
              </span>
              {!readOnly && !disabled ? (
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => removeFile(file.name)}
                  aria-label={`Retirer ${file.name}`}
                >
                  <Icon name="close" size={16} />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}