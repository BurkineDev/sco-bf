# ✅ MIGRATION SUPABASE - GUIDE DE VÉRIFICATION

## 🎯 Vue d'ensemble

Ce document vous guide à travers toutes les étapes de vérification après la migration de votre base de données vers Supabase.

---

## 📋 CHECKLIST COMPLÈTE

### ✅ Étape 1 : Création du projet Supabase

- [ ] Compte Supabase créé (via GitHub ou email)
- [ ] Nouveau projet créé
- [ ] Nom du projet : `scolarite-bf-prod`
- [ ] Région sélectionnée : **West EU (Frankfurt)** *(proche de l'Afrique)*
- [ ] Mot de passe base de données défini (min. 12 caractères)
- [ ] Projet complètement initialisé (~2 min)

---

### ✅ Étape 2 : Exécution du schéma SQL

- [ ] SQL Editor ouvert
- [ ] Fichier `database/schema.sql` copié (1,228 lignes)
- [ ] SQL exécuté avec succès
- [ ] Aucune erreur affichée

**Ce qui doit être créé :**
- [ ] ✅ 8 types énumérés (user_role, payment_status, etc.)
- [ ] ✅ 15 tables principales
- [ ] ✅ 50+ index de performance
- [ ] ✅ 11 triggers automatiques
- [ ] ✅ 8 fonctions utilitaires
- [ ] ✅ 25+ Row Level Security policies
- [ ] ✅ 2 vues métier

**Vérification visuelle :**
```
Supabase Dashboard > Table Editor
Vous devez voir 15 tables :
✓ users
✓ schools
✓ academic_years
✓ classes
✓ students
✓ tuition_accounts
✓ payment_intents
✓ payments
✓ agents
✓ agent_commissions
✓ webhooks
✓ otp_codes
✓ user_devices
✓ audit_logs
✓ platform_config
```

---

### ✅ Étape 3 : Données de test (OPTIONNEL - Dev uniquement)

**⚠️ NE PAS FAIRE EN PRODUCTION**

Pour environnement de développement/staging :
- [ ] Fichier `database/test-data.sql` copié (708 lignes)
- [ ] SQL exécuté avec succès
- [ ] Données visibles dans Table Editor

**Données de test incluses :**
- [ ] 1 école : Complexe Scolaire Excellence
- [ ] 1 admin : +22670123456 (Amadou Traoré)
- [ ] 5 élèves avec photos
- [ ] 5 comptes de scolarité
- [ ] 5 paiements (total : 380,000 FCFA)
- [ ] 1 agent : Issouf Compaoré
- [ ] 2 parents

---

### ✅ Étape 4 : Configuration des credentials

#### Dashboard (Next.js)

Fichier : `.env.local`
- [ ] Fichier créé à la racine du projet
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configuré
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configuré
- [ ] Valeurs copiées depuis Supabase > Settings > API

**Template du fichier :**
```env
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE_PROJET_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...votre_anon_key
NEXT_PUBLIC_APP_NAME="ScolaritéBF"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

#### Application Mobile (React Native)

Fichier : `mobile-parent/.env`
- [ ] Fichier mis à jour
- [ ] `EXPO_PUBLIC_SUPABASE_URL` configuré
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` configuré

**Template du fichier :**
```env
EXPO_PUBLIC_SUPABASE_URL=https://VOTRE_PROJET_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...votre_anon_key
EXPO_PUBLIC_APP_NAME=ScolaritéBF Parent
```

#### Sécurité des credentials

- [ ] Fichier `SUPABASE-CREDENTIALS.txt` rempli avec toutes les clés
- [ ] Service Role Key **jamais** utilisée côté client
- [ ] Fichiers `.env*` dans `.gitignore` (déjà fait ✅)

---

### ✅ Étape 5 : Tests de connexion

#### Test 1 : Connexion Dashboard

```bash
# Depuis le dossier racine
npm run dev
```

- [ ] Dashboard démarre sans erreur
- [ ] Page de connexion accessible (http://localhost:3000)
- [ ] Aucune erreur Supabase dans la console

#### Test 2 : Connexion Mobile

```bash
# Depuis mobile-parent/
npx expo start
```

- [ ] App mobile démarre sans erreur
- [ ] Connexion à Supabase réussie
- [ ] Aucune erreur réseau dans Expo

---

### ✅ Étape 6 : Tests fonctionnels (avec données de test)

**⚠️ Nécessite les données de test chargées**

#### Test A : Authentification Admin

1. **Dashboard Web :**
   - [ ] Accéder à `/login-dev`
   - [ ] Tester connexion avec : `+22670123456`
   - [ ] Vérifier que les données école s'affichent

2. **Vérifier dans Supabase :**
   ```sql
   SELECT * FROM users WHERE phone = '+22670123456';
   ```
   - [ ] Utilisateur existe
   - [ ] `role` = 'school_admin'
   - [ ] `school_id` = id de l'école

#### Test B : Liste des élèves

1. **Dashboard > Élèves**
   - [ ] 5 élèves affichés
   - [ ] Photos visibles
   - [ ] Statuts corrects

2. **Vérifier RLS :**
   - [ ] L'admin ne voit QUE les élèves de son école
   - [ ] Filtrage automatique par `school_id`

#### Test C : Paiements

1. **Dashboard > Paiements**
   - [ ] 5 paiements affichés
   - [ ] Total : 380,000 FCFA
   - [ ] Statuts corrects (completed)

2. **Vérifier triggers :**
   ```sql
   SELECT
     s.first_name,
     s.last_name,
     ta.total_required,
     ta.total_paid,
     ta.balance_remaining,
     ta.payment_status
   FROM tuition_accounts ta
   JOIN students s ON ta.student_id = s.id;
   ```
   - [ ] `total_paid` = somme des paiements
   - [ ] `balance_remaining` = total_required - total_paid
   - [ ] `payment_status` mis à jour automatiquement

---

### ✅ Étape 7 : Vérification de la sécurité (RLS)

#### Test RLS : Row Level Security

1. **Créer un utilisateur test** (via SQL Editor) :
   ```sql
   -- Créer un parent test
   INSERT INTO users (phone, role, school_id, full_name)
   VALUES ('+22670999999', 'parent', NULL, 'Parent Test')
   RETURNING id;
   ```

2. **Vérifier isolation :**
   - [ ] Parent ne peut voir QUE ses enfants
   - [ ] Parent ne peut voir QUE ses paiements
   - [ ] Admin école ne voit QUE les données de son école
   - [ ] Agent ne voit QUE ses commissions

3. **Test politique SELECT (dans SQL Editor) :**
   ```sql
   -- En tant que parent (RLS actif)
   SET LOCAL ROLE authenticated;
   SET LOCAL "request.jwt.claims" = '{"sub":"<parent_user_id>","role":"parent"}';

   SELECT * FROM students;
   -- Doit retourner 0 ligne (parent n'a pas d'enfants liés)
   ```

---

### ✅ Étape 8 : Performance et index

#### Vérifier les index

Dans SQL Editor :
```sql
-- Lister tous les index créés
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

- [ ] Au moins 50 index créés
- [ ] Index sur clés étrangères présents
- [ ] Index sur champs de recherche (phone, matricule, etc.)

#### Test de performance

```sql
-- Doit être très rapide (<10ms)
EXPLAIN ANALYZE
SELECT * FROM students
WHERE school_id = '<votre_school_id>'
  AND is_active = true;
```

- [ ] Temps d'exécution < 10ms
- [ ] Index utilisé (Index Scan, pas Seq Scan)

---

### ✅ Étape 9 : Backup et sécurité

#### Configuration du backup automatique

Dans Supabase Dashboard :
- [ ] Settings > Database > Point-in-Time Recovery (PITR)
- [ ] Backups quotidiens activés
- [ ] Rétention configurée (7 jours minimum)

#### Sauvegarde manuelle immédiate

1. **Depuis SQL Editor :**
   ```sql
   -- Export complet des données
   COPY (SELECT * FROM students) TO STDOUT WITH CSV HEADER;
   COPY (SELECT * FROM payments) TO STDOUT WITH CSV HEADER;
   ```

2. **Ou via pg_dump (si accès direct) :**
   ```bash
   pg_dump -h db.xxx.supabase.co \
           -U postgres \
           -d postgres \
           > backup-$(date +%Y%m%d).sql
   ```

- [ ] Backup créé et sauvegardé localement
- [ ] Backup stocké dans un lieu sûr (hors serveur)

---

### ✅ Étape 10 : Monitoring et alertes

#### Activer les alertes Supabase

Dans Supabase Dashboard > Project Settings > Alerts :
- [ ] Alert sur erreurs de base de données
- [ ] Alert sur usage disque (>80%)
- [ ] Alert sur connexions simultanées
- [ ] Email de notification configuré

#### Vérifier les logs

Supabase > Logs :
- [ ] Aucune erreur critique
- [ ] Connexions réussies
- [ ] Requêtes SQL exécutées correctement

---

## 🚀 MIGRATION RÉUSSIE !

### ✅ Checklist finale de production

Avant de déclarer la migration terminée :

#### Technique
- [ ] 15 tables créées et vérifiées
- [ ] 8 types enum créés
- [ ] 50+ index créés et fonctionnels
- [ ] 11 triggers testés
- [ ] 25+ policies RLS actives
- [ ] 2 vues créées
- [ ] Performance < 100ms pour requêtes simples

#### Fonctionnel
- [ ] Connexion admin fonctionne
- [ ] CRUD élèves fonctionne
- [ ] Création de paiement fonctionne
- [ ] Triggers mettent à jour les comptes
- [ ] RLS filtre correctement
- [ ] Vues retournent les bonnes données

#### Sécurité
- [ ] RLS activé sur toutes les tables sensibles
- [ ] Policies testées pour chaque rôle
- [ ] Credentials en sécurité (jamais committées)
- [ ] Backup créé et testé
- [ ] Logs audit activés
- [ ] Variables d'environnement configurées

#### Applications
- [ ] Dashboard connecté à la prod
- [ ] Mobile app connectée à la prod
- [ ] Tests end-to-end passent
- [ ] Aucune erreur de connexion

---

## 📊 Statistiques de la migration

| Métrique | Valeur |
|----------|--------|
| **Tables** | 15 |
| **Types énumérés** | 8 |
| **Index** | 50+ |
| **Triggers** | 11 |
| **Fonctions** | 8 |
| **Policies RLS** | 25+ |
| **Vues** | 2 |
| **Lignes de SQL** | 1,228 |
| **Temps d'exécution** | ~30 sec |

---

## 🆘 Problèmes courants

### Problème 1 : Erreur "extension uuid-ossp does not exist"

**Solution :**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```
Exécuter manuellement avant le schéma.

---

### Problème 2 : Erreur RLS "permission denied"

**Solution :**
Vérifier que vous êtes connecté en tant qu'utilisateur autorisé.
Pour les tests, désactiver temporairement RLS :
```sql
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
-- Faire les tests
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
```

---

### Problème 3 : Performances lentes

**Solution :**
1. Vérifier les index :
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'students';
   ```
2. Analyser les requêtes :
   ```sql
   EXPLAIN ANALYZE SELECT * FROM students WHERE ...;
   ```
3. Vacuum complet :
   ```sql
   VACUUM ANALYZE;
   ```

---

### Problème 4 : Dashboard ne se connecte pas

**Solution :**
1. Vérifier `.env.local` :
   ```bash
   cat .env.local
   ```
2. Vérifier que les valeurs sont correctes (copier-coller depuis Supabase)
3. Redémarrer le serveur :
   ```bash
   npm run dev
   ```

---

## 📞 Support

### En cas de blocage

1. **Consulter les guides :**
   - `SCHEMA-DATABASE-COMPLET.md` (documentation technique)
   - `GUIDE-MIGRATION.md` (guide détaillé)
   - `DIAGRAMME-ERD.md` (schémas visuels)

2. **Vérifier les logs :**
   - Supabase Dashboard > Logs
   - Console du navigateur (F12)
   - Terminal (npm run dev)

3. **Troubleshooting :**
   - Section "Résolution de problèmes" dans `GUIDE-MIGRATION.md`

---

## 🎉 Prochaines étapes

Après une migration réussie :

1. **Configurer SMS OTP** (priorité critique)
   - Choisir fournisseur : Twilio / Africa's Talking / MessageBird
   - Obtenir API keys
   - Configurer dans Supabase Edge Functions

2. **Obtenir clés CinetPay** (priorité critique)
   - Créer compte sur cinetpay.com
   - Attendre validation (24-48h)
   - Configurer dans .env

3. **Déployer Dashboard** (production)
   - Vercel (recommandé)
   - Netlify
   - DigitalOcean App Platform

4. **Build app mobile**
   - Android : APK/AAB pour Play Store
   - iOS : IPA pour App Store
   - Distribution interne (TestFlight, APK direct)

5. **Tests end-to-end complets**
   - Scénarios utilisateurs réels
   - Tests de charge
   - Tests de sécurité

---

**🎯 Projet :** Système de Paiement Scolarité Burkina Faso
**📅 Date migration :** 2025-12-07
**✅ Status :** Migration complète
**📊 Base de données :** 15 tables, 1,228 lignes SQL
**🔒 Sécurité :** RLS activé, 25+ policies

---

## ✨ FÉLICITATIONS !

Votre base de données est maintenant migrée vers Supabase et prête pour la production ! 🚀

