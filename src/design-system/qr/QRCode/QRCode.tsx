import { useEffect, useId, useRef } from 'react'
import QRCodeLib from 'qrcode'
import { cx } from '../../utils/className'
import styles from './qrcode.module.css'

export interface QRCodeProps {
  value: string
  size?: number
  level?: 'L' | 'M' | 'Q' | 'H'
  quietZone?: number
  bgColor?: string
  fgColor?: string
  label?: string
  description?: string
  className?: string
}

export function QRCode({
  value,
  size = 192,
  level = 'M',
  quietZone = 2,
  bgColor = '#FFFFFF',
  fgColor = '#101418',
  label,
  description,
  className,
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const id = useId()

  useEffect(() => {
    if (!canvasRef.current) return
    void QRCodeLib.toCanvas(canvasRef.current, value, {
      width: size,
      margin: quietZone,
      errorCorrectionLevel: level,
      color: { dark: fgColor, light: bgColor },
    })
  }, [value, size, level, quietZone, bgColor, fgColor])

  return (
    <span className={cx(styles.wrap, className)}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width={size}
        height={size}
        role="img"
        aria-label={label}
        aria-describedby={description ? `${id}-desc` : undefined}
      />
      {description ? (
        <span id={`${id}-desc`} className={styles.srOnly}>
          {description}
        </span>
      ) : null}
      {label ? <span className={styles.label}>{label}</span> : null}
    </span>
  )
}