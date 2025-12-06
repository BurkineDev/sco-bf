# 🚀 GUIDE DE MIGRATION - SYSTÈME SCOLARITÉ BF

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Migration Supabase (Recommandé)](#migration-supabase-recommandé)
4. [Migration PostgreSQL Local](#migration-postgresql-local)
5. [Vérifications et tests](#vérifications-et-tests)
6. [Résolution de problèmes](#résolution-de-problèmes)
7. [Rollback et sauvegarde](#rollback-et-sauvegarde)

---

## 🎯 Vue d'ensemble

### Ce que vous allez migrer

- ✅ **15 tables** avec toutes leurs contraintes
- ✅ **8 types énumérés** personnalisés
- ✅ **50+ index** pour les performances
- ✅ **11 triggers** automatiques
- ✅ **8 fonctions** utilitaires
- ✅ **25+ policies RLS** pour la sécurité
- ✅ **2 vues** métier
- ✅ **Données de test** (optionnel)

### Temps estimé

- **Supabase:** 15-30 minutes
- **PostgreSQL local:** 10-20 minutes
- **Vérifications:** 10 minutes
- **Total:** ~1 heure avec tests

---

## ✅ Prérequis

### 1. Logiciels requis

#### Pour Supabase
```bash
# Node.js 18+
node --version  # Devrait être >= 18

# Supabase CLI
npm install -g supabase
supabase --version  # Devrait être >= 1.0

# Git
git --version
```

#### Pour PostgreSQL local
```bash
# PostgreSQL 13+
psql --version  # Devrait être >= 13

# pgAdmin (optionnel, interface graphique)
# ou DBeaver, HeidiSQL, etc.
```

### 2. Accès et permissions

#### Supabase
- [ ] Compte Supabase créé
- [ ] Projet créé sur Supabase
- [ ] URL du projet notée
- [ ] Clés API notées (anon + service_role)
- [ ] Accès au SQL Editor

#### PostgreSQL local
- [ ] PostgreSQL installé et démarré
- [ ] Utilisateur avec droits CREATEDB
- [ ] Base de données créée
- [ ] Client psql ou pgAdmin configuré

### 3. Fichiers nécessaires

```bash
cd /home/user/sco-bf

# Vérifier la présence des fichiers
ls -la database/
# Devrait afficher:
# - schema.sql (1229 lignes)
# - test-data.sql (708 lignes)
```

---

## 🟦 Migration Supabase (Recommandé)

### Étape 1: Configuration initiale

#### 1.1 Créer un projet Supabase

1. Aller sur https://supabase.com
2. Cliquer sur "New Project"
3. Remplir:
   - **Name:** `scolarite-bf-prod` (ou autre)
   - **Database Password:** Choisir un mot de passe fort
   - **Region:** `West EU (Ireland)` ou proche de vous
4. Attendre la création (~2 minutes)

#### 1.2 Noter les informations du projet

```bash
# Dans Supabase Dashboard > Settings > API

# URL du projet
export SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"

# Clé anon (publique)
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Clé service_role (privée - NE PAS EXPOSER)
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 1.3 Lier le projet local

```bash
# Depuis le dossier dashboard-school ou mobile-parent
supabase login

# Lier au projet
supabase link --project-ref xxxxxxxxxxxxx
# (Remplacer xxxxxxxxxxxxx par votre ref projet)
```

### Étape 2: Exécution de la migration

#### Méthode A: Via SQL Editor (Plus simple)

1. **Ouvrir SQL Editor**
   - Dashboard Supabase > SQL Editor
   - Cliquer "New query"

2. **Copier le schéma**
   ```bash
   # Sur votre machine locale
   cat database/schema.sql
   ```
   - Copier tout le contenu
   - Coller dans l'éditeur SQL Supabase

3. **Exécuter**
   - Cliquer "Run" ou Ctrl+Enter
   - Attendre la fin (~30 secondes)
   - Vérifier qu'il n'y a pas d'erreurs

4. **Ajouter les données de test** (optionnel)
   - Nouvelle requête
   - Copier `database/test-data.sql`
   - Exécuter

#### Méthode B: Via CLI (Plus pro)

```bash
cd /home/user/sco-bf

# 1. Initialiser Supabase (si pas déjà fait)
supabase init

# 2. Créer le dossier migrations s'il n'existe pas
mkdir -p supabase/migrations

# 3. Copier le schéma
cp database/schema.sql supabase/migrations/20250101000000_initial_schema.sql

# 4. Pousser la migration
supabase db push

# 5. Vérifier le statut
supabase db diff
```

#### Méthode C: Via import SQL direct

```bash
# Avec psql (nécessite connexion directe)
# Obtenir les credentials dans: Settings > Database > Connection string

PGPASSWORD='votre-password' psql \
  -h db.xxxxxxxxxxxxx.supabase.co \
  -p 5432 \
  -d postgres \
  -U postgres \
  -f database/schema.sql
```

### Étape 3: Configuration RLS

#### 3.1 Vérifier RLS activé

```sql
-- Dans SQL Editor
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;

-- Devrait retourner ~13 tables
```

#### 3.2 Tester les policies

```sql
-- Se connecter en tant qu'utilisateur test
SET request.jwt.claims = '{"sub": "test-user-id", "role": "authenticated"}';

-- Tester une query
SELECT * FROM students LIMIT 5;
-- Devrait être vide si aucun étudiant associé à cet user
```

### Étape 4: Configuration Auth

#### 4.1 Activer les providers

Dashboard > Authentication > Providers:
- ☑️ Email (Activé par défaut)
- ☑️ Phone (À activer pour OTP)

#### 4.2 Configurer le SMS provider

Pour Twilio (exemple):
```bash
# Dashboard > Authentication > Settings > SMS

# SMS Provider: Twilio
# Account SID: ACxxxxxxxxxxxxx
# Auth Token: xxxxxxxxxxxxxxx
# Message Service SID: MGxxxxxxxxxxxxx
# Twilio Phone Number: +1234567890
```

Autres options:
- MessageBird
- Vonage
- Custom (via Edge Functions)

#### 4.3 Templates SMS

Personnaliser les templates:
```
Dashboard > Authentication > Email Templates > SMS OTP

# Template:
Votre code de vérification ScolaritéBF: {{ .Code }}
Valide pendant 5 minutes.
```

### Étape 5: Configurer les Edge Functions (optionnel)

```bash
cd /home/user/sco-bf

# Créer dossier edge functions
mkdir -p supabase/functions

# Déployer les fonctions (si vous en avez)
supabase functions deploy auth-otp
supabase functions deploy payment-webhook
```

### Étape 6: Variables d'environnement

#### 6.1 Créer fichier .env

```bash
cd /home/user/sco-bf/dashboard-school

cat > .env.local <<EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

# CinetPay (à remplir plus tard)
NEXT_PUBLIC_CINETPAY_API_KEY=
NEXT_PUBLIC_CINETPAY_SITE_ID=
CINETPAY_SECRET_KEY=

# SMS (dans Supabase Edge Functions)
# Configuré via Dashboard > Edge Functions > Secrets
EOF
```

#### 6.2 Pour le mobile

```bash
cd /home/user/sco-bf/mobile-parent

# Déjà fait normalement (voir .env)
cat .env
```

---

## 🐘 Migration PostgreSQL Local

### Étape 1: Créer la base de données

```bash
# Option A: Via psql
psql -U postgres -c "CREATE DATABASE scolarite_bf;"

# Option B: Via pgAdmin
# Clic droit sur "Databases" > Create > Database
# Name: scolarite_bf
# Owner: postgres
# Encoding: UTF8
```

### Étape 2: Installer les extensions

```bash
psql -U postgres -d scolarite_bf <<EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF
```

### Étape 3: Exécuter le schéma

```bash
cd /home/user/sco-bf

# Exécuter le script complet
psql -U postgres -d scolarite_bf -f database/schema.sql

# Vérifier qu'il n'y a pas d'erreurs
echo $?  # Devrait retourner 0
```

### Étape 4: Charger les données de test

```bash
psql -U postgres -d scolarite_bf -f database/test-data.sql
```

### Étape 5: Créer un utilisateur applicatif

```bash
psql -U postgres -d scolarite_bf <<EOF
-- Créer utilisateur
CREATE USER app_scolarite WITH PASSWORD 'mot_de_passe_securise';

-- Donner les droits
GRANT CONNECT ON DATABASE scolarite_bf TO app_scolarite;
GRANT USAGE ON SCHEMA public TO app_scolarite;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_scolarite;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_scolarite;

-- Pour les futures tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_scolarite;
EOF
```

### Étape 6: Configuration PostgREST (pour API REST)

```bash
# Installer PostgREST
# Linux
wget https://github.com/PostgREST/postgrest/releases/download/v11.2.0/postgrest-v11.2.0-linux-static-x64.tar.xz
tar -xf postgrest-v11.2.0-linux-static-x64.tar.xz
sudo mv postgrest /usr/local/bin/

# Créer config
cat > postgrest.conf <<EOF
db-uri = "postgres://app_scolarite:mot_de_passe_securise@localhost:5432/scolarite_bf"
db-schemas = "public"
db-anon-role = "app_scolarite"
jwt-secret = "your-secret-key-min-32-chars"
server-port = 3000
EOF

# Démarrer
postgrest postgrest.conf
```

---

## ✅ Vérifications et tests

### Checklist de vérification

#### 1. Vérifier les tables

```sql
-- Nombre de tables
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Devrait retourner: 15

-- Liste des tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

#### 2. Vérifier les types enum

```sql
SELECT typname FROM pg_type
WHERE typcategory = 'E'
ORDER BY typname;
-- Devrait retourner: 8 types
```

#### 3. Vérifier les index

```sql
SELECT COUNT(*) FROM pg_indexes
WHERE schemaname = 'public';
-- Devrait retourner: 50+
```

#### 4. Vérifier les triggers

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
-- Devrait retourner: 11 triggers
```

#### 5. Vérifier les fonctions

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
-- Devrait retourner: 8+ fonctions
```

#### 6. Vérifier RLS

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- Toutes les tables sensibles devraient avoir rowsecurity = true
```

#### 7. Vérifier les policies

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
-- Devrait retourner: 25+ policies
```

#### 8. Vérifier les données de test

```sql
SELECT
    'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'schools', COUNT(*) FROM schools
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'classes', COUNT(*) FROM classes
UNION ALL
SELECT 'payments', COUNT(*) FROM payments;

-- Résultat attendu (si test-data.sql exécuté):
-- users: 3
-- schools: 1
-- students: 5
-- classes: 3
-- payments: 5
```

### Tests fonctionnels

#### Test 1: Créer une école

```sql
INSERT INTO schools (
    code, name, region, commission_rate, is_active
) VALUES (
    'TEST001', 'École Test', 'Centre', 0.02, true
)
RETURNING id, code, name;
```

#### Test 2: Créer une année académique

```sql
-- Remplacer <school_id> par l'ID de l'école créée
INSERT INTO academic_years (
    school_id, label, start_date, end_date, is_current
) VALUES (
    '<school_id>', '2025-2026', '2025-09-01', '2026-07-31', false
)
RETURNING id, label;
```

#### Test 3: Créer une classe

```sql
-- Remplacer <school_id> et <year_id>
INSERT INTO classes (
    school_id, academic_year_id, name, tuition_amount, allow_installments
) VALUES (
    '<school_id>', '<year_id>', 'Test CP', 100000, true
)
RETURNING id, name;
```

#### Test 4: Tester le trigger de paiement

```sql
-- 1. Créer un élève avec compte de scolarité
INSERT INTO students (school_id, class_id, matricule, first_name, last_name, is_active)
VALUES ('<school_id>', '<class_id>', 'TEST001', 'Test', 'Élève', true)
RETURNING id;

INSERT INTO tuition_accounts (student_id, academic_year_id, total_amount, paid_amount)
VALUES ('<student_id>', '<year_id>', 100000, 0)
RETURNING id;

-- 2. Vérifier le solde avant
SELECT total_amount, paid_amount, balance, is_fully_paid
FROM tuition_accounts WHERE id = '<tuition_id>';

-- 3. Créer un paiement
INSERT INTO payments (
    tuition_account_id, reference, amount, commission_amount,
    currency, channel, provider, status
) VALUES (
    '<tuition_id>', 'TEST-PAY-001', 50000, 1100,
    'XOF', 'app_mobile', 'orange_money', 'completed'
)
RETURNING id, reference, amount;

-- 4. Vérifier le solde après (devrait être mis à jour automatiquement)
SELECT total_amount, paid_amount, balance, is_fully_paid, last_payment_at
FROM tuition_accounts WHERE id = '<tuition_id>';
-- paid_amount devrait être 50000
-- balance devrait être 50000
```

#### Test 5: Tester les vues

```sql
-- Vue des étudiants
SELECT * FROM v_school_students_payments LIMIT 5;

-- Vue des stats
SELECT * FROM v_school_payment_stats;
```

### Tests de performance

```sql
-- Test requête élèves d'une école
EXPLAIN ANALYZE
SELECT * FROM students WHERE school_id = '<school_id>' AND is_active = true;
-- Devrait utiliser l'index idx_students_school

-- Test recherche par matricule
EXPLAIN ANALYZE
SELECT * FROM students WHERE school_id = '<school_id>' AND matricule = '2024-001';
-- Devrait utiliser l'index idx_students_matricule

-- Test paiements récents
EXPLAIN ANALYZE
SELECT * FROM payments
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 100;
-- Devrait utiliser l'index idx_payments_date
```

---

## 🔧 Résolution de problèmes

### Problème 1: Erreur "extension uuid-ossp does not exist"

**Solution:**
```sql
-- Créer l'extension manuellement
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Puis réexécuter le script
```

### Problème 2: Erreur "role does not exist"

**Supabase:**
```sql
-- Les fonctions auth.* utilisent auth.uid()
-- S'assurer que vous êtes connecté via un client Supabase authentifié
```

**PostgreSQL local:**
```sql
-- Créer les rôles nécessaires
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role;

-- Ou commenter les policies RLS pour tests
```

### Problème 3: Trigger ne se déclenche pas

**Vérification:**
```sql
-- Vérifier que le trigger existe
SELECT * FROM information_schema.triggers
WHERE event_object_table = 'payments'
  AND trigger_name = 'trigger_update_tuition_on_payment';

-- Vérifier que la fonction existe
SELECT * FROM information_schema.routines
WHERE routine_name = 'update_tuition_account_on_payment';

-- Recréer si nécessaire
DROP TRIGGER IF EXISTS trigger_update_tuition_on_payment ON payments;
CREATE TRIGGER trigger_update_tuition_on_payment
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_tuition_account_on_payment();
```

### Problème 4: RLS bloque toutes les requêtes

**Diagnostic:**
```sql
-- Vérifier les policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Désactiver temporairement RLS pour tests
ALTER TABLE students DISABLE ROW LEVEL SECURITY;

-- Réactiver après
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
```

**Solution permanente (Supabase):**
```sql
-- Utiliser le service_role_key côté serveur
-- Ou se connecter avec un utilisateur ayant les droits
```

### Problème 5: Performance lente

**Diagnostic:**
```sql
-- Vérifier les statistiques
ANALYZE;

-- Vérifier les index manquants
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;

-- Requêtes lentes
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

**Solutions:**
```sql
-- Recréer les statistiques
VACUUM ANALYZE;

-- Ajouter index si nécessaire
CREATE INDEX CONCURRENTLY idx_custom ON table_name(column_name);
```

### Problème 6: Données de test ne chargent pas

**Vérification:**
```sql
-- Vérifier les contraintes FK
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f'
  AND connamespace = 'public'::regnamespace;

-- Désactiver temporairement
SET session_replication_role = 'replica';
-- Charger les données
SET session_replication_role = 'origin';
```

---

## 💾 Rollback et sauvegarde

### Créer une sauvegarde avant migration

#### Supabase
```bash
# Via CLI
supabase db dump -f backup_before_migration.sql

# Via Dashboard
# Settings > Database > Backups
# Cliquer "Create backup"
```

#### PostgreSQL local
```bash
# Dump complet
pg_dump -U postgres scolarite_bf > backup_$(date +%Y%m%d_%H%M%S).sql

# Dump avec compression
pg_dump -U postgres -Fc scolarite_bf > backup_$(date +%Y%m%d_%H%M%S).dump
```

### Rollback complet

#### Supabase
```bash
# Restaurer depuis backup
supabase db reset
# Puis restaurer le backup via SQL Editor
```

#### PostgreSQL local
```bash
# Supprimer et recréer
psql -U postgres -c "DROP DATABASE scolarite_bf;"
psql -U postgres -c "CREATE DATABASE scolarite_bf;"

# Restaurer
psql -U postgres scolarite_bf < backup_20250101_120000.sql
```

### Sauvegarde régulière (Production)

#### Script de backup automatique

```bash
#!/bin/bash
# backup_cron.sh

BACKUP_DIR="/var/backups/scolarite_bf"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup Supabase
supabase db dump -f "$BACKUP_DIR/backup_$DATE.sql"

# Compresser
gzip "$BACKUP_DIR/backup_$DATE.sql"

# Garder seulement les 30 derniers jours
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

#### Cron job
```bash
# Ajouter au crontab
crontab -e

# Backup quotidien à 2h du matin
0 2 * * * /path/to/backup_cron.sh >> /var/log/scolarite_backup.log 2>&1
```

---

## 📊 Checklist finale

### Avant de déclarer la migration réussie:

- [ ] Toutes les tables créées (15)
- [ ] Tous les types enum créés (8)
- [ ] Tous les index créés (50+)
- [ ] Tous les triggers fonctionnent (11)
- [ ] Toutes les fonctions créées (8+)
- [ ] RLS activé et policies fonctionnent (25+)
- [ ] Vues créées et fonctionnelles (2)
- [ ] Données de test chargées (optionnel)
- [ ] Tests fonctionnels passent (5/5)
- [ ] Tests de performance OK
- [ ] Backup créé avant migration
- [ ] Rollback testé sur environnement dev
- [ ] Variables d'environnement configurées
- [ ] Documentation mise à jour
- [ ] Équipe informée

### Environnements

#### Développement
- [ ] DB locale fonctionnelle
- [ ] Données de test chargées
- [ ] Dashboard connecté
- [ ] Mobile app connectée

#### Staging/Test
- [ ] Supabase projet test créé
- [ ] Migration exécutée
- [ ] Tests end-to-end passent
- [ ] Performance acceptable

#### Production
- [ ] Supabase projet prod créé
- [ ] Backup pré-migration fait
- [ ] Migration exécutée en heures creuses
- [ ] Monitoring activé
- [ ] Rollback plan prêt
- [ ] Équipe support informée

---

## 📞 Support

### Logs utiles

#### Supabase
```bash
# Logs Edge Functions
supabase functions logs <function-name>

# Logs base de données (via Dashboard)
Dashboard > Database > Logs
```

#### PostgreSQL local
```bash
# Logs PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-13-main.log

# Logs requêtes lentes
# Activer dans postgresql.conf:
log_min_duration_statement = 1000  # 1 seconde
```

### Commandes de diagnostic

```sql
-- Version PostgreSQL
SELECT version();

-- Extensions installées
SELECT * FROM pg_extension;

-- Taille de la base
SELECT pg_size_pretty(pg_database_size('scolarite_bf'));

-- Top tables par taille
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Connexions actives
SELECT * FROM pg_stat_activity
WHERE datname = 'scolarite_bf';
```

---

## 🎉 Félicitations !

Si vous avez suivi ce guide et que toutes les vérifications passent, votre migration est **RÉUSSIE** !

### Prochaines étapes:

1. **Tester l'application complète** avec la nouvelle DB
2. **Configurer le monitoring** (Supabase Dashboard)
3. **Mettre en place les backups** automatiques
4. **Former l'équipe** sur la nouvelle infrastructure
5. **Documenter** les spécificités de votre déploiement

---

**Date de création:** 2025-12-06
**Version:** 1.0.0
**Auteur:** Claude (Anthropic)
