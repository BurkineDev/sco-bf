# 🔔 Configuration Webhook FedaPay Production

**URL de production:** `https://sco-bf.vercel.app/api/webhooks/fedapay`

---

## ⚙️ Étapes de configuration

### 1. Connexion au Dashboard FedaPay

1. Allez sur **https://dashboard.fedapay.com**
2. Connectez-vous avec vos identifiants
3. Sélectionnez **Environnement: LIVE** (pas sandbox)

---

### 2. Configurer le Webhook

1. Dans le menu, allez dans **Développeurs** → **Webhooks**
2. Cliquez sur **Ajouter un Webhook** ou **New Webhook**
3. Remplissez les informations :

**URL du Webhook:**
```
https://sco-bf.vercel.app/api/webhooks/fedapay
```

**Événements à sélectionner:**
- ✅ `transaction.approved` - Paiement approuvé
- ✅ `transaction.declined` - Paiement refusé
- ✅ `transaction.canceled` - Paiement annulé
- ✅ `transaction.transferred` - Fonds transférés (optionnel)

4. Cliquez sur **Enregistrer** ou **Save**

---

### 3. Vérifier la configuration

Après enregistrement, vous devriez voir :

```
URL: https://sco-bf.vercel.app/api/webhooks/fedapay
Status: Active ✅
Events: 3 événements configurés
```

---

### 4. Tester le Webhook

FedaPay offre généralement un bouton **Test** ou **Send Test Event** :

1. Cliquez sur **Test** à côté de votre webhook
2. Sélectionnez `transaction.approved`
3. Cliquez sur **Send**

**Vérification dans Supabase:**

Connectez-vous à Supabase et vérifiez la table `webhooks` :

```sql
SELECT
  id,
  provider,
  event_type,
  status,
  created_at,
  payload
FROM webhooks
WHERE provider = 'fedapay'
ORDER BY created_at DESC
LIMIT 5;
```

Vous devriez voir le webhook de test enregistré.

---

### 5. Vérifier les logs Vercel

1. Allez sur **https://vercel.com/dashboard**
2. Sélectionnez votre projet **sco-bf**
3. Allez dans **Deployments** → Dernier déploiement → **Functions**
4. Cherchez `/api/webhooks/fedapay` dans les logs

Si le webhook est bien reçu, vous verrez :
```
POST /api/webhooks/fedapay 200 OK
```

---

## 🧪 Test avec un vrai paiement

Pour tester avec un paiement sandbox :

1. **Changez temporairement l'environnement en sandbox** dans Vercel :
   - Settings → Environment Variables
   - `NEXT_PUBLIC_FEDAPAY_ENVIRONMENT` = `sandbox`
   - Redéployez

2. **Créez un paiement test** :
```bash
curl -X POST https://sco-bf.vercel.app/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "votre-uuid-student",
    "amount": 1000,
    "description": "Test webhook",
    "school_id": "votre-uuid-school"
  }'
```

3. **Effectuez le paiement** avec une carte de test :
   - Carte: `4000000000000002`
   - CVV: `123`
   - Date: `12/25`

4. **Vérifiez que le webhook est reçu** dans Supabase

5. **Repassez en mode live** :
   - `NEXT_PUBLIC_FEDAPAY_ENVIRONMENT` = `live`
   - Redéployez

---

## ✅ Checklist

- [ ] Webhook URL configuré dans FedaPay dashboard
- [ ] Événements `approved`, `declined`, `canceled` sélectionnés
- [ ] Test envoyé depuis FedaPay dashboard
- [ ] Webhook visible dans table `webhooks` de Supabase
- [ ] Logs Vercel montrent `200 OK` pour `/api/webhooks/fedapay`
- [ ] Test avec paiement sandbox réussi (optionnel)
- [ ] Environnement remis en `live` si changé

---

## 🔒 Sécurité

⚠️ **Important :**

- Le webhook est **public** et accessible via HTTPS
- Il **ne nécessite pas d'authentification** (comportement standard FedaPay)
- Tous les webhooks sont **loggés** dans la table `webhooks` pour audit
- Les paiements sont **validés** côté serveur avant insertion

---

## 📞 Support

**Problème avec le webhook ?**

1. Vérifier que l'URL est bien `https://sco-bf.vercel.app/api/webhooks/fedapay`
2. Vérifier que les événements sont bien sélectionnés
3. Tester manuellement :
   ```bash
   curl -X POST https://sco-bf.vercel.app/api/webhooks/fedapay \
     -H "Content-Type: application/json" \
     -d '{"entity":{"transaction":{"id":123,"status":"approved"}}}'
   ```
4. Consulter les logs Vercel
5. Contacter support FedaPay : support@fedapay.com

---

**Projet:** ScolaritéBF
**URL Production:** https://sco-bf.vercel.app
**Webhook:** https://sco-bf.vercel.app/api/webhooks/fedapay
**Date:** 2025-12-07
