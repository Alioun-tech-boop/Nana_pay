import type { ReactNode } from 'react'
import { tokenStyles } from '../tokens'
import './global.css'

export interface ThemeProviderProps {
  children: ReactNode
  lang?: string
}

export function ThemeProvider({ children, lang = 'fr' }: ThemeProviderProps) {
  return (
    <>
      <style key="np-tokens">{`:root {\n${tokenStyles()}\n}`}</style>
      <div lang={lang}>{children}</div>
    </>
  )
}