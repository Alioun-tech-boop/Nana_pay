# NanoPay Frontend — Architecture

## 1. Objectif

Ce document définit l'architecture de référence du frontend NanoPay.

NanoPay doit fournir une expérience :

- moderne
- premium
- fluide
- rapide
- sécurisée
- accessible
- responsive
- prête à être connectée au backend
- cohérente entre Client, Commerçant, Banque et Admin

Le frontend est responsable de l'expérience utilisateur et de l'interaction.

Le backend reste la source de vérité pour :

- les données financières
- les permissions
- les rôles
- les commandes
- les paiements
- les crédits
- les statuts
- les QR
- les retraits
- les règlements marchands
- les règles métier critiques

---

# 2. Architecture générale

```text
┌─────────────────────────────────────────────┐
│                 UI / Design System          │
├─────────────────────────────────────────────┤
│               Pages / Layouts               │
├─────────────────────────────────────────────┤
│             Features / Domains              │
├─────────────────────────────────────────────┤
│             Hooks / UI State                │
├─────────────────────────────────────────────┤
│          Services / Query Layer             │
├─────────────────────────────────────────────┤
│                API Client                   │
├─────────────────────────────────────────────┤
│                  Backend                    │
└─────────────────────────────────────────────┘