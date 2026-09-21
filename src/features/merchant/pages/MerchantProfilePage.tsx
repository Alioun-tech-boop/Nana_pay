import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button, Icon, InlineAlert, Text } from '../../../design-system'
import { useSession } from '../../../stores/session'
import { ProPageHeader, proStyles } from '../../../components/pro'
import styles from '../merchant.module.css'

export function MerchantProfilePage() {
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
    <div className={proStyles.page}>
      <ProPageHeader title="Profil" />

      {!user ? (
        <InlineAlert tone="warning" title="Session indisponible">
          <Text muted>Reconnectez-vous pour consulter vos informations.</Text>
        </InlineAlert>
      ) : (
        <div className={proStyles.twoCol}>
          <section className={proStyles.panel}>
            <div className={styles.row} style={{ border: 'none', padding: 0, background: 'transparent' }}>
              <Avatar name={user.fullName} size="lg" tone="brand" />
              <div className={styles.rowMain}>
                <span className={styles.rowTitle}>{user.fullName}</span>
                <span className={styles.rowMeta}>
                  <Badge tone="info">Commerçant</Badge>
                  <span>{user.email}</span>
                </span>
              </div>
            </div>

            <dl className={proStyles.definitionList} style={{ marginTop: 'var(--np-space-4)' }}>
              <div className={proStyles.definition}>
                <dt>Téléphone</dt>
                <dd>{user.phone}</dd>
              </div>
              <div className={proStyles.definition}>
                <dt>Identifiant boutique</dt>
                <dd>{user.merchantId ?? '—'}</dd>
              </div>
              <div className={proStyles.definition}>
                <dt>Rôle</dt>
                <dd>Commerçant</dd>
              </div>
            </dl>

            <div className={proStyles.actions} style={{ marginTop: 'var(--np-space-5)' }}>
              <Link to="/merchant/store">
                <Button variant="secondary" leadingIcon={<Icon name="shop" size={16} />}>
                  Gérer la boutique
                </Button>
              </Link>
              <Button
                variant="ghost"
                loading={signingOut}
                onClick={signOut}
                leadingIcon={<Icon name="logout" size={16} />}
              >
                Se déconnecter
              </Button>
            </div>
          </section>

          <section className={proStyles.panel}>
            <h2 className={proStyles.panelTitle}>Sécurité</h2>
            <Text muted>
              Les actions sensibles — confirmation de retrait, règlement, mise à jour du catalogue —
              sont validées par le backend. Masquer une action dans l’interface ne constitue pas une
              autorisation.
            </Text>
          </section>
        </div>
      )}
    </div>
  )
}
