import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Drawer, EnterTransition, MobileNavigation, Navigation } from '../design-system'
import type { UserRole } from '../types'
import { useSession } from '../features/auth'
import { notificationService } from '../services'
import { useCart } from '../stores/cart'
import { useRequest } from '../hooks'
import { activeSectionFor, getRoleNavigation } from './roleNavigation'
import styles from './appShell.module.css'

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { session } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const { count } = useCart()

  const role: UserRole = session?.user.role ?? 'CLIENT'
  const isClient = role === 'CLIENT'

  const summary = useRequest(() => notificationService.getSummary(), {
    enabled: isClient,
    deps: [],
  })
  const unreadCount = summary.data?.unread ?? 0

  const nav = getRoleNavigation(role, { cartCount: count, unreadCount })

  const segments = location.pathname.split('/').filter(Boolean)
  const active = activeSectionFor(role, segments)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const select = (target: string) => {
    if (target === 'menu') {
      setMenuOpen(true)
      return
    }
    navigate(isClient ? `/${target}` : `/${role.toLowerCase()}/${target}`)
    setMenuOpen(false)
  }

  return (
    <div className={styles.shell}>
      <main className={styles.main}>
        <EnterTransition key={location.pathname}>
          <Outlet />
        </EnterTransition>
      </main>
      <MobileNavigation items={nav.mobileItems} activeId={active} onSelect={select} />
      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        side="left"
        width={300}
        title="Navigation"
      >
        <Navigation items={nav.items} activeId={active} onSelect={select} />
      </Drawer>
    </div>
  )
}
