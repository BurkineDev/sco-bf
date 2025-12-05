# API Endpoints - Système de Paiement Scolarité BF

## Base URL
```
Production: https://api.scolarite-bf.com/v1
Staging: https://staging-api.scolarite-bf.com/v1
```

## Authentication
Toutes les requêtes (sauf webhooks PSP) requièrent:
- Header: `Authorization: Bearer <JWT_ACCESS_TOKEN>`
- Header: `X-Device-ID: <DEVICE_FINGERPRINT>` (optionnel, pour anti-fraude)

---

## 1. AUTHENTIFICATION

### POST /auth/otp/request
Demande d'envoi OTP pour connexion/vérification.

**Request:**
```json
{
  "phone": "+22670123456",
  "purpose": "login" // "login" | "payment_confirmation" | "phone_verification"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "OTP envoyé",
  "otp_id": "uuid",
  "expires_in": 300,
  "masked_phone": "+226701****56"
}
```

**Response 429 (Rate Limited):**
```json
{
  "error": "TOO_MANY_REQUESTS",
  "message": "Trop de demandes OTP. Réessayez dans 60 secondes.",
  "retry_after": 60
}
```

---

### POST /auth/otp/verify
Vérification de l'OTP.

**Request:**
```json
{
  "phone": "+22670123456",
  "otp": "123456",
  "purpose": "login",
  "device_info": {
    "device_id": "fingerprint-xxx",
    "platform": "android",
    "app_version": "1.0.0"
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "phone": "+22670123456",
    "first_name": "Amadou",
    "last_name": "Ouedraogo",
    "role": "parent"
  }
}
```

**Response 401:**
```json
{
  "error": "INVALID_OTP",
  "message": "Code OTP invalide ou expiré",
  "attempts_remaining": 2
}
```

---

### POST /auth/refresh
Rafraîchissement du token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 900
}
```

---

### POST /auth/logout
Déconnexion (révocation du refresh token).

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 200:**
```json
{
  "success": true
}
```

---

## 2. PARENTS - ÉLÈVES

### GET /parent/children
Liste des enfants du parent connecté.

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "matricule": "2024-LYCA001-0042",
      "first_name": "Fatou",
      "last_name": "Ouedraogo",
      "school": {
        "id": "uuid",
        "code": "LYCA001",
        "name": "Lycée Exemple A"
      },
      "class": {
        "id": "uuid",
        "name": "6ème A"
      },
      "academic_year": "2024-2025",
      "tuition": {
        "total_amount": 75000,
        "paid_amount": 25000,
        "balance": 50000,
        "is_fully_paid": false,
        "last_payment_at": "2024-11-15T10:30:00Z"
      }
    }
  ]
}
```

---

### GET /parent/children/:studentId/payments
Historique des paiements pour un enfant.

**Query Params:**
- `page` (default: 1)
- `limit` (default: 20)
- `academic_year` (optionnel)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "reference": "PAY20241115143022ABCD1234",
      "amount": 25000,
      "channel": "app_mobile",
      "provider": "orange_money",
      "status": "completed",
      "created_at": "2024-11-15T10:30:00Z",
      "receipt_url": "https://..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "total_pages": 1
  }
}
```

---

## 3. PAIEMENTS

### POST /payments/intent
Création d'un payment intent (initiation paiement).

**Request:**
```json
{
  "student_id": "uuid",
  "amount": 25000,
  "channel": "app_mobile",
  "provider": "cinetpay", // ou "orange_money", "moov_money"
  "return_url": "scolaritebf://payment/callback",
  "metadata": {
    "description": "Paiement partiel scolarité"
  }
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "reference": "INT20241115143022ABCD1234",
  "amount": 25000,
  "currency": "XOF",
  "status": "pending",
  "expires_at": "2024-11-15T15:00:00Z",
  "payment_url": "https://checkout.cinetpay.com/...",
  "provider_data": {
    "transaction_id": "CP123456789"
  }
}
```

**Response 400:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Montant minimum: 5000 FCFA",
  "details": {
    "amount": "Le montant doit être supérieur ou égal à 5000 FCFA"
  }
}
```

**Response 403:**
```json
{
  "error": "FORBIDDEN",
  "message": "Vous n'êtes pas autorisé à effectuer un paiement pour cet élève"
}
```

---

### GET /payments/intent/:intentId
Statut d'un payment intent.

**Response 200:**
```json
{
  "id": "uuid",
  "reference": "INT20241115143022ABCD1234",
  "amount": 25000,
  "status": "completed", // "pending", "processing", "completed", "failed", "cancelled"
  "payment_id": "uuid", // Si completed
  "created_at": "2024-11-15T14:30:00Z",
  "completed_at": "2024-11-15T14:32:00Z"
}
```

---

### GET /payments/:paymentId/receipt
Génération du reçu de paiement (PDF).

**Response 200:**
```json
{
  "receipt_url": "https://storage.scolarite-bf.com/receipts/PAY20241115...pdf",
  "expires_at": "2024-11-16T14:30:00Z"
}
```

---

### POST /payments/agent
Enregistrement d'un paiement par un agent.

**Headers:**
- `Authorization: Bearer <AGENT_JWT>`

**Request:**
```json
{
  "student_id": "uuid",
  "amount": 50000,
  "channel": "agent_cash", // ou "agent_momo"
  "payer_name": "M. Ouedraogo Moussa",
  "payer_phone": "+22670555666",
  "notes": "Paiement cash reçu",
  "otp": "123456" // OTP de confirmation agent (optionnel selon config)
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "reference": "AGT20241115143022ABCD1234",
  "amount": 50000,
  "status": "completed",
  "student": {
    "matricule": "2024-LYCA001-0042",
    "name": "Fatou Ouedraogo"
  },
  "tuition_balance": 25000,
  "receipt_url": "https://..."
}
```

---

## 4. WEBHOOKS PSP

### POST /webhooks/cinetpay
Callback CinetPay après paiement.

**Headers:**
- `X-CinetPay-Signature: sha256=...`
- `Content-Type: application/json`

**Request (exemple):**
```json
{
  "cpm_trans_id": "CP123456789",
  "cpm_site_id": "SITE123",
  "cpm_trans_date": "2024-11-15 14:32:00",
  "cpm_amount": "25000",
  "cpm_currency": "XOF",
  "cpm_custom": "INT20241115143022ABCD1234",
  "cpm_designation": "Paiement scolarité",
  "cpm_payment_method": "OM",
  "cpm_phone_prefixe": "226",
  "cpm_cel_player": "70123456",
  "cpm_result": "00",
  "cpm_error_message": ""
}
```

**Response 200:**
```json
{
  "status": "OK"
}
```

**Processing Logic:**
1. Vérifier signature HMAC
2. Vérifier idempotence (cpm_trans_id unique)
3. Retrouver payment_intent via cpm_custom
4. Valider montant
5. Créer payment si cpm_result == "00"
6. Mettre à jour tuition_account
7. Envoyer SMS confirmation
8. Logguer webhook_event

---

### POST /webhooks/ussd
Callback opérateur USSD (Orange/Moov).

**Headers:**
- `X-USSD-Signature: sha256=...`

**Request:**
```json
{
  "transaction_id": "OM20241115143200",
  "school_code": "LYCA001",
  "student_matricule": "2024-LYCA001-0042",
  "amount": 25000,
  "payer_msisdn": "22670123456",
  "timestamp": "2024-11-15T14:32:00Z",
  "status": "SUCCESS"
}
```

**Response 200:**
```json
{
  "status": "OK",
  "student_name": "Fatou Ouedraogo",
  "new_balance": 25000,
  "message": "Paiement reçu. Nouveau solde: 25000 FCFA"
}
```

**Processing Logic:**
1. Vérifier signature
2. Retrouver école par code
3. Retrouver élève par matricule + école
4. Vérifier doublon (idempotence)
5. Créer payment
6. Mettre à jour tuition_account
7. Envoyer SMS au payer_msisdn
8. Retourner message de confirmation pour affichage USSD

---

## 5. ÉCOLES (Dashboard)

### GET /schools/me
Informations de l'école de l'utilisateur connecté.

**Response 200:**
```json
{
  "id": "uuid",
  "code": "LYCA001",
  "name": "Lycée Exemple A",
  "region": "Centre",
  "logo_url": "https://...",
  "current_academic_year": {
    "id": "uuid",
    "label": "2024-2025"
  },
  "stats": {
    "total_students": 450,
    "total_classes": 12,
    "total_collected": 15750000,
    "total_outstanding": 8250000,
    "collection_rate": 65.6
  }
}
```

---

### GET /schools/me/classes
Liste des classes de l'école.

**Query Params:**
- `academic_year_id` (optionnel, défaut: année courante)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "6ème A",
      "level": "6ème",
      "section": "A",
      "tuition_amount": 75000,
      "student_count": 45,
      "stats": {
        "total_expected": 3375000,
        "total_collected": 2250000,
        "collection_rate": 66.7
      }
    }
  ]
}
```

---

### GET /schools/me/students
Liste des élèves de l'école avec statut paiement.

**Query Params:**
- `class_id` (optionnel)
- `payment_status`: "all" | "paid" | "partial" | "unpaid"
- `search`: recherche par nom/matricule
- `page`, `limit`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "matricule": "2024-LYCA001-0042",
      "first_name": "Fatou",
      "last_name": "Ouedraogo",
      "class": {
        "id": "uuid",
        "name": "6ème A"
      },
      "parent_phone": "+22670123456",
      "tuition": {
        "total_amount": 75000,
        "paid_amount": 25000,
        "balance": 50000,
        "is_fully_paid": false
      }
    }
  ],
  "pagination": {...},
  "summary": {
    "total_students": 450,
    "fully_paid": 120,
    "partial_paid": 230,
    "unpaid": 100
  }
}
```

---

### POST /schools/me/students/import
Import d'élèves via CSV/Excel.

**Request:** `multipart/form-data`
- `file`: fichier CSV ou Excel
- `class_id`: UUID de la classe
- `create_accounts`: boolean (créer tuition_accounts)

**Response 200:**
```json
{
  "success": true,
  "imported": 45,
  "errors": [
    {
      "row": 12,
      "message": "Matricule en doublon: 2024-LYCA001-0042"
    }
  ],
  "warnings": [
    {
      "row": 8,
      "message": "Numéro de téléphone parent manquant"
    }
  ]
}
```

---

### GET /schools/me/payments
Historique des paiements de l'école.

**Query Params:**
- `start_date`, `end_date`
- `class_id`
- `channel`
- `status`
- `page`, `limit`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "reference": "PAY20241115143022ABCD1234",
      "student": {
        "matricule": "2024-LYCA001-0042",
        "name": "Fatou Ouedraogo",
        "class": "6ème A"
      },
      "amount": 25000,
      "commission": 500,
      "net_amount": 24500,
      "channel": "app_mobile",
      "provider": "orange_money",
      "status": "completed",
      "created_at": "2024-11-15T14:30:00Z"
    }
  ],
  "pagination": {...},
  "totals": {
    "gross_amount": 1250000,
    "commission": 25000,
    "net_amount": 1225000
  }
}
```

---

### GET /schools/me/reports/export
Export des données (Excel/PDF).

**Query Params:**
- `type`: "students" | "payments" | "summary"
- `format`: "xlsx" | "pdf"
- `start_date`, `end_date`
- `class_id`

**Response 200:**
```json
{
  "download_url": "https://storage.scolarite-bf.com/exports/...",
  "expires_at": "2024-11-16T14:30:00Z"
}
```

---

## 6. ADMINISTRATION PLATEFORME

### GET /admin/schools
Liste de toutes les écoles.

**Query Params:**
- `region`
- `is_active`
- `search`
- `page`, `limit`

---

### POST /admin/schools
Création d'une école.

**Request:**
```json
{
  "code": "LYCA002",
  "name": "Lycée Exemple B",
  "region": "Hauts-Bassins",
  "commission_rate": 0.025,
  "admin_phone": "+22670999888"
}
```

---

### GET /admin/transactions
Vue globale des transactions.

**Query Params:**
- `start_date`, `end_date`
- `school_id`
- `channel`
- `status`
- `page`, `limit`

**Response 200:**
```json
{
  "data": [...],
  "pagination": {...},
  "totals": {
    "count": 1250,
    "gross_amount": 125000000,
    "commission": 2500000,
    "by_channel": {
      "app_mobile": 75000000,
      "ussd": 30000000,
      "agent_cash": 15000000,
      "agent_momo": 5000000
    }
  }
}
```

---

### GET /admin/webhooks
Logs des webhooks PSP.

**Query Params:**
- `provider`
- `status`
- `start_date`, `end_date`
- `page`, `limit`

---

### GET /admin/audit-logs
Logs d'audit.

**Query Params:**
- `user_id`
- `action`
- `resource_type`
- `start_date`, `end_date`
- `page`, `limit`

---

## 7. AGENTS

### GET /agent/me
Informations de l'agent connecté.

**Response 200:**
```json
{
  "id": "uuid",
  "agent_code": "AGT001",
  "user": {
    "first_name": "Ibrahim",
    "last_name": "Traore"
  },
  "school": {
    "id": "uuid",
    "name": "Lycée Exemple A"
  },
  "limits": {
    "daily_limit": 1000000,
    "transaction_limit": 100000,
    "daily_used": 250000,
    "daily_remaining": 750000
  },
  "today_stats": {
    "transactions": 5,
    "total_amount": 250000
  }
}
```

---

### GET /agent/students/search
Recherche d'élève pour paiement agent.

**Query Params:**
- `q`: matricule ou nom
- `school_code` (optionnel)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "matricule": "2024-LYCA001-0042",
      "name": "Fatou Ouedraogo",
      "school": "Lycée Exemple A",
      "class": "6ème A",
      "balance": 50000
    }
  ]
}
```

---

## CODES D'ERREUR STANDARD

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Token manquant ou invalide |
| `FORBIDDEN` | 403 | Accès non autorisé à cette ressource |
| `NOT_FOUND` | 404 | Ressource non trouvée |
| `VALIDATION_ERROR` | 400 | Erreur de validation des données |
| `TOO_MANY_REQUESTS` | 429 | Rate limit atteint |
| `PAYMENT_FAILED` | 400 | Échec du paiement |
| `DUPLICATE_PAYMENT` | 409 | Paiement déjà traité |
| `INSUFFICIENT_AMOUNT` | 400 | Montant inférieur au minimum |
| `STUDENT_NOT_FOUND` | 404 | Élève non trouvé |
| `SCHOOL_NOT_FOUND` | 404 | École non trouvée |
| `INTERNAL_ERROR` | 500 | Erreur interne |

---

## RATE LIMITING

| Endpoint | Limite |
|----------|--------|
| `/auth/otp/request` | 5/heure par téléphone |
| `/auth/otp/verify` | 10/heure par téléphone |
| `/payments/intent` | 10/minute par utilisateur |
| `/webhooks/*` | 100/minute par IP |
| Autres endpoints | 60/minute par utilisateur |

---

## SIGNATURE WEBHOOK HMAC

Pour vérifier les webhooks entrants :

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}
```
