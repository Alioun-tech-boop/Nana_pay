import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Alert,
  Amount,
  Avatar,
  Badge,
  BottomSheet,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Combobox,
  ConfirmDialog,
  DataTable,
  DateInput,
  Dialog,
  Divider,
  Drawer,
  Dropdown,
  EmptyState,
  ErrorState,
  FileUpload,
  Heading,
  Icon,
  IconButton,
  Inline,
  Input,
  Logo,
  LogoMark,
  Metric,
  MobileNavigation,
  MoneyAmount,
  NanaAccountCard,
  NanaCard,
  NanaCardElevated,
  NanaCardInteractive,
  NanaGoalCard,
  NanaPhotoCard,
  SavingsPhotoCard,
  TravelPhotoCard,
  FamilyPhotoCard,
  BusinessPhotoCard,
  GoalPhotoCard,
  LifestylePhotoCard,
  NanaQuickAction,
  NanaQuickActions,
  NanaSecurityCard,
  NanaStatCard,
  NanaTransactionCard,
  Navigation,
  OrderStatus,
  OTPInput,
  Pagination,
  PhoneInput,
  Popover,
  ProductCard,
  ProgressBar,
  ProgressRing,
  QRCode,
  RadioGroup,
  ScannerFrame,
  SearchInput,
  Section,
  Select,
  Skeleton,
  SkeletonText,
  Stack,
  StatusBadge as DSStatusBadge,
  StatusPill,
  Stepper,
  StoreCard,
  Switch,
  Table,
  TableContainer,
  TBody,
  TFoot,
  THead,
  Tabs,
  Text,
  Textarea,
  Timeline,
  Topbar,
  Tooltip,
  TransactionRow,
  TransactionRowSkeleton,
  useToast,
} from '../../design-system'
import type { DataTableColumn, NavigationItem } from '../../design-system'
import { STATUS_REGISTRY } from '../../lib/status'
import { StatusBadge } from '../../components/display/StatusBadge'
import styles from './designSystemPage.module.css'

interface ShowcaseProps {
  title: string
  description?: string
  children: ReactNode
}

function Showcase({ title, description, children }: ShowcaseProps) {
  return (
    <Section title={title} description={description}>
      <Card padding="lg">
        <div className={styles.demoCard}>{children}</div>
      </Card>
    </Section>
  )
}

interface OrderRow {
  id: string
  product: string
  amount: number
  status: string
}

const ORDER_ROWS: OrderRow[] = [
  { id: 'NP-2026-00001245', product: 'Smartphone Galaxy A15', amount: 125000, status: 'QR_GENERATED' },
  { id: 'NP-2026-00001230', product: 'Réfrigérateur 160 L', amount: 240000, status: 'FINANCED' },
  { id: 'NP-2026-00001221', product: 'Moto électrique', amount: 485000, status: 'DELIVERED' },
  { id: 'NP-2026-00001198', product: 'Machine à coudre', amount: 78000, status: 'COMPLETED' },
  { id: 'NP-2026-00001185', product: 'Vélo hybride', amount: 42500, status: 'CANCELLED' },
]

const ORDER_COLUMNS: DataTableColumn<OrderRow>[] = [
  { key: 'id', header: 'Commande', width: 170 },
  { key: 'product', header: 'Produit' },
  {
    key: 'amount',
    header: 'Montant',
    align: 'end',
    render: (row) => <MoneyAmount amount={row.amount} />,
  },
  {
    key: 'status',
    header: 'Statut',
    align: 'end',
    render: (row) => <StatusBadge status={row.status} />,
  },
]

const EMPLOYEES: NavigationItem[] = [
  { id: 'dashboard', label: 'Vue d’ensemble', icon: 'home' },
  { id: 'orders', label: 'Commandes', icon: 'receipt' },
  { id: 'savings', label: 'Épargnes', icon: 'coins' },
]

const COMBINBOX_ITEMS = [
  { value: 'ci', label: 'Côte d’Ivoire', group: 'UEMOA' },
  { value: 'sn', label: 'Sénégal', group: 'UEMOA' },
  { value: 'bf', label: 'Burkina Faso', group: 'UEMOA' },
  { value: 'tg', label: 'Togo', group: 'UEMOA' },
  { value: 'cm', label: 'Cameroun', group: 'CEMAC' },
  { value: 'ga', label: 'Gabon', group: 'CEMAC' },
]

function ToastDemo() {
  const { toast } = useToast()
  return (
    <Inline gap={2} wrap>
      <Button variant="secondary" size="sm" onClick={() => toast({ tone: 'success', title: 'Paiement confirmé', description: 'La commande NP-2026-00001245 est financée.' })}>
        Succès
      </Button>
      <Button variant="secondary" size="sm" onClick={() => toast({ tone: 'info', title: 'Mise à jour', description: 'Votre profil a été enregistré.' })}>
        Info
      </Button>
      <Button variant="secondary" size="sm" onClick={() => toast({ tone: 'warning', title: 'Versement en attente', description: 'Le retrait sera confirmé après vérification.' })}>
        Attention
      </Button>
      <Button variant="danger" size="sm" onClick={() => toast({ tone: 'danger', title: 'Opération refusée', description: 'Le code QR a expiré. Générez-en un nouveau.' })}>
        Erreur
      </Button>
    </Inline>
  )
}

const TIMELINE_ITEMS = [
  { title: 'Commande créée', description: 'NP-2026-00001245', time: '12 juil. 14:02', state: 'done' as const },
  { title: 'Financement validé', description: 'Crédit bancaire approuvé', time: '12 juil. 14:10', state: 'done' as const },
  { title: 'QR généré', description: 'Prêt pour le retrait du marchand', state: 'done' as const },
  { title: 'Retrait en attente', description: 'En attente de scan par le marchand', state: 'active' as const },
  { title: 'Livraison', state: 'upcoming' as const },
  { title: 'Paiement commerçant', state: 'upcoming' as const },
  { title: 'Commande terminée', state: 'upcoming' as const },
]

const STEPS = [
  { label: 'Création', state: 'done' as const },
  { label: 'Financement', state: 'done' as const },
  { label: 'Retrait', state: 'current' as const },
  { label: 'Livraison', state: 'upcoming' as const },
]

const BREADCRUMB_ITEMS = [
  { label: 'Accueil', href: '#' },
  { label: 'Commandes', href: '#' },
  { label: 'NP-2026-00001245', current: true },
]

const TABS_ITEMS = [
  { id: 'orders', label: 'Commandes', count: 3 },
  { id: 'savings', label: 'Épargnes', count: 1 },
  { id: 'credit', label: 'Crédit' },
  { id: 'archive', label: 'Archives', disabled: true },
]

export function DesignSystemPage() {
  const [search, setSearch] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [country, setCountry] = useState('')
  const [notified, setNotified] = useState(false)
  const [plan, setPlan] = useState('progressive')
  const [tab, setTab] = useState('orders')
  const [page, setPage] = useState(3)
  const [selected, setSelected] = useState(ORDER_ROWS[0].id)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h2 className={styles.headTitle}>Design System</h2>
        <p className={styles.headDescription}>
          Composants de référence NanoPay. Interface premium, précise et accessible, avec le backend comme source
          de vérité. Cette page est un banc d’essai visuel : elle ne contient aucune logique métier.
        </p>
      </header>

      <Showcase title="Fondations" description="Logos et identité visuelle">
        <Stack gap={5}>
          <Inline gap={6} wrap align="center">
            <Logo size={26} />
            <Logo variant="stacked" markSize={30} />
            <LogoMark size={40} />
          </Inline>
        </Stack>
      </Showcase>

      <Showcase title="Identité NanoPay Nuit" description="Noir profond, surfaces anthracite et hiérarchie des montants">
        <div className={styles.identityPanel}>
          <p className={styles.identityEyebrow}>Épargne progressive · Coffre · Crédit bancaire</p>
          <h2 className={styles.identityHeadline}>
            Achetez maintenant.
            <br />
            Payez en toute confiance.
          </h2>
          <p className={styles.identityLede}>
            Une interface premium et précise : le noir très profond structure les surfaces, les montants
            dominent les labels, les accents de couleur ne signalent que l’état et la représentation d’un module.
          </p>
        </div>
        <Stack gap={4}>
          <div className={styles.moneyHero}>
            <span className={styles.moneyLabel}>Hiérarchie des montants — le chiffre avant le label</span>
            <Inline gap={6} wrap align="baseline">
              <MoneyAmount amount={5120} variant="display" currency="XOF" />
              <Text variant="body-sm" muted>
                solde principal épargné cette année
              </Text>
            </Inline>
          </div>
          <Inline gap={8} wrap align="baseline">
            <div className={styles.moneyHero}>
              <span className={styles.moneyLabel}>Progression</span>
              <span className={styles.statFigure}>73 %</span>
            </div>
            <div className={styles.moneyHero}>
              <span className={styles.moneyLabel}>Avant échéance</span>
              <span className={styles.statFigure}>18 jours</span>
            </div>
          </Inline>
          <Divider />
          <span className={styles.groupLabel}>Accents par module</span>
          <div className={styles.domainChips}>
            <span className={`${styles.domainChip} ${styles['domainChip--savings']}`}>
              <span className={styles.domainDot} aria-hidden="true" />Épargne progressive
            </span>
            <span className={`${styles.domainChip} ${styles['domainChip--vault']}`}>
              <span className={styles.domainDot} aria-hidden="true" />Coffre NanoPay
            </span>
            <span className={`${styles.domainChip} ${styles['domainChip--credit']}`}>
              <span className={styles.domainDot} aria-hidden="true" />Crédit bancaire
            </span>
            <span className={`${styles.domainChip} ${styles['domainChip--payment']}`}>
              <span className={styles.domainDot} aria-hidden="true" />Paiement
            </span>
            <span className={`${styles.domainChip} ${styles['domainChip--confirmation']}`}>
              <span className={styles.domainDot} aria-hidden="true" />Confirmation
            </span>
          </div>
          <Divider />
          <span className={styles.groupLabel}>Surfaces — noir très profond, anthracite, graphite</span>
          <div className={styles.surfaceSwatches}>
            <div className={styles.swatch}>
              <span className={`${styles.swatchSwatch} ${styles.swatchPage}`} />
              <span className={styles.swatchLabel}>Noir profond</span>
              <span className={styles.swatchHint}>--np-bg-page</span>
            </div>
            <div className={styles.swatch}>
              <span className={`${styles.swatchSwatch} ${styles.swatchSurface}`} />
              <span className={styles.swatchLabel}>Surface</span>
              <span className={styles.swatchHint}>--np-bg-surface</span>
            </div>
            <div className={styles.swatch}>
              <span className={`${styles.swatchSwatch} ${styles.swatchAnthracite}`} />
              <span className={styles.swatchLabel}>Anthracite</span>
              <span className={styles.swatchHint}>--np-bg-surface-2</span>
            </div>
            <div className={styles.swatch}>
              <span className={`${styles.swatchSwatch} ${styles.swatchGraphite}`} />
              <span className={styles.swatchLabel}>Graphite</span>
              <span className={styles.swatchHint}>--np-bg-surface-3</span>
            </div>
          </div>
        </Stack>
      </Showcase>

      <Showcase title="Typographie" description="Échelle type et correspondances">
        <Stack gap={3}>
          <Heading variant="display">NanoPay, la finance simple et transparente</Heading>
          <Heading variant="h1">Épargne progressive jusqu’à 48 mois</Heading>
          <Heading variant="h2">Coffre NanoPay réservé aux salariés éligibles</Heading>
          <Heading variant="h3">Crédit bancaire après analyse du dossier</Heading>
          <Divider />
          <Text>Texte courant — les montants sont toujours affichés en clair.</Text>
          <Text variant="body-sm" muted>
            Ligne secondaire utile pour les sous-informations.
          </Text>
          <Text variant="caption">Mentions légales, horodatage et notes de bas de page.</Text>
          <Text variant="label">LIBELLÉS DE FORMULAIRE ET COULEURS DE STATUT</Text>
          <Text variant="code">const total = backend.total</Text>
          <Text variant="monetary">250 000 F CFA</Text>
        </Stack>
      </Showcase>

      <Showcase title="Boutons" description="Variants, tailles et états de chargement">
        <Stack gap={4}>
          <Inline gap={3} wrap>
            <Button variant="primary">Action principale</Button>
            <Button variant="secondary">Action secondaire</Button>
            <Button variant="ghost">Action discrète</Button>
            <Button variant="danger">Action destructrice</Button>
          </Inline>
          <Inline gap={3} wrap>
            <Button size="sm">Petit</Button>
            <Button size="md">Moyen</Button>
            <Button size="lg">Grand</Button>
          </Inline>
          <Inline gap={3} wrap>
            <Button loading>Chargement</Button>
            <Button leadingIcon={<Icon name="money" size={16} />}>Confirmer le paiement</Button>
            <Button variant="secondary" trailingIcon={<Icon name="external" size={16} />}>
              Voir la facture
            </Button>
            <IconButton label="Scanner un QR" icon="scan" />
            <IconButton label="Verrouiller" icon="lock" variant="outline" />
            <IconButton label="Plus d’options" icon="more" variant="ghost" />
          </Inline>
        </Stack>
      </Showcase>

      <Showcase title="Champs de saisie" description="Formulaires accessibles, labels toujours liés">
        <div className={styles.grid2}>
          <Stack gap={4}>
            <Input label="Nom complet" placeholder="Ada Doumbia" hint="Tel que sur la pièce d’identité." />
            <Input label="Numéro d’identification" placeholder="NP-2026-XXXX" error="Ce champ est requis." />
            <Select label="Pays de résidence" defaultValue="ci">
              <option value="ci">Côte d’Ivoire</option>
              <option value="sn">Sénégal</option>
              <option value="bf">Burkina Faso</option>
            </Select>
            <Textarea label="Adresse de livraison" placeholder="Abidjan, Cocody…" />
            <PhoneInput value={phone} onValueChange={setPhone} label="Téléphone mobile" />
          </Stack>
          <Stack gap={4}>
            <SearchInput value={search} onChange={setSearch} label="Rechercher un produit" placeholder="Smartphone, réfrigérateur…" />
            <OTPInput value={otp} onChange={setOtp} length={6} label="Code de vérification" hint="Saisissez le code reçu par SMS." />
            <DateInput label="Date de naissance" placeholder="jj/mm/aaaa" />
            <Combobox
              items={COMBINBOX_ITEMS}
              value={country}
              onSelect={setCountry}
              label="Pays"
              placeholder="Choisir un pays"
              hint="Groupes UEMOA et CEMAC."
            />
          </Stack>
        </div>
        <Divider />
        <div className={styles.row}>
          <Checkbox label="Accepter les conditions générales" />
          <RadioGroup
            name="plan"
            label="Mode de financement"
            value={plan}
            onChange={setPlan}
            options={[
              { value: 'progressive', label: 'Épargne progressive' },
              { value: 'vault', label: 'Coffre NanoPay' },
              { value: 'credit', label: 'Crédit bancaire' },
            ]}
          />
          <Switch checked={notified} onCheckedChange={setNotified} label="Recevoir les notifications" />
        </div>
        <FileUpload
          label="Pièces justificatives"
          hint="Pièce d’identité et quittance de salaire."
          accept="image/png,image/jpeg,application/pdf"
          maxSize={5 * 1024 * 1024}
        />
      </Showcase>

      <Showcase title="Retour d’état" description="Alertes, badges et états vides / erreur">
        <Stack gap={3}>
          <Alert tone="neutral" title="En attente de vérification" onClose={() => undefined}>
            Votre paiement est en cours de confirmation par notre partenaire.
          </Alert>
          <Alert tone="success" title="Paiement confirmé">
            La commande NP-2026-00001245 est correctement financée.
          </Alert>
          <Alert tone="neutral" title="Versement bientôt disponible" action={<Button size="sm" variant="secondary">Actualiser</Button>} />
          <Alert tone="danger" title="QR expiré" action={<Button size="sm">Régénérer le QR</Button>} />
        </Stack>
        <Divider />
        <div className={styles.row}>
          <Badge tone="success">Payé</Badge>
          <StatusPill tone="success" label="Confirmée" />
          <StatusPill tone="neutral" label="En attente" pulse />
          <StatusPill tone="danger" label="Échouée" />
          <StatusBadge status="COMPLETED" />
          <DSStatusBadge status="QR_GENERATED" />
          <DSStatusBadge status="CANCELLED" />
          <DSStatusBadge status="PROCESSING" pulse />
        </div>
        <Divider />
        <div className={styles.row}>
          <Skeleton width={160} height={16} />
          <Skeleton width={40} height={40} radius="50%" />
          <SkeletonText lines={2} />
        </div>
        <ToastDemo />
        <div className={styles.grid}>
          <EmptyState title="Aucun achat pour le moment" description="Découvrez les produits disponibles et commencez votre premier financement." action={<Button size="sm">Explorer les produits</Button>} />
          <ErrorState description="Impossible de charger les commandes. Vérifiez votre connexion." onRetry={() => undefined} />
        </div>
      </Showcase>

      <Showcase title="Registre de statuts" description="Enum backend → libellé français. Tout statut inconnu reste affiché tel quel, sans ton forcé.">
        <div className={styles.statusGrid}>
          {Object.entries(STATUS_REGISTRY).map(([status, definition]) => (
            <div key={status} className={styles.statusCell}>
              <StatusBadge status={status} />
              <Text variant="caption" muted>
                {status}
              </Text>
              <Text variant="caption" muted>
                {definition.label}
              </Text>
            </div>
          ))}
        </div>
        <Divider />
        <div className={styles.row}>
          <StatusBadge status="UNKNOWN_FUTURE_STATE" />
          <Text variant="caption" muted>
            Statut futur inconnu : passthrough neutre, jamais inventé.
          </Text>
        </div>
      </Showcase>

      <Showcase title="Affichage et données" description="Cartes, métriques, tableaux et statuts">
        <div className={styles.grid}>
          <Card padding="md">
            <Metric label="Solde épargne" value={<MoneyAmount amount={125000} />} delta={12} icon="coins" />
          </Card>
          <Card padding="md">
            <Metric label="Progression" loading />
          </Card>
          <Card padding="md">
            <Metric label="Échéance" value={<MoneyAmount amount={24500} />} hint="Dans 9 jours" icon="calendar" />
          </Card>
        </div>
        <Divider />
        <div className={styles.row}>
          <div style={{ width: 240 }}>
            <ProgressBar value={46} showLabel label="Avancement du financement" />
          </div>
          <ProgressRing value={74} size={56} label="Progression de l’épargne" showValue />
          <Inline gap={2}>
            <Avatar name="Ada Doumbia" statusDot />
            <Avatar name="Kevin Traoré" tone="gold" />
            <Avatar name="Sita Coulibaly" tone="success" />
            <Avatar name="Marc Yao" tone="neutral" />
            <Avatar name="Nadia Bamba" tone="danger" />
          </Inline>
        </div>
        <Divider />
        <TableContainer>
          <Table aria-label="Liste des commandes">
            <THead>
              <tr>
                <th scope="col">Commande</th>
                <th scope="col">Produit</th>
                <th scope="col" style={{ textAlign: 'end' }}>Montant</th>
              </tr>
            </THead>
            <TBody>
              {ORDER_ROWS.slice(0, 3).map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.product}</td>
                  <td style={{ textAlign: 'end' }}>
                    <MoneyAmount amount={row.amount} />
                  </td>
                </tr>
              ))}
            </TBody>
            <TFoot>
              <tr>
                <td colSpan={2}>Total démonstration</td>
                <td style={{ textAlign: 'end' }}>
                  <MoneyAmount amount={ORDER_ROWS.slice(0, 3).reduce((sum, row) => sum + row.amount, 0)} />
                </td>
              </tr>
            </TFoot>
          </Table>
        </TableContainer>
        <DataTable<OrderRow>
          columns={ORDER_COLUMNS}
          rows={ORDER_ROWS}
          rowKey={(row) => row.id}
          caption="Commandes récentes"
          onRowClick={(row) => setSelected(row.id)}
          aria-label="Commandes récentes"
        />
        <Text variant="caption" muted>
          Ligne sélectionnée : {selected}
        </Text>
        <Divider />
        <Stack gap={3}>
          <TransactionRow
            icon="money"
            iconTone="success"
            title="Paiement d’épargne"
            subtitle="NP-2026-00001245"
            amount={25000}
            timestamp="12 juil. 14:02"
            status={<StatusPill tone="success" label="Confirmé" />}
          />
          <TransactionRow
            icon="vault"
            iconTone="neutral"
            title="Coffre NanoPay"
            subtitle="Versement salarié"
            amount={25000}
            timestamp="11 juil. 09:40"
            status={<StatusPill tone="neutral" label="À venir" />}
          />
          <TransactionRow icon="receipt" iconTone="neutral" title="Frais de dossier" amount={3250} negative timestamp="09 juil. 16:15" />
          <TransactionRowSkeleton />
        </Stack>
      </Showcase>

      <Showcase title="Système de cartes premium" description="Fondation unique : surfaces sombres, bord très subtil, ombre extrêmement douce, états cohérents">
        <div className={styles.grid}>
          <NanaStatCard label="Solde épargne" value={<MoneyAmount amount={125000} />} delta={12} icon="coins" />
          <NanaStatCard label="Prochaine échéance" value={<MoneyAmount amount={24500} />} hint="Dans 9 jours" icon="calendar" />
          <NanaStatCard label="Statistique en chargement" loading />
        </div>
        <Divider />
        <div className={styles.grid2}>
          <NanaAccountCard
            label="Coffre NanoPay"
            number="•••• 4821"
            amount={512000}
            holder="Ada Doumbia"
            badge={<StatusPill tone="success" label="Actif" />}
            footer={<Button size="sm" variant="secondary">Gérer</Button>}
          />
          <NanaGoalCard
            label="Objectif moto électrique"
            saved={312000}
            target={485000}
            deadline="Échéance 12 mois"
            action={<Button size="sm" variant="secondary">Épargner</Button>}
          />
        </div>
        <Divider />
        <div className={styles.grid}>
          <NanaPhotoCard
            label="Comptes"
            amount={850000}
            caption="Épargne progressive"
            title="Objectif"
            titleMeta="68 %"
            progress={{ value: 68, tone: 'gold', label: 'Objectif épargne' }}
            badge={<Badge tone="neutral">Populaire</Badge>}
            icon="coins"
            tone="savings"
            variant="savings"
            actionLabel="Épargne automatique"
          />
          <NanaTransactionCard
            icon="money"
            iconTone="success"
            title="Paiement d’épargne"
            subtitle="NP-2026-00001245"
            amount={25000}
            timestamp="12 juil. 14:02"
            status={<StatusPill tone="success" label="Confirmé" />}
          />
          <NanaTransactionCard
            icon="receipt"
            iconTone="neutral"
            title="Frais de dossier"
            amount={3250}
            negative
            timestamp="09 juil. 16:15"
          />
        </div>
        <Divider />
        <div className={styles.grid}>
          <NanaSecurityCard
            title="Code de retrait"
            description="Validation à deux facteurs avant chaque retrait."
            icon="lock"
            state="active"
          />
          <NanaSecurityCard
            title="Vérification d’identité"
            description="Pièce justificative en cours d’analyse par la banque."
            icon="shield"
            state="pending"
          />
          <NanaCardInteractive tone="vault" aria-label="Carte interactive">
            <Text variant="body-sm" muted>
              Carte interactive — survolez et pressez pour observer les états.
            </Text>
          </NanaCardInteractive>
        </div>
        <Divider />
        <div className={styles.grid}>
          <NanaCardElevated>
            <Text variant="body-sm" muted>
              Carte élevée — profondeur renforcée sans lourdeur.
            </Text>
          </NanaCardElevated>
          <NanaCard loading loadingLabel="Chargement de la carte">
            <Text variant="body-sm">Contenu estompé pendant le chargement.</Text>
          </NanaCard>
          <NanaCard disabled>
            <Text variant="body-sm">Carte désactivée, non interactive.</Text>
          </NanaCard>
        </div>
      </Showcase>

      <Showcase
        title="Variantes photo"
        description="La photo fait partie de la composition : gradient transparent → noir, texte rendu par l’interface"
      >
        <div className={styles.grid}>
          <SavingsPhotoCard
            label="Comptes"
            amount={850000}
            caption="Épargne progressive"
            progress={{ value: 68, tone: 'gold', label: 'Objectif épargne' }}
          />
          <TravelPhotoCard
            label="Projet"
            amount={450000}
            caption="Voyage"
            progress={{ value: 42, tone: 'brand', label: 'Progression voyage' }}
          />
          <FamilyPhotoCard
            label="Épargne"
            amount={320000}
            caption="Famille"
            progress={{ value: 55, tone: 'success', label: 'Progression famille' }}
          />
          <BusinessPhotoCard
            label="Investissement"
            amount={1200000}
            caption="Activité"
            progress={{ value: 30, tone: 'brand', label: 'Progression activité' }}
          />
          <GoalPhotoCard
            label="Objectif"
            amount={485000}
            caption="Moto électrique"
            progress={{ value: 78, tone: 'gold', label: 'Progression objectif' }}
          />
          <LifestylePhotoCard
            label="Loisirs"
            amount={150000}
            caption="Envie"
            progress={{ value: 20, tone: 'cyan', label: 'Progression loisirs' }}
          />
        </div>
      </Showcase>

      <Showcase
        title="Actions rapides"
        description="Cercles elevated alignés au centre. Grille responsive : défilement horizontal quand l’espace manque, sans compression."
      >
        <div className={styles.quickActionsDemo}>
          <NanaQuickActions aria-label="Actions rapides de démonstration">
            {(['recharge', 'send', 'withdraw', 'pay', 'scan', 'more'] as const).map((variant) => (
              <NanaQuickAction key={variant} variant={variant} />
            ))}
          </NanaQuickActions>
        </div>
      </Showcase>

      <Showcase title="Cartes produit et marchand" description="Composants de catalogue réutilisables">
        <div className={styles.grid}>
          <ProductCard
            name="Smartphone Galaxy A15"
            price={125000}
            badge={<Badge tone="neutral">Populaire</Badge>}
            merchant="ElectroPlus Abidjan"
            active={selected === ORDER_ROWS[0].id}
            onClick={() => setSelected(ORDER_ROWS[0].id)}
          />
          <ProductCard
            name="Réfrigérateur 160 L"
            price={240000}
            priceNote="Financement 12 mois"
            icon="box"
            merchant="FrigoPro"
          />
          <StoreCard
            name="ElectroPlus Abidjan"
            image="/stores/electroplus.jpg"
            imageWidth={300}
            imageHeight={225}
            status="verified"
          />
        </div>
        <Divider />
        <div className={styles.grid}>
          <OrderStatus stage="QR généré" tone="neutral" icon="qr" description="En attente de scan par le marchand" />
          <OrderStatus stage="Retrait confirmé" tone="success" icon="check-circle" description="Le marchand a été crédité" />
          <OrderStatus stage="QR expiré" tone="danger" icon="alert-circle" description="Générez un nouveau code" />
        </div>
      </Showcase>

      <Showcase title="Argent" description="Affichage monétaire univoque, toujours avec devise">
        <Stack gap={3}>
          <Inline gap={5} wrap align="center">
            <MoneyAmount amount={250000} variant="display" />
            <MoneyAmount amount={125000} variant="strong" />
            <MoneyAmount amount={125000} />
            <MoneyAmount amount={-3250} signed />
            <MoneyAmount amount={25000} signed currency="EUR" />
            <MoneyAmount amount={1500.5} currency="USD" />
          </Inline>
          <Inline gap={5} wrap align="center">
            <Amount value={0} currency="XOF" className="np-number" />
            <Text variant="caption" muted>
              Démonstration uniquement — les montants réels proviennent toujours du backend.
            </Text>
          </Inline>
        </Stack>
      </Showcase>

      <Showcase title="Surcouches" description="Tooltips, menus, fenêtres et panneaux">
        <div className={styles.row}>
          <Tooltip content="Scanner un QR marchand">
            <IconButton label="Scanner un QR" icon="scan" />
          </Tooltip>
          <Dropdown
            trigger={<Button variant="secondary">Menu d’actions</Button>}
            label="Actions sur la commande"
            items={[
              { label: 'Voir la commande', icon: 'receipt', onSelect: () => setDialogOpen(true) },
              { label: 'Télécharger la facture', icon: 'download' },
              { label: 'Signaler un problème', icon: 'alert-circle', separatorBefore: true, danger: true, onSelect: () => setConfirmOpen(true) },
            ]}
          />
          <Popover label="Informations de paiement" trigger={<Button variant="secondary">Aide au paiement</Button>}>
            <Stack gap={2}>
              <Text variant="body-sm">
                Un virement Mobile Money n’est confirmé qu’après validation par notre partenaire financier.
              </Text>
              <Button size="sm" fullWidth>En savoir plus</Button>
            </Stack>
          </Popover>
          <Button variant="secondary" onClick={() => setDialogOpen(true)}>Ouvrir la fenêtre</Button>
          <Button variant="secondary" onClick={() => setConfirmOpen(true)}>Confirmation</Button>
          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Panneau latéral</Button>
          <Button variant="secondary" onClick={() => setSheetOpen(true)}>Feuille mobile</Button>
        </div>
      </Showcase>

      <Showcase title="QR" description="Génération et cadre de scan">
        <div className={styles.grid}>
          <Stack gap={3} align="center">
            <QRCode
              value="nanopay://withdrawal?order=NP-2026-00001245"
              size={208}
              label="Retrait marchand"
              description="QR de démonstration pour le retrait de la commande NP-2026-00001245"
            />
          </Stack>
          <Stack gap={3} align="center">
            <ScannerFrame hint="Placez le QR marchand dans le cadre pour vérifier le retrait." scanning>
              <span className={styles.scannerPlaceholder}>
                <Icon name="scan" size={48} />
              </span>
            </ScannerFrame>
          </Stack>
        </div>
      </Showcase>

      <Showcase title="Navigation" description="Onglets, fil d’Ariane et pagination">
        <Stack gap={5}>
          <Tabs items={TABS_ITEMS} value={tab} onChange={setTab} />
          <Tabs items={TABS_ITEMS} variant="pills" value={tab} onChange={setTab} />
          <Tabs items={TABS_ITEMS} variant="segmented" value={tab} onChange={setTab} />
          <Breadcrumb items={BREADCRUMB_ITEMS} />
          <Pagination page={page} pageCount={24} onPageChange={setPage} />
          <div className={styles.grid2}>
            <Navigation items={EMPLOYEES} activeId="orders" onSelect={() => undefined} />
            <Topbar title="Topbar démo" subtitle="Titre de page et actions" actions={<Button size="sm">Nouvelle commande</Button>} />
          </div>
          <MobileNavigation items={EMPLOYEES} activeId="orders" onSelect={() => undefined} />
        </Stack>
      </Showcase>

      <Showcase title="Progression" description="Cycle de vie d’une commande et étapes">
        <div className={styles.grid2}>
          <Timeline items={TIMELINE_ITEMS} />
          <Stepper steps={STEPS} orientation="vertical" />
        </div>
        <Divider />
        <Stepper steps={STEPS} />
      </Showcase>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Détail de la commande"
        description="NP-2026-00001245"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Fermer</Button>
            <Button onClick={() => setDialogOpen(false)}>Voir le QR</Button>
          </>
        }
      >
        <Stack gap={3}>
          <Inline justify="between">
            <Text>Montant total</Text>
            <MoneyAmount amount={125000} variant="strong" />
          </Inline>
          <ProgressBar value={100} tone="success" showLabel label="Avancement" />
        </Stack>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Signaler un problème"
        body="Vous allez déclarer un incident sur cette commande. Cette action ne peut pas être annulée automatiquement."
        confirmLabel="Signaler"
        confirmTone="danger"
        onConfirm={() => {
          setConfirmOpen(false)
        }}
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Paramètres de notification"
        description="Préférences de votre compte"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>Annuler</Button>
            <Button onClick={() => setDrawerOpen(false)}>Enregistrer</Button>
          </>
        }
      >
        <Stack gap={4}>
          <Switch checked={notified} onCheckedChange={setNotified} label="Confirmation de paiement" />
          <Switch checked label="Retrait confirmé par le marchand" />
          <Switch checked={false} label="Promotions des marchands" />
        </Stack>
      </Drawer>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Choisir une méthode de retrait"
        footer={
          <Button fullWidth onClick={() => setSheetOpen(false)}>Continuer</Button>
        }
      >
        <Stack gap={3}>
          <TransactionRow icon="wallet" title="Mobile Money" subtitle="Orange Money · +225 07 00 00 00 00" amount={125000} />
          <TransactionRow icon="bank" title="Compte bancaire" subtitle="Mote de crédit éligible" amount={125000} />
        </Stack>
      </BottomSheet>
    </div>
  )
}