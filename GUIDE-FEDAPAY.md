# 💳 Guide d'Intégration FedaPay - ScolaritéBF

**Fournisseur de paiement:** FedaPay
**Méthodes supportées:** Orange Money, Moov Money, Coris Money, Visa, Mastercard
**Pays:** Burkina Faso 🇧🇫
**Commission:** 2,5% par transaction

---

## 📋 Table des Matières

1. [Configuration](#configuration)
2. [Utilisation Dashboard](#utilisation-dashboard)
3. [Utilisation Mobile](#utilisation-mobile)
4. [Webhooks](#webhooks)
5. [Tests](#tests)
6. [Troubleshooting](#troubleshooting)

---

## ⚙️ Configuration

### 1. Credentials FedaPay

**Fichier:** `dashboard-school/.env.local`

```env
# FedaPay Configuration
NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY=pk_live_8O8XxYFNhlpxcvxIuluoU0iY
FEDAPAY_SECRET_KEY=sk_live_VOTRE_SECRET_KEY_ICI
NEXT_PUBLIC_FEDAPAY_ENVIRONMENT=live
```

**Fichier:** `mobile-parent/.env`

```env
# FedaPay Configuration
EXPO_PUBLIC_FEDAPAY_PUBLIC_KEY=pk_live_8O8XxYFNhlpxcvxIuluoU0iY
EXPO_PUBLIC_FEDAPAY_ENVIRONMENT=live
```

### 2. Obtenir les clés API

1. Connectez-vous à https://dashboard.fedapay.com
2. Allez dans **Développeurs** → **API Keys**
3. Copiez :
   - **Public Key** (`pk_live_...`) → Variable `NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY`
   - **Secret Key** (`sk_live_...`) → Variable `FEDAPAY_SECRET_KEY`

⚠️ **IMPORTANT:**
- ✅ Public Key peut être exposée (frontend)
- 🔒 Secret Key NE DOIT JAMAIS être exposée (backend seulement)
- 🚫 NE JAMAIS committer les clés dans Git (.env est dans .gitignore)

### 3. Environnements

| Environnement | Valeur | Usage |
|---------------|--------|-------|
| **Production** | `live` | Vrais paiements avec vraies cartes |
| **Sandbox** | `sandbox` | Tests avec fausses cartes |

---

## 💻 Utilisation Dashboard

### Créer un paiement (Backend)

**API Route:** `app/api/payments/create/route.ts`

```typescript
// POST /api/payments/create
{
  "student_id": "uuid-de-l-eleve",
  "amount": 50000,
  "description": "Paiement scolarité Octobre 2024",
  "payment_type": "tuition",
  "academic_year_id": "uuid-annee-scolaire",
  "school_id": "uuid-ecole"
}
```

**Réponse:**
```json
{
  "success": true,
  "payment_intent_id": "uuid-payment-intent",
  "transaction_id": 123456,
  "token": "tok_xxx",
  "payment_url": "https://checkout.fedapay.com/xxx",
  "qr_code_url": "https://qr.fedapay.com/xxx.png"
}
```

### Utiliser le helper

```typescript
import { createPayment } from '@/lib/fedapay';

const result = await createPayment({
  amount: 50000,
  description: 'Paiement scolarité',
  customer: {
    firstname: 'Amadou',
    lastname: 'Traoré',
    email: 'amadou@example.com',
    phone: '+22670123456',
  },
  metadata: {
    student_id: 'xxx',
    school_id: 'yyy',
  },
});

// Rediriger vers result.paymentUrl
```

---

## 📱 Utilisation Mobile (React Native)

### Installation

```bash
cd mobile-parent
npm install react-native-webview
```

### Composant de paiement

```tsx
import { WebView } from 'react-native-webview';
import { useState } from 'react';

export function PaymentScreen({ student, amount }) {
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const initiatePayment = async () => {
    const response = await fetch(
      `${API_URL}/api/payments/create`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          amount: amount,
          description: `Scolarité ${student.display_name}`,
          school_id: student.school_id,
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      setPaymentUrl(data.payment_url);
    }
  };

  if (paymentUrl) {
    return (
      <WebView
        source={{ uri: paymentUrl }}
        onNavigationStateChange={(navState) => {
          // Vérifier si retour après paiement
          if (navState.url.includes('success')) {
            // Paiement réussi
            navigation.navigate('PaymentSuccess');
          } else if (navState.url.includes('cancel')) {
            // Paiement annulé
            setPaymentUrl(null);
          }
        }}
      />
    );
  }

  return (
    <Button onPress={initiatePayment} title="Payer maintenant" />
  );
}
```

---

## 🔔 Webhooks

### Configuration dans FedaPay

1. Dashboard FedaPay → **Développeurs** → **Webhooks**
2. Ajouter URL : `https://votre-domaine.com/api/webhooks/fedapay`
3. Événements à écouter :
   - ✅ `transaction.approved`
   - ✅ `transaction.declined`
   - ✅ `transaction.canceled`

### Événements reçus

**Webhook endpoint:** `app/api/webhooks/fedapay/route.ts`

```json
{
  "entity": {
    "transaction": {
      "id": 123456,
      "status": "approved",
      "amount": 50000,
      "currency": "XOF",
      "customer": { ... },
      "custom_metadata": {
        "payment_intent_id": "uuid",
        "student_id": "uuid",
        "school_id": "uuid"
      }
    }
  }
}
```

### Statuts FedaPay

| Statut FedaPay | Statut Interne | Description |
|----------------|----------------|-------------|
| `pending` | `pending` | En attente paiement |
| `approved` | `completed` | ✅ Paiement réussi |
| `transferred` | `completed` | ✅ Fonds transférés |
| `declined` | `failed` | ❌ Paiement refusé |
| `canceled` | `cancelled` | ⏸️ Annulé par utilisateur |

### Flow complet

```
1. Frontend → POST /api/payments/create
2. Backend → Crée payment_intent dans Supabase
3. Backend → Crée transaction FedaPay
4. Frontend → Redirige vers payment_url
5. User → Paie avec Orange/Moov/Coris
6. FedaPay → Envoie webhook à /api/webhooks/fedapay
7. Backend → Met à jour payment_intent
8. Backend → Crée payment dans Supabase
9. Trigger → Met à jour tuition_account automatiquement
```

---

## 🧪 Tests

### Mode Sandbox

**Configuration:**
```env
NEXT_PUBLIC_FEDAPAY_ENVIRONMENT=sandbox
FEDAPAY_SECRET_KEY=sk_sandbox_VOTRE_CLE
NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY=pk_sandbox_VOTRE_CLE
```

### Cartes de test

FedaPay fournit des numéros de test :

| Carte | Numéro | Résultat |
|-------|--------|----------|
| Visa Success | `4000000000000002` | ✅ Succès |
| Mastercard Success | `5555555555554444` | ✅ Succès |
| Declined | `4000000000000127` | ❌ Refusé |

**CVV:** n'importe quel 3 chiffres
**Date expiration:** n'importe quelle date future

### Mobile Money Test

En sandbox, utilisez :
- **Orange Money:** `+22670000001`
- **Moov Money:** `+22660000001`
- **Coris Money:** `+22650000001`

Code OTP de test : `123456`

### Test de paiement complet

```bash
# 1. Créer un paiement
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "uuid-student",
    "amount": 1000,
    "description": "Test payment",
    "school_id": "uuid-school"
  }'

# 2. Ouvrir payment_url dans le navigateur
# 3. Effectuer le paiement
# 4. Vérifier le webhook reçu

# 5. Vérifier dans Supabase
SELECT * FROM payments WHERE transaction_reference = 'fedapay-transaction-id';
```

---

## 🔒 Sécurité

### Bonnes pratiques

✅ **À FAIRE:**
- Toujours valider les webhooks
- Vérifier les montants côté serveur
- Logger tous les paiements dans audit_logs
- Utiliser HTTPS pour les webhooks
- Stocker les clés dans variables d'environnement

❌ **À NE PAS FAIRE:**
- Exposer la secret key au frontend
- Faire confiance aux montants venant du client
- Ignorer les erreurs de webhook
- Committer les clés API dans Git
- Utiliser les clés de production en dev

### Validation des webhooks

```typescript
// Vérifier que le webhook vient bien de FedaPay
import crypto from 'crypto';

function validateWebhook(payload: string, signature: string) {
  const hash = crypto
    .createHmac('sha256', process.env.FEDAPAY_SECRET_KEY!)
    .update(payload)
    .digest('hex');

  return hash === signature;
}
```

---

## ⚠️ Troubleshooting

### Erreur: "FEDAPAY_SECRET_KEY is not configured"

**Solution:**
```bash
# Vérifier que .env.local existe
cat dashboard-school/.env.local

# Vérifier que la variable est définie
grep FEDAPAY_SECRET_KEY dashboard-school/.env.local

# Redémarrer le serveur
npm run dev
```

### Erreur: "Transaction declined"

**Causes possibles:**
- Solde insuffisant
- Carte expirée
- Mauvais code OTP
- Limite de transaction dépassée

**Solution:**
- Vérifier le solde du compte
- Utiliser une autre méthode de paiement
- Contacter le support client mobile money

### Webhook non reçu

**Vérifications:**
1. URL configurée dans FedaPay dashboard ?
2. URL publiquement accessible (pas localhost) ?
3. HTTPS activé ?
4. Firewall bloque FedaPay ?

**Test webhook:**
```bash
# Tester l'endpoint localement
curl -X POST http://localhost:3000/api/webhooks/fedapay \
  -H "Content-Type: application/json" \
  -d '{"entity":{"transaction":{"id":123,"status":"approved"}}}'
```

### Paiement bloqué en "pending"

**Solution:**
1. Vérifier le statut sur FedaPay dashboard
2. Vérifier les webhooks dans Supabase:
   ```sql
   SELECT * FROM webhooks
   WHERE provider = 'fedapay'
   ORDER BY created_at DESC
   LIMIT 10;
   ```
3. Récupérer manuellement le statut:
   ```typescript
   import { getTransactionStatus } from '@/lib/fedapay';
   const status = await getTransactionStatus(transactionId);
   ```

---

## 📊 Monitoring

### Vérifier les paiements

```sql
-- Paiements des dernières 24h
SELECT
  p.id,
  p.amount,
  p.transaction_reference,
  p.status,
  p.created_at,
  s.display_name as student_name
FROM payments p
JOIN tuition_accounts ta ON p.tuition_account_id = ta.id
JOIN students s ON ta.student_id = s.id
WHERE p.created_at > NOW() - INTERVAL '24 hours'
  AND p.payment_provider = 'fedapay'
ORDER BY p.created_at DESC;
```

### Vérifier les webhooks

```sql
-- Webhooks récents
SELECT
  id,
  event_type,
  status,
  created_at,
  payload->'entity'->'transaction'->>'id' as transaction_id,
  payload->'entity'->'transaction'->>'status' as transaction_status
FROM webhooks
WHERE provider = 'fedapay'
ORDER BY created_at DESC
LIMIT 20;
```

### Logs d'audit

```sql
-- Actions de paiement
SELECT
  action,
  resource_id,
  metadata->>'amount' as amount,
  metadata->>'student_id' as student_id,
  created_at
FROM audit_logs
WHERE action IN ('payment_initiated', 'payment_completed', 'payment_failed')
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## 💰 Tarification FedaPay

### Frais de transaction

| Méthode | Commission FedaPay |
|---------|-------------------|
| **Mobile Money** | 2,5% + 0 FCFA |
| **Carte bancaire** | 2,5% + 0 FCFA |

**Exemple:**
- Paiement: 50,000 FCFA
- Commission: 1,250 FCFA (2,5%)
- **Reçu:** 48,750 FCFA

### Limites

| Type | Limite |
|------|--------|
| **Paiement minimum** | 100 FCFA |
| **Paiement maximum** | 2,000,000 FCFA |
| **Par jour** | 5,000,000 FCFA |
| **Par mois** | Illimité |

### Délai de versement

- **Mobile Money:** Instantané
- **Carte bancaire:** T+2 jours ouvrés

---

## 📞 Support

### FedaPay

- **Email:** support@fedapay.com
- **Téléphone:** +229 69 93 93 93
- **Documentation:** https://docs.fedapay.com
- **Dashboard:** https://dashboard.fedapay.com

### Problème technique

1. Vérifier la documentation
2. Consulter les logs Supabase
3. Tester en sandbox
4. Contacter support FedaPay

---

## ✅ Checklist de déploiement

Avant de passer en production :

- [ ] Clés API **live** configurées (pas sandbox)
- [ ] Webhooks configurés sur FedaPay dashboard
- [ ] URL de webhook HTTPS publique
- [ ] Tests de paiement complets effectués
- [ ] Monitoring actif (logs, webhooks)
- [ ] Documentation partagée avec l'équipe
- [ ] Backup des credentials en lieu sûr
- [ ] Process de remboursement défini
- [ ] Support client prêt

---

## 🎉 Félicitations !

FedaPay est maintenant intégré à votre système de paiement scolarité !

**Prochaines étapes:**
1. Tester en sandbox
2. Configurer les webhooks
3. Déployer en production
4. Former les utilisateurs

**Besoin d'aide ?** Consultez la [documentation FedaPay](https://docs.fedapay.com) ou contactez support@fedapay.com

---

**Projet:** ScolaritéBF - Système de Paiement Scolarité
**Version:** 1.0.0
**Dernière mise à jour:** 2025-12-07
**Fournisseur:** FedaPay

