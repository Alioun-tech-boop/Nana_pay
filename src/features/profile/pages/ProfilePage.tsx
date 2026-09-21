import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button, Icon, InlineAlert, Text } from '../../../design-system'
import type { UserRole } from '../../../types'
import { useSession } from '../../../stores/session'
import { PageHeader } from '../../../components/client'
import viewStyles from '../../../components/client/view.module.css'
import styles from '../profile.module.css'

const ROLE_LABELS: Record<UserRole, string> = {
  CLIENT: 'Client',
  MERCHANT: 'Commerçant',
  BANK: 'Banque',
  ADMIN: 'Administrateur',
}

export function ProfilePage() {
  const { session, logout } = useSession()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  const user = session?.user

  async function signOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className={viewStyles.page}>
      <PageHeader title="Profil" />

      {!user ? (
        <InlineAlert tone="warning" title="Session indisponible">
          <Text muted>Vos informations de profil ne sont pas disponibles. Reconnectez-vous pour continuer.</Text>
        </InlineAlert>
      ) : (
        <>
          <section className={styles.identity}>
            <Avatar name={user.fullName} size="lg" tone="brand" />
            <div className={styles.identityMain}>
              <span className={styles.kicker}>Compte personnel · NanoPay</span>
              <h2 className={styles.name}>{user.fullName}</h2>
              <div className={styles.meta}>
                <Badge tone="info">{ROLE_LABELS[user.role]}</Badge>
                <span className={styles.verified}><Icon name="check-circle" size={14} /> Profil actif</span>
              </div>
            </div>
            <div className={styles.identityStatus}><span /> Compte sécurisé</div>
          </section>

          <div className={styles.panels}>
            <section className={`${styles.panel} ${styles.panelWide}`}>
              <div className={styles.panelHeader}><div><span className={styles.panelEyebrow}>Vue d’ensemble</span><h3 className={styles.panelTitle}>Coordonnées</h3></div><Icon name="user" size={20} /></div>
              <dl className={styles.definitions}>
                <div className={styles.definition}><dt>E-mail</dt><dd>{user.email}</dd></div>
                <div className={styles.definition}><dt>Téléphone</dt><dd>{user.phone}</dd></div>
                <div className={styles.definition}><dt>Rôle</dt><dd>{ROLE_LABELS[user.role]}</dd></div>
              </dl>
            </section>
            <section className={styles.panel}>
              <div className={styles.panelHeader}><div><span className={styles.panelEyebrow}>Protection</span><h3 className={styles.panelTitle}>Sécurité</h3></div><Icon name="shield" size={20} /></div>
              <ul className={styles.links}>
                <li><span>Authentification</span><strong>Active</strong></li>
                <li><span>Session</span><strong className={styles.secure}>Sécurisée</strong></li>
                <li>
                  <Link to="/purchases">Mes achats</Link>
                </li>
                <li>
                  <Link to="/history">Historique des opérations</Link>
                </li>
                <li>
                  <Link to="/notifications">Notifications</Link>
                </li>
                <li><Link to="/privacy">Politique de confidentialité</Link></li>
              </ul>
              <div className={styles.logout}>
                <Button
                  variant="danger"
                  loading={signingOut}
                  leadingIcon={<Icon name="logout" size={16} />}
                  onClick={() => void signOut()}
                >
                  Se déconnecter
                </Button>
              </div>
            </section>
            <section className={styles.panel}>
              <div className={styles.panelHeader}><div><span className={styles.panelEyebrow}>Activité</span><h3 className={styles.panelTitle}>Votre espace</h3></div><Icon name="clock" size={20} /></div>
              <ul className={styles.links}>
                <li><Link to="/history">Historique des opérations</Link></li>
                <li><Link to="/savings">Épargne progressive</Link></li>
                <li><Link to="/vault">Coffre NanoPay</Link></li>
                <li><Link to="/credit">Crédit bancaire</Link></li>
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  )
}