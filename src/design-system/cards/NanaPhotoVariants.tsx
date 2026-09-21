import { NanaPhotoCard } from './NanaPhotoCard'
import type { NanaPhotoCardProps } from './NanaPhotoCard'

export type NanaPhotoCardVariantProps = Omit<NanaPhotoCardProps, 'variant'>

export function SavingsPhotoCard(props: NanaPhotoCardVariantProps) {
  return (
    <NanaPhotoCard
      tone="savings"
      icon="coins"
      mediaRatio="16 / 11"
      title="Objectif"
      actionLabel="Épargne automatique"
      {...props}
      variant="savings"
    />
  )
}

export function TravelPhotoCard(props: NanaPhotoCardVariantProps) {
  return (
    <NanaPhotoCard
      tone="credit"
      icon="calendar"
      mediaRatio="3 / 2"
      title="Voyage"
      actionLabel="Planifier le voyage"
      {...props}
      variant="travel"
    />
  )
}

export function FamilyPhotoCard(props: NanaPhotoCardVariantProps) {
  return (
    <NanaPhotoCard
      tone="confirmation"
      icon="user"
      mediaRatio="4 / 3"
      title="Projet familial"
      actionLabel="Préparer le projet"
      {...props}
      variant="family"
    />
  )
}

export function BusinessPhotoCard(props: NanaPhotoCardVariantProps) {
  return (
    <NanaPhotoCard
      tone="payment"
      icon="shop"
      mediaRatio="16 / 10"
      title="Activité"
      actionLabel="Développer l’activité"
      {...props}
      variant="business"
    />
  )
}

export function GoalPhotoCard(props: NanaPhotoCardVariantProps) {
  return (
    <NanaPhotoCard
      tone="savings"
      icon="check-circle"
      mediaRatio="16 / 11"
      title="Objectif"
      actionLabel="Continuer l’épargne"
      {...props}
      variant="goal"
    />
  )
}

export function LifestylePhotoCard(props: NanaPhotoCardVariantProps) {
  return (
    <NanaPhotoCard
      tone="vault"
      icon="card"
      mediaRatio="1 / 1"
      title="Envie"
      actionLabel="Découvrir"
      {...props}
      variant="lifestyle"
    />
  )
}
