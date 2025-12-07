# 📱 Guide SMS & OTP - Africa's Talking

**Fournisseur:** Africa's Talking
**Service:** Authentification SMS par code OTP
**Pays:** Burkina Faso 🇧🇫
**Tarif:** ~$0.01-0.02 par SMS

---

## 📋 Table des Matières

1. [Configuration](#configuration)
2. [Utilisation API](#utilisation-api)
3. [Intégration Mobile](#intégration-mobile)
4. [Tests](#tests)
5. [Sécurité](#sécurité)
6. [Troubleshooting](#troubleshooting)
7. [Monitoring](#monitoring)

---

## ⚙️ Configuration

### 1. Credentials Africa's Talking

**Fichier:** `dashboard-school/.env.local`

```env
# Africa's Talking SMS Configuration
AFRICASTALKING_API_KEY=atsk_bb9dea5685880c5cb9099c5f3698b196516ab4e9a2c35920638f0388269ee297154d7e2e
AFRICASTALKING_USERNAME=sandbox
NEXT_PUBLIC_AFRICASTALKING_SENDER_ID=ScolariteBF
```

**Fichier:** `mobile-parent/.env`

```env
# SMS OTP Configuration
EXPO_PUBLIC_SMS_ENABLED=true
```

### 2. Environnements

| Variable | Valeur Sandbox | Valeur Production |
|----------|----------------|-------------------|
| `AFRICASTALKING_USERNAME` | `sandbox` | Votre username AT |
| `AFRICASTALKING_API_KEY` | Key sandbox | Key production |

⚠️ **En sandbox** : Les SMS sont gratuits mais limités
✅ **En production** : SMS réels facturés (~$0.01-0.02/SMS)

### 3. Obtenir les credentials

1. Créer compte : https://africastalking.com
2. **Dashboard** → **Settings** → **API Key**
3. Copier :
   - **Username** → `AFRICASTALKING_USERNAME`
   - **API Key** → `AFRICASTALKING_API_KEY`
4. **SMS** → **Sender IDs** → Demander `ScolariteBF` (production)

---

## 💻 Utilisation API

### Envoyer un code OTP

**Endpoint:** `POST /api/auth/send-otp`

**Request:**
```json
{
  "phone_number": "+22670123456",
  "purpose": "login"
}
```

**Formats de numéro acceptés:**
- `+22670123456` (International)
- `0022670123456` (International avec 00)
- `70123456` (Local - 8 chiffres)
- `070123456` (Local avec 0)

**Purposes disponibles:**
- `login` - Connexion utilisateur
- `payment_confirmation` - Confirmation paiement
- `phone_verification` - Vérification numéro
- `password_reset` - Réinitialisation mot de passe

**Response Success (200):**
```json
{
  "success": true,
  "message": "Code OTP envoyé par SMS",
  "phone": "+22670123456",
  "expires_at": "2025-12-07T10:15:00Z",
  "otp": "123456"  // Seulement en dev
}
```

**Response Error (400/404/429/500):**
```json
{
  "error": "Message d'erreur"
}
```

**Codes d'erreur:**
- `400` - Numéro invalide
- `404` - Utilisateur non trouvé (pour login)
- `429` - Trop de tentatives (max 3 en 5 min)
- `500` - Erreur serveur/SMS

---

### Vérifier un code OTP

**Endpoint:** `POST /api/auth/verify-otp`

**Request:**
```json
{
  "phone_number": "+22670123456",
  "code": "123456",
  "purpose": "login"
}
```

**Response Success - Login (200):**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "user": {
    "id": "uuid",
    "phone": "+22670123456",
    "full_name": "Amadou Traoré",
    "role": "parent",
    "school_id": "uuid",
    "school": {
      "id": "uuid",
      "name": "Complexe Scolaire Excellence",
      "code": "CSE001"
    }
  }
}
```

**Response Success - Autres purposes (200):**
```json
{
  "success": true,
  "message": "Code vérifié avec succès"
}
```

**Response Error (401/403/404):**
```json
{
  "error": "Code invalide | Code expiré | Compte désactivé"
}
```

---

## 📱 Intégration Mobile (React Native)

### Écran de connexion

```tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOTP] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  // Étape 1: Demander l'envoi du code
  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/auth/send-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone_number: phone,
            purpose: 'login',
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setStep('otp');
        alert('Code envoyé par SMS');
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2: Vérifier le code
  const handleVerifyOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/auth/verify-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone_number: phone,
            code: otp,
            purpose: 'login',
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Sauvegarder l'utilisateur
        await saveUser(data.user);
        navigation.navigate('Home');
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'phone') {
    return (
      <View>
        <TextInput
          placeholder="Numéro de téléphone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <Button
          title="Recevoir le code"
          onPress={handleSendOTP}
          disabled={loading}
        />
      </View>
    );
  }

  return (
    <View>
      <Text>Code envoyé au {phone}</Text>
      <TextInput
        placeholder="Code à 6 chiffres"
        value={otp}
        onChangeText={setOTP}
        keyboardType="number-pad"
        maxLength={6}
      />
      <Button
        title="Se connecter"
        onPress={handleVerifyOTP}
        disabled={loading}
      />
      <Button
        title="Renvoyer le code"
        onPress={handleSendOTP}
        disabled={loading}
      />
    </View>
  );
}
```

---

## 🧪 Tests

### Mode Sandbox

En sandbox, Africa's Talking fournit des numéros de test :

**Numéro test:** `+254711XXXYYY`
Remplacer XXX et YYY par n'importe quels chiffres.

**Le code OTP est visible** dans :
1. Dashboard Africa's Talking → Logs
2. Response API (en dev uniquement)

### Test manuel via cURL

```bash
# 1. Envoyer OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+22670123456",
    "purpose": "login"
  }'

# Response: { "success": true, "otp": "123456", ... }

# 2. Vérifier OTP
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+22670123456",
    "code": "123456",
    "purpose": "login"
  }'

# Response: { "success": true, "user": {...} }
```

### Vérifier la configuration

```bash
curl http://localhost:3000/api/auth/send-otp

# Response:
# {
#   "configured": true,
#   "provider": "Africa's Talking",
#   "environment": "sandbox"
# }
```

---

## 🔒 Sécurité

### Mesures implémentées

✅ **Rate Limiting**
- Max 3 OTP en 5 minutes par numéro
- Code HTTP 429 si dépassé

✅ **Expiration OTP**
- Durée de vie : 5 minutes
- Suppression auto après expiration

✅ **Usage unique**
- OTP marqué comme utilisé après vérification
- Impossible de réutiliser le même code

✅ **Validation numéro**
- Format Burkina Faso (+226)
- Nettoyage automatique des espaces/tirets

✅ **Audit logs**
- Tous les envois enregistrés
- Toutes les vérifications loggées
- Échecs trackés

### Bonnes pratiques

✅ **À FAIRE:**
- Toujours valider le numéro côté serveur
- Logger tous les événements OTP
- Nettoyer les OTP expirés périodiquement
- Utiliser HTTPS en production
- Limiter les tentatives par IP

❌ **À NE PAS FAIRE:**
- Exposer l'API key au frontend
- Envoyer OTP sans rate limiting
- Garder les OTP expirés en DB
- Afficher l'OTP en production
- Ignorer les échecs d'envoi

---

## ⚠️ Troubleshooting

### Erreur: "Code invalide"

**Causes possibles:**
- Code expiré (>5 min)
- Code déjà utilisé
- Mauvaise saisie du code
- Mauvais numéro de téléphone

**Solution:**
1. Renvoyer un nouveau code
2. Vérifier le numéro affiché
3. Saisir exactement 6 chiffres

---

### Erreur: "Trop de tentatives"

**Cause:** Plus de 3 OTP en 5 minutes

**Solution:**
1. Attendre 5 minutes
2. Vérifier qu'il n'y a pas de boucle infinie
3. En dev, nettoyer manuellement:
   ```sql
   DELETE FROM otp_codes
   WHERE phone_number = '+22670123456'
     AND created_at > NOW() - INTERVAL '5 minutes';
   ```

---

### SMS non reçu

**Vérifications:**
1. ✅ Numéro correct (+226...)
2. ✅ Téléphone allumé avec réseau
3. ✅ Pas de blocage anti-spam
4. ✅ API key valide
5. ✅ Solde Africa's Talking suffisant

**En sandbox:** SMS ne sont PAS envoyés réellement
**En production:** Vérifier dashboard Africa's Talking

---

### Erreur: "AFRICASTALKING_API_KEY is not configured"

**Solution:**
```bash
# Vérifier .env.local
cat dashboard-school/.env.local | grep AFRICASTALKING

# Redémarrer le serveur
cd dashboard-school
npm run dev
```

---

## 📊 Monitoring

### Vérifier les OTP envoyés

```sql
-- OTP des dernières 24h
SELECT
  phone_number,
  code,
  purpose,
  is_used,
  expires_at,
  created_at,
  used_at
FROM otp_codes
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 50;
```

### Statistiques d'usage

```sql
-- Nombre d'OTP par jour (7 derniers jours)
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE is_used = true) as verified,
  COUNT(*) FILTER (WHERE is_used = false) as not_used,
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired
FROM otp_codes
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Taux de succès

```sql
-- Taux de vérification par purpose
SELECT
  purpose,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_used = true) as verified,
  ROUND(
    COUNT(*) FILTER (WHERE is_used = true)::numeric / COUNT(*) * 100,
    2
  ) as success_rate
FROM otp_codes
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY purpose;
```

### Logs audit

```sql
-- Actions OTP récentes
SELECT
  action,
  metadata->>'phone' as phone,
  metadata->>'purpose' as purpose,
  created_at
FROM audit_logs
WHERE action IN ('otp_sent', 'otp_verified', 'otp_failed')
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 100;
```

### Solde Africa's Talking

Vérifier via API helper:

```typescript
import { getSMSBalance } from '@/lib/sms';

const balance = await getSMSBalance();
console.log('Solde SMS:', balance.balance);
```

Ou dashboard : https://account.africastalking.com

---

## 💰 Tarification Africa's Talking

### Prix par SMS (Burkina Faso)

| Volume | Prix unitaire |
|--------|---------------|
| 1-500 SMS | $0.02/SMS |
| 500-1000 SMS | $0.018/SMS |
| 1000-5000 SMS | $0.015/SMS |
| 5000+ SMS | $0.012/SMS |

### Exemple de coûts

**Scénario: 100 connexions/jour**
- 100 OTP × 30 jours = 3,000 SMS/mois
- Prix: 3,000 × $0.015 = **$45/mois**
- Soit : ~26,000 FCFA/mois

**Optimisations:**
- Utiliser session tokens (réduire connexions)
- Cache côté mobile (24h sans re-login)
- Seulement login, pas confirmation paiements

---

## 🔧 Nettoyage automatique

### Supprimer OTP expirés (Cron job)

```typescript
// app/api/cron/cleanup-otp/route.ts
import { cleanupExpiredOTPs } from '@/lib/sms';

export async function GET() {
  await cleanupExpiredOTPs();
  return Response.json({ success: true });
}
```

**Exécuter quotidiennement** via :
- Vercel Cron Jobs
- GitHub Actions
- Ou Supabase Edge Functions

---

## 📞 Support

### Africa's Talking

- **Email:** support@africastalking.com
- **Téléphone:** +254 20 3879100
- **Documentation:** https://developers.africastalking.com
- **Dashboard:** https://account.africastalking.com
- **Status:** https://status.africastalking.com

### Problème technique

1. Vérifier la documentation
2. Consulter les logs Supabase
3. Tester en sandbox
4. Contacter support Africa's Talking

---

## ✅ Checklist de déploiement

Avant de passer en production :

- [ ] API Key **production** configurée (pas sandbox)
- [ ] Sender ID approuvé par Africa's Talking
- [ ] Tests en sandbox réussis
- [ ] Tests avec vrais numéros BF
- [ ] Rate limiting testé
- [ ] Logs audit activés
- [ ] Cleanup automatique configuré
- [ ] Monitoring actif
- [ ] Budget SMS alloué
- [ ] Process de recharge défini

---

## 🎉 Félicitations !

L'authentification SMS OTP est maintenant configurée !

**Prochaines étapes:**
1. Tester en sandbox
2. Demander Sender ID production
3. Tester avec vrais numéros
4. Déployer en production
5. Former les utilisateurs

**Besoin d'aide ?** Consultez la [documentation Africa's Talking](https://developers.africastalking.com/docs/sms/overview) ou contactez support@africastalking.com

---

**Projet:** ScolaritéBF - Système de Paiement Scolarité
**Version:** 1.0.0
**Dernière mise à jour:** 2025-12-07
**Fournisseur:** Africa's Talking

