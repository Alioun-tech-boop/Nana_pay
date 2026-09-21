import { Link } from 'react-router-dom'
import { Icon } from '../../../design-system'
import styles from './privacy.module.css'

const SECTIONS = [
  {
    id: 'scope',
    title: '1. Objet et champ d’application',
    body: [
      'La présente politique explique comment NanoPay collecte, utilise, conserve et protège les données personnelles utilisées dans ses services de paiement, d’épargne progressive, de Coffre NanoPay, de crédit et de marketplace.',
      'Elle s’applique aux clients, visiteurs, commerçants et partenaires qui utilisent nos interfaces, nos API ou nos canaux d’assistance. Les traitements propres à un partenaire financier peuvent être complétés par sa propre politique.',
    ],
  },
  {
    id: 'data',
    title: '2. Données que nous traitons',
    body: [
      'Données d’identité : nom, prénom, date de naissance, coordonnées, identifiants de compte et informations nécessaires à la vérification de votre identité.',
      'Données financières : opérations, montants, devise, échéances, progression d’épargne, demandes de crédit, statuts de paiement, retraits et règlements. Ces données servent à exécuter le service et ne remplacent jamais les décisions du backend ou du partenaire habilité.',
      'Données techniques : adresse IP, journaux de sécurité, identifiant de requête, appareil, navigateur, préférences de langue et événements nécessaires au diagnostic et à la prévention de la fraude.',
      'Données de navigation : pages consultées, actions réalisées et préférences de session, dans la mesure nécessaire au fonctionnement et à l’amélioration du service.',
    ],
  },
  {
    id: 'purposes',
    title: '3. Pourquoi nous utilisons vos données',
    body: [
      'Créer et sécuriser votre compte, authentifier votre session et vous envoyer les codes de vérification.',
      'Exécuter les commandes, paiements, versements, opérations de coffre, demandes de crédit, QR et retraits demandés par vous.',
      'Présenter des informations exactes provenant de nos systèmes de référence, détecter les erreurs et maintenir l’intégrité de l’historique financier.',
      'Prévenir la fraude, les doubles opérations, les accès non autorisés, les abus et les incidents de sécurité.',
      'Respecter nos obligations légales, répondre aux demandes des autorités compétentes et défendre nos droits.',
      'Mesurer la performance, corriger les défauts et améliorer l’ergonomie, avec des données agrégées ou minimisées lorsque cela est possible.',
    ],
  },
  {
    id: 'sharing',
    title: '4. Partage et sous-traitants',
    body: [
      'NanoPay ne vend pas vos données personnelles. Nous les partageons uniquement avec les prestataires nécessaires à la fourniture du service : hébergement, authentification, communication, paiement, vérification, support, prévention de la fraude et partenaires financiers autorisés.',
      'Chaque destinataire reçoit uniquement les données nécessaires à sa mission et doit appliquer des engagements de confidentialité, de sécurité et de conservation adaptés.',
      'Nous pouvons divulguer des informations lorsqu’une loi, une décision de justice ou une demande réglementaire valide l’exige, ou pour protéger les utilisateurs et l’intégrité de la plateforme.',
    ],
  },
  {
    id: 'security',
    title: '5. Sécurité et confidentialité',
    body: [
      'Nous appliquons le principe du moindre privilège, des contrôles d’accès, des journaux d’audit, des protections réseau et des mécanismes de détection d’anomalies.',
      'Les opérations sensibles doivent être confirmées par le backend. L’interface ne constitue pas une autorisation financière et ne peut pas modifier seule un solde, un paiement, un crédit ou un retrait.',
      'Ne partagez jamais votre mot de passe, votre code OTP, vos données de carte ou une clé de sécurité. NanoPay ne vous demandera pas un secret par un canal non vérifié.',
      'Aucun système connecté à Internet ne garantit un risque nul. Nous vous informerons selon les exigences applicables en cas d’incident présentant un risque pour vos droits.',
    ],
  },
  {
    id: 'retention',
    title: '6. Conservation',
    body: [
      'Nous conservons les données pendant la durée nécessaire aux finalités décrites, puis pendant les périodes imposées par les obligations comptables, financières, anti-fraude, réglementaires ou contentieuses.',
      'À l’issue de ces périodes, les données sont supprimées, anonymisées ou archivées avec un accès strictement limité. Les durées peuvent varier selon la nature du compte, de l’opération et du partenaire concerné.',
    ],
  },
  {
    id: 'rights',
    title: '7. Vos droits',
    body: [
      'Selon la réglementation applicable, vous pouvez demander l’accès, la rectification, la limitation, la portabilité ou la suppression de vos données, ainsi que vous opposer à certains traitements.',
      'Vous pouvez retirer un consentement lorsque le traitement repose sur celui-ci. Ce retrait ne remet pas en cause les traitements déjà réalisés ni ceux nécessaires à l’exécution d’un contrat ou au respect d’une obligation légale.',
      'Pour exercer vos droits, contactez le support NanoPay depuis votre espace ou utilisez l’adresse officielle indiquée dans votre contrat. Nous pouvons demander une vérification d’identité avant de traiter la demande.',
      'Vous pouvez également introduire une réclamation auprès de l’autorité de protection des données compétente dans votre pays.',
    ],
  },
  {
    id: 'cookies',
    title: '8. Cookies et technologies similaires',
    body: [
      'NanoPay peut utiliser des mécanismes strictement nécessaires à la session, à la sécurité, à la mémorisation des préférences et à la mesure technique du service.',
      'Les technologies non essentielles sont activées selon les choix disponibles dans votre environnement. La désactivation de certaines technologies peut limiter des fonctions, notamment l’authentification ou la sécurité.',
    ],
  },
  {
    id: 'children',
    title: '9. Mineurs',
    body: [
      'Les services financiers NanoPay ne sont pas destinés aux personnes qui ne peuvent pas légalement contracter. Si vous pensez qu’un compte a été créé sans autorisation, contactez immédiatement le support afin que nous puissions prendre les mesures appropriées.',
    ],
  },
  {
    id: 'updates',
    title: '10. Évolution de cette politique',
    body: [
      'Nous pouvons mettre à jour cette politique pour refléter l’évolution de nos services, de la réglementation ou de nos mesures de sécurité. La date de dernière mise à jour sera affichée en tête de page.',
      'En cas de changement important, nous utiliserons un canal approprié pour vous en informer. La poursuite de l’utilisation du service après l’entrée en vigueur d’une mise à jour vaut prise de connaissance, sous réserve des droits applicables.',
    ],
  },
] as const

export function PrivacyPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.backLink}><Icon name="arrow-left" size={16} /> Accueil</Link>
        <span className={styles.updated}>Dernière mise à jour : 20 septembre 2026</span>
      </header>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>NanoPay · confiance et transparence</span>
        <h1>Politique de confidentialité</h1>
        <p>Nous expliquons clairement quelles données sont nécessaires, pourquoi elles sont utilisées et comment vous gardez le contrôle.</p>
      </section>
      <div className={styles.layout}>
        <aside className={styles.contents} aria-label="Sommaire">
          <span className={styles.contentsTitle}>Sommaire</span>
          {SECTIONS.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title.replace(/^\d+\. /, '')}</a>)}
        </aside>
        <article className={styles.article}>
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className={styles.section}>
              <h2>{section.title}</h2>
              {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
          <div className={styles.contactBox}>
            <Icon name="shield" size={20} />
            <div><strong>Une question sur vos données ?</strong><p>Contactez le support depuis votre espace NanoPay et indiquez l’objet de votre demande.</p></div>
          </div>
        </article>
      </div>
    </main>
  )
}
