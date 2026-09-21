import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button, Icon, InlineAlert, Text } from '../../../design-system'
import { useSession } from '../../../stores/session'
import { ProPageHeader, proStyles } from '../../../components/pro'
import styles from '../admin.module.css'

export function AdminProfilePage() {
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--np-space-3)' }}>
              <Avatar name={user.fullName} size="lg" tone="brand" />
              <div className={styles.auditMain}>
                <span className={styles.auditAction}>{user.fullName}</span>
                <span className={styles.auditMeta}>
                  <Badge tone="info">Administrateur</Badge> · {user.email}
                </span>
              </div>
            </div>

            <dl className={proStyles.definitionList} style={{ marginTop: 'var(--np-space-4)' }}>
              <div className={proStyles.definition}>
                <dt>Téléphone</dt>
                <dd>{user.phone}</dd>
              </div>
              <div className={proStyles.definition}>
                <dt>Rôle</dt>
                <dd>Supervision plateforme</dd>
              </div>
            </dl>

            <div className={proStyles.actions} style={{ marginTop: 'var(--np-space-5)' }}>
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
            <h2 className={proStyles.panelTitle}>Périmètre</h2>
            <Text muted>
              L’administration supervise utilisateurs, commerçants, produits, commandes, paiements, crédits et
              flux de la plateforme. L’analyse de crédit reste de la responsabilité de la banque ; la navigation
              admin n’octroie aucune autorisation supplémentaire.
            </Text>
          </section>
        </div>
      )}
    </div>
  )
}