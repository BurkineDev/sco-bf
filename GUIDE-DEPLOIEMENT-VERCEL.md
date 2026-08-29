# 🚀 Guide Déploiement Vercel - ScolaritéBF

**Plateforme:** Vercel
**Framework:** Next.js 14
**Temps estimé:** 30 minutes
**Coût:** Gratuit (Hobby Plan)

---

## 📋 Prérequis

- ✅ Compte GitHub (déjà fait)
- ✅ Code poussé sur GitHub (déjà fait)
- ✅ Build local réussi (déjà testé)
- ⏳ Compte Vercel (à créer)

---

## 🎯 Étape 1 : Créer un compte Vercel (5 min)

### 1.1 Inscription

1. Allez sur **https://vercel.com**
2. Cliquez sur **"Sign Up"**
3. Choisir **"Continue with GitHub"** (recommandé)
4. Autoriser Vercel à accéder à GitHub
5. Compte créé ! ✅

### 1.2 Configuration initiale

- **Plan:** Hobby (Gratuit)
- **Limites gratuites:**
  - 100 GB bandwidth/mois
  - Déploiements illimités
  - Domaines personnalisés illimités
  - 100 GB-Hours compute/mois

---

## 🚀 Étape 2 : Importer le projet (10 min)

### 2.1 Nouveau projet

1. Dashboard Vercel → **"Add New"** → **"Project"**
2. **"Import Git Repository"**
3. Sélectionner **BurkineDev/sco-bf**
4. Configurer :

```
Framework Preset: Next.js
Root Directory: dashboard-school
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### 2.2 Nom du projet

- **Project Name:** `scolarite-bf` (ou votre choix)
- **URL de production:** `scolarite-bf.vercel.app`
  - Vous pouvez ajouter un domaine personnalisé plus tard

---

## ⚙️ Étape 3 : Variables d'environnement (10 min)

**CRITIQUE** : Configurer toutes les variables avant le déploiement !

### 3.1 Ajouter les variables

Dans Vercel → **Environment Variables** :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://avdbsaukigngsnklceat.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGJzYXVraWduZ3Nua2xjZWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5OTY2NDUsImV4cCI6MjA4MDU3MjY0NX0.y4K_rNfkdJ4UgIuA7BcrDlfooMCaSqpO45aykUDVVLI

# Service Role Key (backend seulement)
SUPABASE_SERVICE_ROLE_KEY=sb_secret_8rahVpnldfw9ftSPmlDTXw_pNdySv9f

# FedaPay Configuration
NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY=pk_live_8O8XxYFNhlpxcvxIuluoU0iY
FEDAPAY_SECRET_KEY=sk_live_O6I3vJz-Jxw0qdrcGBeUOuBD
NEXT_PUBLIC_FEDAPAY_ENVIRONMENT=live

# Africa's Talking SMS Configuration
AFRICASTALKING_API_KEY=atsk_bb9dea5685880c5cb9099c5f3698b196516ab4e9a2c35920638f0388269ee297154d7e2e
AFRICASTALKING_USERNAME=sandbox
NEXT_PUBLIC_AFRICASTALKING_SENDER_ID=ScolariteBF

# Application Configuration
NEXT_PUBLIC_APP_URL=https://scolarite-bf.vercel.app
```

### 3.2 Important !

Pour **chaque variable** :
- Cliquer **"Add"**
- Coller la clé (ex: `NEXT_PUBLIC_SUPABASE_URL`)
- Coller la valeur
- Environnement : **Production** ✅
- Répéter pour toutes les variables

⚠️ **ATTENTION** :
- `NEXT_PUBLIC_APP_URL` doit être votre URL Vercel réelle
- Si vous avez un domaine personnalisé, utilisez-le ici

---

## 🎬 Étape 4 : Déployer ! (2 min)

### 4.1 Premier déploiement

1. Vérifier que toutes les variables sont ajoutées
2. Cliquer **"Deploy"**
3. Attendre la construction (~2-3 minutes)

### 4.2 Vérifier le build

Vous verrez :
```
Building...
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
✓ Deployment Ready
```

### 4.3 URL de production

Après le déploiement :
- **URL principale:** `https://scolarite-bf.vercel.app`
- **Preview URLs:** Une pour chaque commit/PR

---

## ✅ Étape 5 : Vérifications post-déploiement (5 min)

### 5.1 Tester l'application

1. Ouvrir `https://scolarite-bf.vercel.app`
2. Vérifier que la page de login s'affiche
3. Tester une connexion (si vous avez des users)

### 5.2 Tester les API routes

```bash
# Test OTP endpoint
curl https://scolarite-bf.vercel.app/api/auth/send-otp

# Response attendue:
# {
#   "configured": true,
#   "provider": "Africa's Talking",
#   "environment": "sandbox"
# }
```

### 5.3 Vérifier les logs

Vercel Dashboard → **Deployments** → Dernier déploiement → **Logs**

Rechercher des erreurs :
- ❌ Variables manquantes ?
- ❌ Erreurs Supabase ?
- ❌ Erreurs FedaPay ?

---

## 🔧 Étape 6 : Configuration Webhooks (5 min)

### 6.1 FedaPay Webhook

1. Dashboard FedaPay → **Développeurs** → **Webhooks**
2. **Ajouter URL** : `https://scolarite-bf.vercel.app/api/webhooks/fedapay`
3. Événements :
   - ✅ `transaction.approved`
   - ✅ `transaction.declined`
   - ✅ `transaction.canceled`
4. **Sauvegarder**

### 6.2 Mettre à jour NEXT_PUBLIC_APP_URL

Si vous n'aviez pas encore l'URL finale :

1. Vercel → **Settings** → **Environment Variables**
2. Modifier `NEXT_PUBLIC_APP_URL`
3. Nouvelle valeur : `https://scolarite-bf.vercel.app`
4. **Redéployer** pour appliquer le changement

---

## 🌐 Étape 7 : Domaine personnalisé (OPTIONNEL)

### 7.1 Ajouter un domaine

Si vous avez un domaine (ex: `scolarite.bf`) :

1. Vercel → **Settings** → **Domains**
2. **Add Domain** : `scolarite.bf`
3. Vercel vous donne des instructions DNS :

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

4. Ajouter ces records chez votre registrar (OVH, Namecheap, etc.)
5. Attendre propagation DNS (5-60 min)
6. ✅ SSL automatique activé !

### 7.2 Mettre à jour les URLs

Après domaine personnalisé :

1. **Variables Vercel :**
   - `NEXT_PUBLIC_APP_URL=https://scolarite.bf`

2. **FedaPay Webhook :**
   - `https://scolarite.bf/api/webhooks/fedapay`

3. **Mobile App :**
   - Mettre à jour `API_URL` si hardcodé

---

## 🔄 Déploiements automatiques

### Comment ça marche

Vercel se connecte automatiquement à GitHub :

1. **Push sur `main`** → Déploiement production automatique
2. **Push sur autre branche** → Preview deployment
3. **Pull Request** → Preview unique par PR

### Déclencher un nouveau déploiement

```bash
# Option 1: Via Git
git add .
git commit -m "Update something"
git push origin main

# Option 2: Via Vercel Dashboard
Deployments → Redeploy

# Option 3: Via Vercel CLI
vercel --prod
```

---

## 📊 Monitoring & Analytics

### Vercel Analytics (gratuit)

1. Dashboard → **Analytics**
2. Activer **Web Analytics**
3. Voir :
   - Pages vues
   - Temps de chargement
   - Core Web Vitals
   - Trafic géographique

### Logs en temps réel

Dashboard → **Deployments** → Déploiement → **Functions**

Voir les logs de :
- `/api/auth/send-otp`
- `/api/auth/verify-otp`
- `/api/payments/create`
- `/api/webhooks/fedapay`

---

## 🔒 Sécurité Production

### Checklist sécurité

- [x] Variables sensibles dans Vercel (pas dans code)
- [x] `SUPABASE_SERVICE_ROLE_KEY` jamais exposée frontend
- [x] HTTPS automatique (Vercel)
- [ ] Rate limiting API (à ajouter si besoin)
- [ ] CORS configuré (si app mobile externe)
- [x] Webhooks sur HTTPS

### Headers de sécurité

Vercel ajoute automatiquement :
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security`

---

## 💰 Coûts

### Plan Hobby (Gratuit)

✅ **Inclus :**
- 100 GB bandwidth/mois
- Déploiements illimités
- SSL automatique
- Domaines personnalisés
- Analytics basiques

⚠️ **Limites :**
- Max 100 GB-Hours compute/mois
- Max 12 secondes/requête
- Pas de support prioritaire

### Quand passer Pro ? ($20/mois)

Si vous dépassez :
- 1 TB bandwidth/mois
- 100 GB-Hours compute/mois
- Besoin support prioritaire

**Pour ScolaritéBF :** Hobby Plan suffisant au début !

---

## 🐛 Troubleshooting

### Build failed

**Erreur:** `Error: Command "npm run build" failed`

**Solution:**
1. Vérifier que le build passe localement : `npm run build`
2. Vérifier `Root Directory` = `dashboard-school`
3. Vérifier toutes les variables d'environnement

---

### Variables non disponibles

**Erreur:** `NEXT_PUBLIC_SUPABASE_URL is not defined`

**Solution:**
1. Vérifier Vercel → Settings → Environment Variables
2. Variables `NEXT_PUBLIC_*` doivent être en **Production**
3. Redéployer après ajout de variables

---

### Webhook 404

**Erreur:** FedaPay webhook retourne 404

**Solution:**
1. Vérifier URL : `https://scolarite-bf.vercel.app/api/webhooks/fedapay`
2. Tester manuellement : `curl https://...../api/webhooks/fedapay`
3. Vérifier logs Vercel

---

### SMS non envoyés

**Erreur:** OTP pas reçu

**Solution:**
1. Vérifier `AFRICASTALKING_API_KEY` dans Vercel
2. Tester endpoint : `curl https://.../api/auth/send-otp`
3. Vérifier logs Africa's Talking

---

## 🎓 Commandes Vercel CLI (Optionnel)

### Installation

```bash
npm i -g vercel
vercel login
```

### Commandes utiles

```bash
# Lier projet local
vercel link

# Déployer en preview
vercel

# Déployer en production
vercel --prod

# Voir les logs
vercel logs

# Voir les variables
vercel env ls

# Ajouter une variable
vercel env add VARIABLE_NAME
```

---

## ✅ Checklist Finale

Avant de déclarer le déploiement réussi :

### Configuration
- [ ] Compte Vercel créé
- [ ] Projet importé depuis GitHub
- [ ] Root Directory = `dashboard-school`
- [ ] Toutes les variables d'environnement ajoutées
- [ ] `NEXT_PUBLIC_APP_URL` avec URL Vercel

### Build & Deploy
- [ ] Premier build réussi
- [ ] Application accessible via URL
- [ ] Page de login s'affiche
- [ ] Pas d'erreurs dans logs

### Intégrations
- [ ] Webhook FedaPay configuré
- [ ] Variables Supabase testées
- [ ] Variables Africa's Talking testées
- [ ] API routes fonctionnelles

### Tests
- [ ] Connexion utilisateur testée
- [ ] Envoi SMS OTP testé
- [ ] Paiement FedaPay testé (sandbox)
- [ ] Pas d'erreurs 500

### Production
- [ ] Domaine personnalisé (optionnel)
- [ ] SSL actif (automatique)
- [ ] Analytics activé
- [ ] Monitoring configuré

---

## 🎉 Félicitations !

Votre application est maintenant **EN LIGNE** ! 🚀

**URL de production :**
`https://scolarite-bf.vercel.app`

**Prochaines étapes :**
1. Tester toutes les fonctionnalités
2. Configurer domaine personnalisé (optionnel)
3. Former les premiers utilisateurs
4. Monitorer les performances
5. Build mobile apps
6. **LANCER OFFICIELLEMENT !**

---

## 📞 Support

### Vercel
- **Documentation:** https://vercel.com/docs
- **Support:** support@vercel.com
- **Status:** https://www.vercel-status.com

### Problème technique
1. Vérifier logs Vercel
2. Tester en local
3. Consulter documentation
4. Support Vercel (Pro plan)

---

**Projet:** ScolaritéBF - Système de Paiement Scolarité
**Plateforme:** Vercel
**Framework:** Next.js 14
**Status:** ✅ Production Ready
**Version:** 1.0.0
**Date déploiement:** 2025-12-07

