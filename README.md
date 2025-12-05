# Système de Paiement Scolarité - Burkina Faso 🇧🇫

Infrastructure de paiement multi-canal pour les frais de scolarité, optimisée pour le contexte africain (faible connectivité, Mobile Money dominant).

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CANAUX DE PAIEMENT                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   📱 App Mobile        📞 USSD          💻 Dashboard      👤 Agent     │
│   (React Native)       (Sans Internet)  (Next.js)         (Web)        │
│        │                    │                │               │          │
│        └────────────────────┴────────────────┴───────────────┘          │
│                                   │                                     │
│                            ┌──────▼──────┐                              │
│                            │  API Edge   │                              │
│                            │  Functions  │                              │
│                            └──────┬──────┘                              │
│                                   │                                     │
│                    ┌──────────────┴──────────────┐                      │
│                    │      SUPABASE               │                      │
│                    │  ┌─────────┬─────────┐      │                      │
│                    │  │ Auth    │ Postgres│      │                      │
│                    │  │ (OTP)   │ (RLS)   │      │                      │
│                    │  └─────────┴─────────┘      │                      │
│                    └─────────────────────────────┘                      │
│                                   │                                     │
│            ┌──────────────────────┼──────────────────────┐              │
│            │                      │                      │              │
│     ┌──────▼──────┐       ┌──────▼──────┐       ┌──────▼──────┐        │
│     │  CinetPay   │       │ Orange/Moov │       │ SMS Gateway │        │
│     │  (Webhook)  │       │   (USSD)    │       │ (Notifs)    │        │
│     └─────────────┘       └─────────────┘       └─────────────┘        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 📁 Structure du Projet

```
scolarite-bf/
├── database/
│   └── schema.sql              # Schéma PostgreSQL complet + RLS
│
├── docs/
│   └── API_ENDPOINTS.md        # Documentation API REST
│
├── src/
│   └── types/
│       └── database.types.ts   # Types TypeScript
│
└── supabase/
    └── functions/
        ├── create-payment-intent/   # Initiation paiement
        ├── webhook-cinetpay/        # Callback PSP
        ├── webhook-ussd/            # Callback USSD opérateurs
        ├── agent-payment/           # Paiement via agent/caissier
        └── auth-otp/                # Authentification OTP
```

## 🔐 Sécurité Implémentée

### Authentification
- ✅ OTP hashé (SHA-256), jamais stocké en clair
- ✅ Rate limiting: 5 OTP/heure par téléphone
- ✅ Max 3 tentatives par OTP
- ✅ Blocage temporaire après échecs (30 min)
- ✅ JWT courts (15 min) + refresh tokens

### Webhooks PSP
- ✅ Signature HMAC-SHA256 obligatoire
- ✅ Vérification timing-safe (contre timing attacks)
- ✅ Idempotence (clé unique par transaction)
- ✅ Validation montant/destinataire

### Base de données
- ✅ Row Level Security (RLS) sur toutes les tables
- ✅ Parent voit uniquement ses enfants
- ✅ École voit uniquement ses élèves
- ✅ Agent limité à son périmètre

### Anti-fraude
- ✅ Fingerprint device
- ✅ Logs d'audit complets
- ✅ Détection anomalies (montants, fréquence)
- ✅ Limites journalières agents

## 📊 Modèle de Données

### Tables Principales

| Table | Description |
|-------|-------------|
| `users` | Utilisateurs (parents, admins, agents) |
| `schools` | Écoles avec config commission |
| `students` | Élèves rattachés à une école/classe |
| `tuition_accounts` | Compte scolarité par élève/année |
| `payment_intents` | Intentions de paiement (en attente PSP) |
| `payments` | Paiements confirmés |
| `webhook_events` | Logs des callbacks PSP |
| `audit_logs` | Audit trail complet |

### Relations Clés

```
users (parent) ─┬─► parent_students ──► students
                │
                └─► payments (paid_by)

schools ──► classes ──► students ──► tuition_accounts ──► payments

payment_intents ──► payments (après confirmation webhook)
```

## 🔄 Flux de Paiement

### 1. Via App Mobile
```
Parent → Sélection élève → Montant → PSP (CinetPay)
                                         ↓
                              Mobile Money (Orange/Moov)
                                         ↓
                              Webhook → Backend → DB
                                         ↓
                              SMS confirmation + mise à jour solde
```

### 2. Via USSD (Sans Internet)
```
Parent compose: *123*ECOLE*MATRICULE*MONTANT#
                              ↓
                    Opérateur traite le paiement
                              ↓
                    Webhook USSD → Backend
                              ↓
                    Identification élève → Enregistrement
                              ↓
                    SMS confirmation
```

### 3. Via Agent/Caissier
```
Agent → Dashboard → Recherche élève → Saisie paiement (cash/momo)
                                                ↓
                                    Vérification limites agent
                                                ↓
                                    Enregistrement + SMS parent
```

## 🚀 Déploiement

### Prérequis
- Compte Supabase
- Compte CinetPay (ou PayGate/CorisPay)
- Gateway SMS (Twilio, local provider)
- Vercel/Netlify (pour Next.js)

### Variables d'Environnement

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
SUPABASE_ANON_KEY=xxx

# PSP (CinetPay)
CINETPAY_API_KEY=xxx
CINETPAY_SITE_ID=xxx
CINETPAY_SECRET_KEY=xxx  # Pour vérifier signatures webhook

# USSD
USSD_WEBHOOK_SECRET=xxx

# SMS
SMS_API_URL=https://api.sms-provider.com/send
SMS_API_KEY=xxx

# Auth
JWT_SECRET=xxx
```

### Déployer les Edge Functions

```bash
# Installer Supabase CLI
npm install -g supabase

# Login
supabase login

# Déployer
supabase functions deploy create-payment-intent
supabase functions deploy webhook-cinetpay
supabase functions deploy webhook-ussd
supabase functions deploy agent-payment
supabase functions deploy auth-otp
```

### Configurer les Secrets

```bash
supabase secrets set CINETPAY_API_KEY=xxx
supabase secrets set CINETPAY_SECRET_KEY=xxx
supabase secrets set SMS_API_KEY=xxx
# etc.
```

## 📱 Prochaines Étapes

1. **React Native App** (parents)
   - Écrans: Login OTP, Liste enfants, Paiement, Historique
   
2. **Dashboard Next.js** (écoles)
   - Pages: Login, Élèves, Paiements, Exports, Config
   
3. **Dashboard Admin** (plateforme)
   - Pages: Écoles, Transactions, Agents, Monitoring

4. **Intégration PSP complète**
   - Tests sandbox CinetPay
   - Configuration webhooks production
   
5. **Tests**
   - Tests unitaires Edge Functions
   - Tests E2E flux paiement

## 💰 Commission Plateforme

Configuration par école:
- **Taux**: 0-15% du montant (défaut: 2%)
- **Fixe**: Montant en FCFA par transaction
- **Combiné**: Taux + fixe

Calcul automatique dans les fonctions de paiement.

## 📞 Support

Pour toute question technique: [À définir]

---

**Conçu pour le contexte Burkina Faso** 🇧🇫
- Optimisé faible bande passante
- Support Mobile Money natif
- Interface multilingue (FR)
# sco-bf
