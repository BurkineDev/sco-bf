# 📊 SCHÉMA COMPLET DE LA BASE DE DONNÉES - SYSTÈME DE PAIEMENT SCOLARITÉ BURKINA FASO

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Types énumérés](#types-énumérés)
3. [Tables principales](#tables-principales)
4. [Relations entre tables](#relations-entre-tables)
5. [Index et performance](#index-et-performance)
6. [Triggers et fonctions](#triggers-et-fonctions)
7. [Row Level Security (RLS)](#row-level-security-rls)
8. [Vues utilitaires](#vues-utilitaires)
9. [Configuration plateforme](#configuration-plateforme)
10. [Instructions de migration](#instructions-de-migration)

---

## 🎯 Vue d'ensemble

### Architecture

Le système utilise PostgreSQL (via Supabase) avec:
- **Row Level Security (RLS)** pour la sécurité au niveau des lignes
- **Triggers automatiques** pour la mise à jour des timestamps
- **Champs calculés (GENERATED)** pour les données dérivées
- **Types énumérés** pour garantir l'intégrité des données
- **Audit logs** complets pour la traçabilité

### Acteurs principaux

1. **Parents** - Paient les scolarités de leurs enfants
2. **Écoles** - Gèrent leurs élèves et suivent les paiements
3. **Agents** - Collectent les paiements en cash/mobile money
4. **Admins plateforme** - Supervisent tout le système

---

## 📝 Types énumérés

### 1. user_role
```sql
CREATE TYPE user_role AS ENUM (
    'parent',                  -- Parent/tuteur d'élève
    'school_admin',            -- Directeur d'école
    'school_accountant',       -- Comptable d'école
    'agent',                   -- Agent de collecte
    'platform_admin',          -- Admin plateforme
    'platform_super_admin'     -- Super admin plateforme
);
```

### 2. payment_status
```sql
CREATE TYPE payment_status AS ENUM (
    'pending',       -- En attente
    'processing',    -- En cours de traitement
    'completed',     -- Paiement réussi
    'failed',        -- Échec
    'cancelled',     -- Annulé
    'refunded'       -- Remboursé
);
```

### 3. payment_channel
```sql
CREATE TYPE payment_channel AS ENUM (
    'app_mobile',     -- Application mobile parent
    'ussd',           -- USSD (*xxx#)
    'agent_cash',     -- Cash chez agent
    'agent_momo',     -- Mobile money via agent
    'bank_transfer',  -- Virement bancaire
    'other'           -- Autre moyen
);
```

### 4. payment_provider
```sql
CREATE TYPE payment_provider AS ENUM (
    'cinetpay',      -- CinetPay (agrégateur)
    'paygate',       -- PayGate
    'corispay',      -- CorisPay
    'orange_money',  -- Orange Money
    'moov_money',    -- Moov Money
    'coris_money',   -- Coris Money
    'manual'         -- Paiement manuel (agent)
);
```

### 5. academic_year_status
```sql
CREATE TYPE academic_year_status AS ENUM (
    'upcoming',    -- À venir
    'active',      -- En cours
    'completed',   -- Terminée
    'archived'     -- Archivée
);
```

### 6. otp_purpose
```sql
CREATE TYPE otp_purpose AS ENUM (
    'login',                   -- Connexion
    'payment_confirmation',    -- Confirmation paiement
    'phone_verification',      -- Vérification téléphone
    'password_reset'           -- Réinitialisation mot de passe
);
```

### 7. webhook_status
```sql
CREATE TYPE webhook_status AS ENUM (
    'received',    -- Webhook reçu
    'processing',  -- En traitement
    'processed',   -- Traité
    'failed',      -- Échec traitement
    'duplicate'    -- Doublon (ignoré)
);
```

### 8. audit_action
```sql
CREATE TYPE audit_action AS ENUM (
    'create',              -- Création
    'update',              -- Modification
    'delete',              -- Suppression
    'login',               -- Connexion
    'logout',              -- Déconnexion
    'payment_initiated',   -- Paiement initié
    'payment_completed',   -- Paiement complété
    'payment_failed',      -- Paiement échoué
    'webhook_received',    -- Webhook reçu
    'otp_sent',           -- OTP envoyé
    'otp_verified',       -- OTP vérifié
    'otp_failed',         -- OTP échoué
    'permission_denied',   -- Permission refusée
    'suspicious_activity'  -- Activité suspecte
);
```

---

## 🗄️ Tables principales

### 1. **users** - Utilisateurs du système

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK, identifiant unique |
| `phone` | VARCHAR(20) | Téléphone (UNIQUE, requis) |
| `phone_verified` | BOOLEAN | Téléphone vérifié? |
| `email` | VARCHAR(255) | Email (UNIQUE, optionnel) |
| `email_verified` | BOOLEAN | Email vérifié? |
| `first_name` | VARCHAR(100) | Prénom |
| `last_name` | VARCHAR(100) | Nom |
| `display_name` | VARCHAR(200) | Nom complet (GENERATED) |
| `password_hash` | VARCHAR(255) | Hash du mot de passe (optionnel pour OTP only) |
| `role` | user_role | Rôle de l'utilisateur |
| `is_active` | BOOLEAN | Compte actif? |
| `is_blocked` | BOOLEAN | Compte bloqué? |
| `blocked_reason` | TEXT | Raison du blocage |
| `blocked_at` | TIMESTAMPTZ | Date du blocage |
| `blocked_by` | UUID | Admin qui a bloqué |
| `failed_login_attempts` | INT | Nombre de tentatives échouées |
| `last_failed_login_at` | TIMESTAMPTZ | Dernière tentative échouée |
| `lockout_until` | TIMESTAMPTZ | Bloqué jusqu'à |
| `preferred_language` | VARCHAR(5) | Langue préférée (fr) |
| `timezone` | VARCHAR(50) | Fuseau horaire |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date dernière mise à jour |
| `last_login_at` | TIMESTAMPTZ | Dernière connexion |

**Contraintes:**
- `phone_format`: Format téléphone international
- `email_format`: Format email valide

---

### 2. **schools** - Établissements scolaires

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK, identifiant unique |
| `code` | VARCHAR(20) | Code école (UNIQUE, pour USSD) |
| `name` | VARCHAR(255) | Nom complet |
| `short_name` | VARCHAR(50) | Nom court |
| `region` | VARCHAR(100) | Région (ex: Centre) |
| `province` | VARCHAR(100) | Province (ex: Kadiogo) |
| `commune` | VARCHAR(100) | Commune |
| `address` | TEXT | Adresse complète |
| `phone` | VARCHAR(20) | Téléphone école |
| `email` | VARCHAR(255) | Email école |
| `logo_url` | TEXT | URL du logo |
| `is_active` | BOOLEAN | École active? |
| `commission_rate` | DECIMAL(5,4) | Taux commission (2% par défaut) |
| `commission_fixed` | INT | Commission fixe (FCFA) |
| `commission_type` | VARCHAR(10) | Type: 'rate', 'fixed', 'both' |
| `admin_user_id` | UUID | FK → users (directeur) |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |

**Contraintes:**
- `school_code_format`: Format code (ex: SCL-BF-001)
- `commission_rate_range`: Entre 0% et 15%

---

### 3. **academic_years** - Années académiques

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `school_id` | UUID | FK → schools |
| `label` | VARCHAR(20) | Ex: "2024-2025" |
| `start_date` | DATE | Date début |
| `end_date` | DATE | Date fin |
| `status` | academic_year_status | Statut |
| `is_current` | BOOLEAN | Année en cours? |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |

**Contraintes:**
- `valid_date_range`: end_date > start_date
- UNIQUE(school_id, label)

---

### 4. **classes** - Classes

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `school_id` | UUID | FK → schools |
| `academic_year_id` | UUID | FK → academic_years |
| `name` | VARCHAR(100) | Ex: "6ème A" |
| `level` | VARCHAR(50) | Ex: "6ème" |
| `section` | VARCHAR(20) | Ex: "A" |
| `tuition_amount` | INT | Montant scolarité (FCFA) |
| `allow_installments` | BOOLEAN | Paiement fractionné autorisé? |
| `min_installment_amount` | INT | Versement minimum (FCFA) |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |

**Contraintes:**
- `positive_tuition`: tuition_amount > 0
- `positive_min_installment`: min_installment_amount > 0
- UNIQUE(school_id, academic_year_id, name)

---

### 5. **students** - Élèves

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `school_id` | UUID | FK → schools |
| `class_id` | UUID | FK → classes |
| `matricule` | VARCHAR(50) | Matricule élève |
| `first_name` | VARCHAR(100) | Prénom |
| `last_name` | VARCHAR(100) | Nom |
| `display_name` | VARCHAR(200) | Nom complet (GENERATED) |
| `date_of_birth` | DATE | Date de naissance |
| `gender` | VARCHAR(1) | M ou F |
| `parent_user_id` | UUID | FK → users (parent avec compte) |
| `parent_phone` | VARCHAR(20) | Téléphone parent (si pas de compte) |
| `parent_name` | VARCHAR(200) | Nom parent |
| `is_active` | BOOLEAN | Élève actif? |
| `enrolled_at` | DATE | Date d'inscription |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |

**Contraintes:**
- UNIQUE(school_id, matricule)
- CHECK(gender IN ('M', 'F'))

---

### 6. **tuition_accounts** - Comptes de scolarité

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `student_id` | UUID | FK → students |
| `academic_year_id` | UUID | FK → academic_years |
| `total_amount` | INT | Montant total dû (FCFA) |
| `paid_amount` | INT | Montant payé (FCFA) |
| `balance` | INT | Reste à payer (GENERATED) |
| `discount_amount` | INT | Réduction accordée |
| `discount_reason` | TEXT | Raison réduction |
| `is_fully_paid` | BOOLEAN | Entièrement payé? (GENERATED) |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |
| `last_payment_at` | TIMESTAMPTZ | Dernier paiement |

**Contraintes:**
- UNIQUE(student_id, academic_year_id)
- `positive_amounts`: Montants >= 0
- `paid_not_exceed_total`: paid_amount <= total_amount + discount_amount

---

### 7. **payment_intents** - Intentions de paiement

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `reference` | VARCHAR(100) | Référence unique (UNIQUE) |
| `tuition_account_id` | UUID | FK → tuition_accounts |
| `initiated_by` | UUID | FK → users |
| `amount` | INT | Montant (FCFA) |
| `currency` | VARCHAR(3) | Devise (XOF) |
| `channel` | payment_channel | Canal paiement |
| `provider` | payment_provider | Fournisseur |
| `status` | payment_status | Statut |
| `provider_transaction_id` | VARCHAR(255) | ID transaction PSP |
| `provider_response` | JSONB | Réponse complète PSP |
| `expires_at` | TIMESTAMPTZ | Expiration |
| `metadata` | JSONB | Métadonnées |
| `ip_address` | INET | Adresse IP |
| `user_agent` | TEXT | User agent |
| `device_id` | VARCHAR(255) | ID appareil |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |
| `completed_at` | TIMESTAMPTZ | Date complétion |

**Contraintes:**
- `positive_amount`: amount > 0

---

### 8. **payments** - Paiements confirmés

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `reference` | VARCHAR(100) | Référence unique (UNIQUE) |
| `tuition_account_id` | UUID | FK → tuition_accounts |
| `payment_intent_id` | UUID | FK → payment_intents (optionnel) |
| `paid_by` | UUID | FK → users (qui a payé) |
| `recorded_by` | UUID | FK → users (agent qui a saisi) |
| `amount` | INT | Montant (FCFA) |
| `currency` | VARCHAR(3) | Devise (XOF) |
| `channel` | payment_channel | Canal |
| `provider` | payment_provider | Fournisseur |
| `commission_amount` | INT | Commission plateforme |
| `commission_rate` | DECIMAL(5,4) | Taux commission appliqué |
| `net_amount` | INT | Montant net école (GENERATED) |
| `provider_transaction_id` | VARCHAR(255) | ID transaction PSP |
| `provider_reference` | VARCHAR(255) | Référence PSP |
| `provider_response` | JSONB | Réponse PSP |
| `status` | payment_status | Statut (completed par défaut) |
| `payer_phone` | VARCHAR(20) | Téléphone payeur (USSD) |
| `payer_name` | VARCHAR(200) | Nom payeur |
| `metadata` | JSONB | Métadonnées |
| `notes` | TEXT | Notes |
| `created_at` | TIMESTAMPTZ | Date paiement |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |

**Contraintes:**
- `positive_amounts`: amount > 0 AND commission_amount >= 0

---

### 9. **agents** - Agents de collecte

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users (UNIQUE) |
| `school_id` | UUID | FK → schools (NULL = multi-écoles) |
| `agent_code` | VARCHAR(20) | Code agent (UNIQUE) |
| `daily_limit` | INT | Limite journalière (FCFA) |
| `transaction_limit` | INT | Limite par transaction (FCFA) |
| `is_active` | BOOLEAN | Agent actif? |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |

---

### 10. **parent_students** - Relations parent-élève

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `parent_user_id` | UUID | FK → users |
| `student_id` | UUID | FK → students |
| `relationship` | VARCHAR(50) | Type relation (parent, tuteur) |
| `is_primary` | BOOLEAN | Contact principal? |
| `can_view_payments` | BOOLEAN | Peut voir paiements? |
| `can_make_payments` | BOOLEAN | Peut effectuer paiements? |
| `created_at` | TIMESTAMPTZ | Date création |

**Contraintes:**
- UNIQUE(parent_user_id, student_id)

---

### 11. **payment_otps** - OTP pour paiements

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users (optionnel) |
| `phone` | VARCHAR(20) | Téléphone destinataire |
| `otp_hash` | VARCHAR(255) | Hash OTP (sécurisé!) |
| `purpose` | otp_purpose | Usage OTP |
| `payment_intent_id` | UUID | FK → payment_intents (optionnel) |
| `expires_at` | TIMESTAMPTZ | Expiration |
| `is_used` | BOOLEAN | Déjà utilisé? |
| `used_at` | TIMESTAMPTZ | Date utilisation |
| `attempts` | INT | Nombre tentatives |
| `max_attempts` | INT | Maximum tentatives (3) |
| `ip_address` | INET | Adresse IP |
| `created_at` | TIMESTAMPTZ | Date création |

---

### 12. **webhook_events** - Logs webhooks PSP

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `provider` | payment_provider | Fournisseur |
| `event_type` | VARCHAR(100) | Type événement |
| `provider_event_id` | VARCHAR(255) | ID événement PSP |
| `idempotency_key` | VARCHAR(255) | Clé unicité (UNIQUE) |
| `raw_payload` | JSONB | Payload brut |
| `headers` | JSONB | Headers HTTP |
| `signature_received` | VARCHAR(500) | Signature reçue |
| `signature_valid` | BOOLEAN | Signature valide? |
| `status` | webhook_status | Statut traitement |
| `processing_error` | TEXT | Erreur traitement |
| `processed_at` | TIMESTAMPTZ | Date traitement |
| `payment_intent_id` | UUID | FK → payment_intents |
| `payment_id` | UUID | FK → payments |
| `ip_address` | INET | Adresse IP |
| `created_at` | TIMESTAMPTZ | Date réception |

**Contraintes:**
- UNIQUE(provider, idempotency_key)

---

### 13. **audit_logs** - Journaux d'audit

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users |
| `user_role` | user_role | Rôle utilisateur |
| `ip_address` | INET | Adresse IP |
| `user_agent` | TEXT | User agent |
| `device_id` | VARCHAR(255) | ID appareil |
| `action` | audit_action | Action effectuée |
| `resource_type` | VARCHAR(50) | Type ressource |
| `resource_id` | UUID | ID ressource |
| `old_values` | JSONB | Anciennes valeurs |
| `new_values` | JSONB | Nouvelles valeurs |
| `metadata` | JSONB | Métadonnées |
| `request_id` | VARCHAR(100) | ID requête |
| `session_id` | VARCHAR(100) | ID session |
| `created_at` | TIMESTAMPTZ | Date action |

---

### 14. **devices** - Appareils (anti-fraude)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users |
| `device_id` | VARCHAR(255) | Empreinte appareil |
| `device_type` | VARCHAR(50) | Type (mobile, web, agent) |
| `device_name` | VARCHAR(200) | Nom appareil |
| `platform` | VARCHAR(50) | Plateforme (ios, android, web) |
| `app_version` | VARCHAR(20) | Version app |
| `os_version` | VARCHAR(50) | Version OS |
| `is_trusted` | BOOLEAN | Appareil de confiance? |
| `trust_score` | INT | Score confiance (0-100) |
| `last_used_at` | TIMESTAMPTZ | Dernière utilisation |
| `login_count` | INT | Nombre connexions |
| `created_at` | TIMESTAMPTZ | Date première utilisation |

**Contraintes:**
- UNIQUE(user_id, device_id)

---

### 15. **platform_config** - Configuration globale

| Colonne | Type | Description |
|---------|------|-------------|
| `key` | VARCHAR(100) | PK, clé configuration |
| `value` | JSONB | Valeur |
| `description` | TEXT | Description |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |
| `updated_by` | UUID | FK → users |

**Valeurs par défaut:**
```sql
('default_commission_rate', '0.02', 'Taux de commission par défaut (2%)')
('default_commission_fixed', '0', 'Commission fixe par défaut en FCFA')
('otp_expiry_seconds', '300', 'Durée de validité OTP (5 min)')
('otp_max_attempts', '3', 'Nombre max de tentatives OTP')
('jwt_access_expiry_seconds', '900', 'Durée JWT access (15 min)')
('jwt_refresh_expiry_seconds', '604800', 'Durée JWT refresh (7 jours)')
('rate_limit_otp_per_phone', '5', 'Max OTP par téléphone par heure')
('rate_limit_login_attempts', '5', 'Max tentatives login avant blocage')
('lockout_duration_seconds', '1800', 'Durée de blocage (30 min)')
```

---

## 🔗 Relations entre tables

```
users (1) ──< (N) students.parent_user_id
users (1) ──< (N) schools.admin_user_id
users (1) ──< (N) agents.user_id
users (1) ──< (N) payments.paid_by
users (1) ──< (N) payments.recorded_by

schools (1) ──< (N) academic_years
schools (1) ──< (N) classes
schools (1) ──< (N) students
schools (1) ──< (N) agents.school_id

academic_years (1) ──< (N) classes
academic_years (1) ──< (N) tuition_accounts

classes (1) ──< (N) students

students (1) ──< (N) tuition_accounts
students (N) ──> (N) users (via parent_students)

tuition_accounts (1) ──< (N) payment_intents
tuition_accounts (1) ──< (N) payments

payment_intents (1) ──< (1) payments
```

---

## ⚡ Index et performance

### Index principaux

```sql
-- Users
idx_users_phone, idx_users_email, idx_users_role, idx_users_active

-- Schools
idx_schools_code, idx_schools_active, idx_schools_region

-- Students
idx_students_school, idx_students_class, idx_students_matricule
idx_students_parent, idx_students_parent_phone
idx_students_school_class (composite)
idx_students_name_search (full-text)

-- Tuition Accounts
idx_tuition_accounts_student, idx_tuition_accounts_academic_year
idx_tuition_accounts_unpaid, idx_tuition_school_year (composite)

-- Payments
idx_payments_reference, idx_payments_tuition, idx_payments_provider_tx
idx_payments_channel, idx_payments_date, idx_payments_status
idx_payments_date_status (composite)

-- Payment Intents
idx_payment_intents_reference, idx_payment_intents_tuition
idx_payment_intents_status, idx_payment_intents_provider_tx
idx_payment_intents_pending

-- Agents
idx_agents_user, idx_agents_school, idx_agents_code

-- Webhooks
idx_webhooks_provider, idx_webhooks_idempotency
idx_webhooks_status, idx_webhooks_date

-- Audit Logs
idx_audit_user, idx_audit_action, idx_audit_resource, idx_audit_date

-- OTPs
idx_otps_phone, idx_otps_expires, idx_otps_user

-- Devices
idx_devices_user, idx_devices_device
```

---

## 🔧 Triggers et fonctions

### 1. Mise à jour automatique de `updated_at`

```sql
CREATE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Appliqué sur:** users, schools, academic_years, classes, students, tuition_accounts, payment_intents, payments, agents

### 2. Mise à jour du compte scolarité après paiement

```sql
CREATE FUNCTION update_tuition_account_on_payment() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE tuition_accounts
        SET
            paid_amount = paid_amount + NEW.amount,
            last_payment_at = NOW()
        WHERE id = NEW.tuition_account_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger:** AFTER INSERT ON payments

### 3. Gestion des remboursements

```sql
CREATE FUNCTION update_tuition_account_on_refund() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'completed' AND NEW.status = 'refunded' THEN
        UPDATE tuition_accounts
        SET paid_amount = paid_amount - OLD.amount
        WHERE id = OLD.tuition_account_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger:** AFTER UPDATE ON payments

### 4. Fonctions utilitaires

#### Génération référence paiement
```sql
CREATE FUNCTION generate_payment_reference(p_prefix VARCHAR(3) DEFAULT 'PAY')
RETURNS VARCHAR(100) AS $$
DECLARE
    v_timestamp VARCHAR(14);
    v_random VARCHAR(8);
BEGIN
    v_timestamp := TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
    v_random := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    RETURN p_prefix || v_timestamp || v_random;
END;
$$ LANGUAGE plpgsql;
```

#### Calcul commission
```sql
CREATE FUNCTION calculate_commission(
    p_amount INT,
    p_school_id UUID
) RETURNS INT AS $$
DECLARE
    v_rate DECIMAL(5,4);
    v_fixed INT;
    v_type VARCHAR(10);
    v_commission INT;
BEGIN
    SELECT commission_rate, commission_fixed, commission_type
    INTO v_rate, v_fixed, v_type
    FROM schools WHERE id = p_school_id;

    IF v_type = 'fixed' THEN
        v_commission := v_fixed;
    ELSIF v_type = 'rate' THEN
        v_commission := ROUND(p_amount * v_rate);
    ELSE -- both
        v_commission := v_fixed + ROUND(p_amount * v_rate);
    END IF;

    RETURN v_commission;
END;
$$ LANGUAGE plpgsql;
```

#### Log d'audit
```sql
CREATE FUNCTION log_audit_event(
    p_action audit_action,
    p_resource_type VARCHAR(50),
    p_resource_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id, user_role, action, resource_type,
        resource_id, old_values, new_values, metadata
    )
    VALUES (
        auth.uid(),
        auth.user_role(),
        p_action,
        p_resource_type,
        p_resource_id,
        p_old_values,
        p_new_values,
        p_metadata
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔐 Row Level Security (RLS)

### Fonctions helper

```sql
-- Rôle utilisateur
CREATE FUNCTION auth.user_role() RETURNS user_role AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Est admin plateforme?
CREATE FUNCTION auth.is_platform_admin() RETURNS BOOLEAN AS $$
    SELECT role IN ('platform_admin', 'platform_super_admin')
    FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- École de l'utilisateur
CREATE FUNCTION auth.user_school_id() RETURNS UUID AS $$
    SELECT admin_user_id FROM schools WHERE admin_user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Élèves du parent
CREATE FUNCTION auth.parent_student_ids() RETURNS SETOF UUID AS $$
    SELECT student_id FROM parent_students WHERE parent_user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- École de l'agent
CREATE FUNCTION auth.agent_school_id() RETURNS UUID AS $$
    SELECT school_id FROM agents WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### Policies principales

#### USERS
- ✅ Utilisateurs lisent leur profil
- ✅ Admins plateforme lisent tous les profils
- ✅ Admins école lisent parents de leurs élèves
- ✅ Utilisateurs modifient leur profil (champs limités)

#### SCHOOLS
- 🌍 Tous lisent écoles actives (info publique)
- ✅ Admins plateforme accès complet
- ✅ Admins école modifient leur école

#### STUDENTS
- ✅ Parents voient leurs enfants
- ✅ Admins école voient leurs élèves
- ✅ Agents voient élèves de leur école
- ✅ Admins plateforme voient tout
- ✅ Admins école CRUD leurs élèves

#### TUITION_ACCOUNTS
- ✅ Parents voient comptes de leurs enfants
- ✅ Écoles voient comptes de leurs élèves
- ✅ Agents voient comptes de leur périmètre
- ✅ Admins plateforme voient tout

#### PAYMENTS
- ✅ Parents voient paiements de leurs enfants
- ✅ Écoles voient paiements de leurs élèves
- ✅ Agents voient paiements de leur périmètre + ceux qu'ils ont saisis
- ✅ Admins plateforme voient tout

#### PAYMENT_INTENTS
- ✅ Utilisateurs voient leurs intents
- ✅ Écoles voient intents pour leurs élèves
- ✅ Admins plateforme voient tout

#### WEBHOOKS
- 🔒 Seuls admins plateforme accèdent

#### AUDIT_LOGS
- ✅ Utilisateurs voient leurs logs
- ✅ Admins plateforme voient tout
- 📝 Logs append-only (pas de suppression)

#### DEVICES
- ✅ Utilisateurs voient leurs appareils
- ✅ Admins plateforme voient tout

---

## 📊 Vues utilitaires

### 1. v_school_students_payments

Vue consolidée élèves + statut paiement:

```sql
SELECT
    s.id AS student_id,
    s.matricule,
    s.first_name,
    s.last_name,
    s.display_name AS student_name,
    c.name AS class_name,
    sc.id AS school_id,
    sc.name AS school_name,
    ay.label AS academic_year,
    ta.total_amount,
    ta.paid_amount,
    ta.balance,
    ta.is_fully_paid,
    ta.last_payment_at,
    s.parent_phone
FROM students s
JOIN classes c ON c.id = s.class_id
JOIN schools sc ON sc.id = s.school_id
JOIN academic_years ay ON ay.id = c.academic_year_id
LEFT JOIN tuition_accounts ta ON ta.student_id = s.id AND ta.academic_year_id = ay.id
WHERE s.is_active = TRUE;
```

### 2. v_school_payment_stats

Statistiques paiement par école:

```sql
SELECT
    sc.id AS school_id,
    sc.name AS school_name,
    ay.label AS academic_year,
    COUNT(DISTINCT s.id) AS total_students,
    COUNT(DISTINCT CASE WHEN ta.is_fully_paid THEN s.id END) AS fully_paid_students,
    SUM(ta.total_amount) AS total_expected,
    SUM(ta.paid_amount) AS total_collected,
    SUM(ta.balance) AS total_outstanding
FROM schools sc
JOIN students s ON s.school_id = sc.id AND s.is_active = TRUE
JOIN classes c ON c.id = s.class_id
JOIN academic_years ay ON ay.id = c.academic_year_id AND ay.is_current = TRUE
LEFT JOIN tuition_accounts ta ON ta.student_id = s.id AND ta.academic_year_id = ay.id
GROUP BY sc.id, sc.name, ay.label;
```

---

## 🚀 Instructions de migration

### 1. Prérequis

- PostgreSQL 13+ ou Supabase
- Extensions requises:
  ```sql
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  ```

### 2. Ordre d'exécution

1. **Types énumérés** (créer tous les ENUMs d'abord)
2. **Tables** (dans l'ordre des dépendances):
   - users
   - schools
   - academic_years
   - classes
   - students
   - tuition_accounts
   - payment_intents
   - payments
   - agents
   - parent_students
   - payment_otps
   - webhook_events
   - audit_logs
   - devices
   - platform_config
3. **Index**
4. **Fonctions et triggers**
5. **RLS policies**
6. **Vues**
7. **Données de test** (optionnel)

### 3. Scripts de migration

#### Fichiers disponibles:
- `database/schema.sql` - Schéma complet (1229 lignes)
- `database/test-data.sql` - Données de test (708 lignes)

#### Exécution Supabase:

1. **Via SQL Editor:**
   ```sql
   -- Copier-coller le contenu de schema.sql
   -- Puis exécuter
   ```

2. **Via CLI:**
   ```bash
   supabase db reset  # Réinitialise la DB
   supabase db push   # Pousse les migrations
   ```

#### Exécution PostgreSQL classique:

```bash
psql -U postgres -d scolarite_bf < database/schema.sql
psql -U postgres -d scolarite_bf < database/test-data.sql
```

### 4. Vérifications post-migration

```sql
-- Vérifier les tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Vérifier les types enum
SELECT typname FROM pg_type WHERE typcategory = 'E';

-- Vérifier les index
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY indexname;

-- Vérifier les triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Vérifier RLS
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;

-- Compter les données de test
SELECT
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM schools) as schools,
    (SELECT COUNT(*) FROM students) as students,
    (SELECT COUNT(*) FROM payments) as payments;
```

### 5. Configuration Supabase Auth

Pour intégration avec Supabase Auth:

```sql
-- Créer utilisateur dans auth.users
-- Puis créer correspondance dans public.users
```

### 6. Variables d'environnement

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# CinetPay (production)
CINETPAY_API_KEY=your-api-key
CINETPAY_SITE_ID=your-site-id
CINETPAY_SECRET_KEY=your-secret-key

# SMS (pour OTP)
SMS_PROVIDER=your-provider
SMS_API_KEY=your-api-key

# Commission par défaut
DEFAULT_COMMISSION_RATE=0.02
DEFAULT_COMMISSION_FIXED=100
```

---

## 📈 Statistiques du schéma

- **Tables:** 15
- **Types énumérés:** 8
- **Index:** 50+
- **Triggers:** 11
- **Fonctions:** 8
- **Policies RLS:** 25+
- **Vues:** 2

---

## 📞 Support

Pour toute question sur la migration:
1. Consulter `database/schema.sql` pour le schéma complet
2. Consulter `database/test-data.sql` pour les données de test
3. Vérifier les logs d'erreur PostgreSQL
4. Tester avec les données de test avant production

---

**Dernière mise à jour:** 2025-12-06
**Version du schéma:** 1.0.0
