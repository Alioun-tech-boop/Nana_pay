import type { ReactNode } from 'react'

export const iconNames = [
  'arrow-left',
  'arrow-right',
  'arrow-up-right',
  'alert',
  'alert-circle',
  'bank',
  'box',
  'card',
  'camera',
  'calendar',
  'check',
  'check-circle',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'chevron-up',
  'clock',
  'close',
  'coins',
  'doc',
  'download',
  'eye',
  'eye-off',
  'external',
  'filter',
  'home',
  'info',
  'lock',
  'logout',
  'menu',
  'minus',
  'more',
  'money',
  'plus',
  'qr',
  'receipt',
  'refresh',
  'scan',
  'search',
  'settings',
  'shield',
  'shop',
  'truck',
  'upload',
  'user',
  'vault',
  'wallet',
] as const

export type IconName = (typeof iconNames)[number]

export const iconPaths: Record<IconName, ReactNode> = {
  'arrow-left': (
    <>
      <path d="M20 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </>
  ),
  'arrow-right': (
    <>
      <path d="M4 12h15" />
      <path d="M13 6l6 6-6 6" />
    </>
  ),
  'arrow-up-right': (
    <>
      <path d="M7 17L17 7" />
      <path d="M9 7h8v8" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.7 2.6 17.1a2 2 0 0 0 1.8 2.9h15.2a2 2 0 0 0 1.8-2.9L13.7 3.7a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4.5" />
      <path d="M12 16.5h.01" />
    </>
  ),
  'alert-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4.5" />
      <path d="M12 15.5h.01" />
    </>
  ),
  bank: (
    <>
      <path d="M3 9.5 12 4l9 5.5" />
      <path d="M5 9.5v6M9.5 9.5v6M14.5 9.5v6M19 9.5v6" />
      <path d="M4 15.5h16v3H4z" />
      <path d="M3 20.5h18" />
    </>
  ),
  box: (
    <>
      <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M4 7.5l8 4.5 8-4.5" />
      <path d="M12 12v9" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2.5" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </>
  ),
  camera: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="2.5" />
      <path d="M8.5 7l1.3-2h4.4l1.3 2" />
      <circle cx="12" cy="13" r="3.2" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="15" rx="2.5" />
      <path d="M4 10h16" />
      <path d="M8.5 3.5V7M15.5 3.5V7" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.7 2.7L16.5 9.5" />
    </>
  ),
  'chevron-down': <path d="M6 9l6 6 6-6" />,
  'chevron-left': <path d="M15 6l-6 6 6 6" />,
  'chevron-right': <path d="M9 6l6 6-6 6" />,
  'chevron-up': <path d="M6 15l6-6 6 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="12" cy="7" rx="6" ry="2.5" />
      <path d="M6 7v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V7" />
      <path d="M6 12v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5" />
    </>
  ),
  doc: (
    <>
      <path d="M7 3.5h7L18 7.5v13H7z" />
      <path d="M14 3.5v4h4" />
      <path d="M10 12h5M10 16h5" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v10" />
      <path d="M7 10l5 4 5-4" />
      <path d="M5 20h14" />
    </>
  ),
  eye: (
    <>
      <path d="M3 12c2-4.2 5-6.5 9-6.5S19 7.8 21 12c-2 4.2-5 6.5-9 6.5S5 16.2 3 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M10.6 5.6A8.6 8.6 0 0 1 12 5.5c4 0 7 2.3 9 6.5a14.5 14.5 0 0 1-2.2 3.2M6.5 7A15 15 0 0 0 3 12c2 4.2 5 6.5 9 6.5 1.4 0 2.8-.3 4-.9" />
      <path d="M3 3l18 18" />
    </>
  ),
  external: (
    <>
      <path d="M14 5h5v5" />
      <path d="M19 5l-8 8" />
      <path d="M12 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
    </>
  ),
  filter: (
    <>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </>
  ),
  home: (
    <>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v9h12v-9" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 7.5h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  logout: (
    <>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 8l-4 4 4 4" />
      <path d="M6 12h10" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  more: (
    <>
      <circle cx="5.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  money: (
    <>
      <rect x="3" y="7" width="18" height="10" rx="2.5" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6.5 10v4M17.5 10v4" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  qr: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <path d="M13 13h2v2h-2zM16.5 13h2v2h-2zM13 16.5h2v2h-2zM16.5 16.5h2v2h-2z" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3.5h12V20l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5V3.5Z" />
      <path d="M9 8h6M9 11.5h6M9 15h3" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.5-4L4 9.5" />
      <path d="M4 5v4.5h4.5" />
      <path d="M4 13a8 8 0 0 0 14.5 4L20 14.5" />
      <path d="M20 19v-4.5h-4.5" />
    </>
  ),
  scan: (
    <>
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
      <path d="M4 12h16" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20.5 20.5 16 16" />
    </>
  ),
  settings: (
    <>
      <path d="M4 6h9M17 6h3" />
      <circle cx="15.5" cy="6" r="2" />
      <path d="M4 12h3M11 12h9" />
      <circle cx="8.5" cy="12" r="2" />
      <path d="M4 18h9M17 18h3" />
      <circle cx="15.5" cy="18" r="2" />
    </>
  ),
  shield: <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />,
  shop: (
    <>
      <path d="M4 8.5 5.5 4h13L20 8.5" />
      <path d="M5 8.5V20h14V8.5" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  truck: (
    <>
      <rect x="3" y="6" width="12" height="10" rx="1.5" />
      <path d="M15 10h3l3 3v3h-6" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="16.5" cy="17.5" r="1.8" />
    </>
  ),
  upload: (
    <>
      <path d="M12 14V4" />
      <path d="M7 8l5-4 5 4" />
      <path d="M5 20h14" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20c1.4-3 4-4.5 7.5-4.5s6.1 1.5 7.5 4.5" />
    </>
  ),
  vault: (
    <>
      <rect x="4" y="6" width="16" height="12" rx="2.5" />
      <rect x="17" y="9.5" width="3.5" height="2" rx="1" />
      <circle cx="11.5" cy="12" r="3" />
      <path d="M11.5 10v2.2" />
    </>
  ),
  wallet: (
    <>
      <rect x="3.5" y="6" width="17" height="13" rx="2.5" />
      <path d="M3.5 10h17" />
      <circle cx="16.5" cy="14.5" r="1" />
    </>
  ),
}