import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  ConfirmDialog,
  Icon,
  InlineAlert,
  MoneyAmount,
  StatusPill,
  Text,
  Textarea,
} from '../../../design-system'
import { merchantService } from '../../../services'
import { useMutation } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { getStatusDefinition } from '../../../lib/status'
import { ProPageHeader, proStyles } from '../../../components/pro'
import type { MerchantScanResult } from '../../../types'
import styles from '../merchant.module.css'

export function MerchantScanPage() {
  const [payload, setPayload] = useState('')
  const [result, setResult] = useState<MerchantScanResult | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [settled, setSettled] = useState(false)

  const scan = useMutation((value: string) =>
    merchantService.scanQr({ payload: value, idempotencyKey: crypto.randomUUID() }),
  )

  const settle = useMutation((orderId: string) =>
    merchantService.settle({ orderId, idempotencyKey: crypto.randomUUID() }),
  )

  const runScan = () => {
    if (!payload.trim()) return
    setSettled(false)
    setResult(null)
    void scan.mutate(payload.trim()).then((data) => {
      if (data) setResult(data)
    })
  }

  const confirmSettlement = () => {
    if (!result) return
    void settle.mutate(result.orderId).then((response) => {
      if (response?.accepted) {
        setConfirmOpen(false)
        setSettled(true)
      }
    })
  }

  return (
    <div className={proStyles.page}>
      <ProPageHeader title="Scanner un QR" />

      <div className={styles.scanPanel}>
        <section className={proStyles.panel}>
          <h2 className={proStyles.panelTitle}>Saisie du QR</h2>
          <div className={styles.stack}>
            <Textarea
              label="Contenu du QR"
              value={payload}
              onChange={(event) => setPayload(event.target.value)}
              rows={4}
              placeholder="Scannez ou saisissez le contenu du QR client."
              hint="Le scanner caméra transmet la même valeur au backend."
            />
            {scan.isError ? (
              <InlineAlert tone="danger" title="Vérification impossible">
                {toUserMessage(scan.error)}
              </InlineAlert>
            ) : null}
            <div className={styles.formActions}>
              <Button
                onClick={runScan}
                loading={scan.isLoading}
                disabled={!payload.trim()}
                leadingIcon={<Icon name="scan" size={16} />}
              >
                Vérifier le QR
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setPayload('')
                  setResult(null)
                  setSettled(false)
                }}
                disabled={scan.isLoading}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </section>

        <section>
          {result ? (
            <div className={styles.scanResult}>
              <div className={styles.scanAmount}>
                <span>
                  <Text muted>{result.orderReference}</Text>
                  <br />
                  <Text>{result.clientFullName}</Text>
                </span>
                <span className={styles.scanAmountValue}>
                  <MoneyAmount amount={result.amount.amount} currency={result.amount.currency} variant="strong" />
                </span>
              </div>

              <div className={proStyles.actions}>
                <StatusPill
                  tone={getStatusDefinition(result.state).tone}
                  label={getStatusDefinition(result.state).label}
                />
                {result.merchantAuthorized ? (
                  <StatusPill tone="success" label="Commerçant autorisé" />
                ) : (
                  <StatusPill tone="danger" label="Commerçant non autorisé" />
                )}
              </div>

              {settled ? (
                <InlineAlert tone="success" title="Règlement enregistré par NanoPay." />
              ) : result.merchantAuthorized ? (
                <>
                  <InlineAlert tone="success" title="QR valide — retrait autorisé par le backend.">
                    Le règlement devient possible une fois le retrait confirmé.
                  </InlineAlert>
                  <div className={proStyles.actions}>
                    <Button onClick={() => setConfirmOpen(true)}>Confirmer le règlement</Button>
                    <Link to={`/merchant/orders/${result.orderId}`}>
                      <Button variant="secondary">Ouvrir la commande</Button>
                    </Link>
                  </div>
                </>
              ) : (
                <InlineAlert tone="danger" title="QR refusé par le backend.">
                  Aucun retrait ne peut être effectué avec ce QR.
                </InlineAlert>
              )}
            </div>
          ) : (
            <div className={styles.scanPlaceholder}>
              <Icon name="qr" size={40} />
              <Text>Aucun QR vérifié pour le moment.</Text>
              <Text muted>Saisissez le contenu du QR client puis lancez la vérification.</Text>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmSettlement}
        title="Confirmer le règlement"
        body={
          result ? (
            <div className={styles.stack}>
              <p>
                Commande {result.orderReference} · {result.clientFullName}
              </p>
              <p>
                Montant :{' '}
                <MoneyAmount amount={result.amount.amount} currency={result.amount.currency} variant="strong" />
              </p>
              <p>Le règlement sera enregistré uniquement après validation du backend.</p>
              {settle.isError ? <InlineAlert tone="danger" title={toUserMessage(settle.error)} /> : null}
            </div>
          ) : null
        }
        confirmLabel="Confirmer le règlement"
        loading={settle.isLoading}
      />
    </div>
  )
}
