-- ============================================================================
-- SYSTÈME DE PAIEMENT SCOLARITÉ - BURKINA FASO
-- Schéma PostgreSQL pour Supabase
-- ============================================================================

-- Extension pour UUID et crypto
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TYPES ENUMÉRÉS
-- ============================================================================

CREATE TYPE user_role AS ENUM (
    'parent',
    'school_admin',
    'school_accountant',
    'agent',
    'platform_admin',
    'platform_super_admin'
);

CREATE TYPE payment_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled',
    'refunded'
);

CREATE TYPE payment_channel AS ENUM (
    'app_mobile',
    'ussd',
    'agent_cash',
    'agent_momo',
    'bank_transfer',
    'other'
);

CREATE TYPE payment_provider AS ENUM (
    'cinetpay',
    'paygate',
    'corispay',
    'orange_money',
    'moov_money',
    'coris_money',
    'manual'
);

CREATE TYPE academic_year_status AS ENUM (
    'upcoming',
    'active',
    'completed',
    'archived'
);

CREATE TYPE otp_purpose AS ENUM (
    'login',
    'payment_confirmation',
    'phone_verification',
    'password_reset'
);

CREATE TYPE webhook_status AS ENUM (
    'received',
    'processing',
    'processed',
    'failed',
    'duplicate'
);

CREATE TYPE audit_action AS ENUM (
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'payment_initiated',
    'payment_completed',
    'payment_failed',
    'webhook_received',
    'otp_sent',
    'otp_verified',
    'otp_failed',
    'permission_denied',
    'suspicious_activity'
);

-- ============================================================================
-- TABLES PRINCIPALES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- UTILISATEURS
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identifiants
    phone VARCHAR(20) NOT NULL UNIQUE,
    phone_verified BOOLEAN DEFAULT FALSE,
    email VARCHAR(255) UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,
    
    -- Profil
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    
    -- Auth
    password_hash VARCHAR(255), -- NULL pour auth OTP only
    role user_role NOT NULL DEFAULT 'parent',
    
    -- Statut
    is_active BOOLEAN DEFAULT TRUE,
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_reason TEXT,
    blocked_at TIMESTAMPTZ,
    blocked_by UUID REFERENCES users(id),
    
    -- Anti-fraude
    failed_login_attempts INT DEFAULT 0,
    last_failed_login_at TIMESTAMPTZ,
    lockout_until TIMESTAMPTZ,
    
    -- Métadonnées
    preferred_language VARCHAR(5) DEFAULT 'fr',
    timezone VARCHAR(50) DEFAULT 'Africa/Ouagadougou',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    
    -- Contraintes
    CONSTRAINT phone_format CHECK (phone ~ '^\+?[0-9]{8,15}$'),
    CONSTRAINT email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- ----------------------------------------------------------------------------
-- ÉCOLES
-- ----------------------------------------------------------------------------
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identification
    code VARCHAR(20) NOT NULL UNIQUE, -- Code unique pour USSD
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    
    -- Localisation
    region VARCHAR(100),
    province VARCHAR(100),
    commune VARCHAR(100),
    address TEXT,
    
    -- Contact
    phone VARCHAR(20),
    email VARCHAR(255),
    
    -- Configuration
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Commission plateforme (peut être override global)
    commission_rate DECIMAL(5,4) DEFAULT 0.0200, -- 2% par défaut
    commission_fixed INT DEFAULT 0, -- Montant fixe en FCFA
    commission_type VARCHAR(10) DEFAULT 'rate', -- 'rate', 'fixed', 'both'
    
    -- Responsable école
    admin_user_id UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT school_code_format CHECK (code ~ '^[A-Z0-9]{3,20}$'),
    CONSTRAINT commission_rate_range CHECK (commission_rate >= 0 AND commission_rate <= 0.15)
);

CREATE INDEX idx_schools_code ON schools(code);
CREATE INDEX idx_schools_active ON schools(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_schools_region ON schools(region);

-- ----------------------------------------------------------------------------
-- ANNÉES ACADÉMIQUES
-- ----------------------------------------------------------------------------
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Période
    label VARCHAR(20) NOT NULL, -- Ex: "2024-2025"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    status academic_year_status DEFAULT 'upcoming',
    is_current BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT valid_date_range CHECK (end_date > start_date),
    UNIQUE(school_id, label)
);

CREATE INDEX idx_academic_years_school ON academic_years(school_id);
CREATE INDEX idx_academic_years_current ON academic_years(school_id, is_current) WHERE is_current = TRUE;

-- ----------------------------------------------------------------------------
-- CLASSES
-- ----------------------------------------------------------------------------
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    
    -- Identification
    name VARCHAR(100) NOT NULL, -- Ex: "6ème A", "Terminale C"
    level VARCHAR(50), -- Ex: "6ème", "Terminale"
    section VARCHAR(20), -- Ex: "A", "B", "C"
    
    -- Frais de scolarité pour cette classe
    tuition_amount INT NOT NULL, -- Montant total en FCFA
    
    -- Configuration paiement
    allow_installments BOOLEAN DEFAULT TRUE,
    min_installment_amount INT DEFAULT 5000, -- Minimum par paiement
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT positive_tuition CHECK (tuition_amount > 0),
    CONSTRAINT positive_min_installment CHECK (min_installment_amount > 0),
    UNIQUE(school_id, academic_year_id, name)
);

CREATE INDEX idx_classes_school ON classes(school_id);
CREATE INDEX idx_classes_academic_year ON classes(academic_year_id);

-- ----------------------------------------------------------------------------
-- ÉLÈVES
-- ----------------------------------------------------------------------------
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    
    -- Identification
    matricule VARCHAR(50) NOT NULL, -- Unique par école
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    
    -- Informations
    date_of_birth DATE,
    gender VARCHAR(1) CHECK (gender IN ('M', 'F')),
    
    -- Parent/Tuteur principal
    parent_user_id UUID REFERENCES users(id),
    
    -- Contact parent (si pas de compte)
    parent_phone VARCHAR(20),
    parent_name VARCHAR(200),
    
    -- Statut
    is_active BOOLEAN DEFAULT TRUE,
    enrolled_at DATE DEFAULT CURRENT_DATE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    UNIQUE(school_id, matricule)
);

CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_parent ON students(parent_user_id) WHERE parent_user_id IS NOT NULL;
CREATE INDEX idx_students_matricule ON students(school_id, matricule);
CREATE INDEX idx_students_parent_phone ON students(parent_phone) WHERE parent_phone IS NOT NULL;

-- ----------------------------------------------------------------------------
-- COMPTES DE SCOLARITÉ (par élève/année)
-- ----------------------------------------------------------------------------
CREATE TABLE tuition_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    
    -- Montants
    total_amount INT NOT NULL, -- Scolarité totale due
    paid_amount INT DEFAULT 0, -- Total payé
    balance INT GENERATED ALWAYS AS (total_amount - paid_amount) STORED, -- Reliquat
    
    -- Réductions éventuelles
    discount_amount INT DEFAULT 0,
    discount_reason TEXT,
    
    -- Statut
    is_fully_paid BOOLEAN GENERATED ALWAYS AS (paid_amount >= total_amount) STORED,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_payment_at TIMESTAMPTZ,
    
    -- Contraintes
    CONSTRAINT positive_amounts CHECK (total_amount >= 0 AND paid_amount >= 0 AND discount_amount >= 0),
    CONSTRAINT paid_not_exceed_total CHECK (paid_amount <= total_amount + discount_amount),
    UNIQUE(student_id, academic_year_id)
);

CREATE INDEX idx_tuition_accounts_student ON tuition_accounts(student_id);
CREATE INDEX idx_tuition_accounts_academic_year ON tuition_accounts(academic_year_id);
CREATE INDEX idx_tuition_accounts_unpaid ON tuition_accounts(is_fully_paid) WHERE is_fully_paid = FALSE;

-- ----------------------------------------------------------------------------
-- PAYMENT INTENTS (en attente de confirmation PSP)
-- ----------------------------------------------------------------------------
CREATE TABLE payment_intents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Référence unique pour le PSP
    reference VARCHAR(100) NOT NULL UNIQUE,
    
    -- Relations
    tuition_account_id UUID NOT NULL REFERENCES tuition_accounts(id),
    initiated_by UUID NOT NULL REFERENCES users(id),
    
    -- Montant
    amount INT NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',
    
    -- Canal & Provider
    channel payment_channel NOT NULL,
    provider payment_provider NOT NULL,
    
    -- Statut
    status payment_status DEFAULT 'pending',
    
    -- Infos PSP
    provider_transaction_id VARCHAR(255),
    provider_response JSONB,
    
    -- Expiration
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Métadonnées
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    device_id VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Contraintes
    CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX idx_payment_intents_reference ON payment_intents(reference);
CREATE INDEX idx_payment_intents_tuition ON payment_intents(tuition_account_id);
CREATE INDEX idx_payment_intents_status ON payment_intents(status);
CREATE INDEX idx_payment_intents_provider_tx ON payment_intents(provider_transaction_id) WHERE provider_transaction_id IS NOT NULL;
CREATE INDEX idx_payment_intents_pending ON payment_intents(status, expires_at) WHERE status = 'pending';

-- ----------------------------------------------------------------------------
-- PAIEMENTS CONFIRMÉS
-- ----------------------------------------------------------------------------
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Référence unique
    reference VARCHAR(100) NOT NULL UNIQUE,
    
    -- Relations
    tuition_account_id UUID NOT NULL REFERENCES tuition_accounts(id),
    payment_intent_id UUID REFERENCES payment_intents(id),
    
    -- Acteurs
    paid_by UUID REFERENCES users(id), -- NULL si USSD anonyme
    recorded_by UUID REFERENCES users(id), -- Agent qui a saisi
    
    -- Montant
    amount INT NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',
    
    -- Canal & Provider
    channel payment_channel NOT NULL,
    provider payment_provider NOT NULL,
    
    -- Commission plateforme
    commission_amount INT DEFAULT 0,
    commission_rate DECIMAL(5,4),
    net_amount INT GENERATED ALWAYS AS (amount - commission_amount) STORED,
    
    -- Provider details
    provider_transaction_id VARCHAR(255),
    provider_reference VARCHAR(255),
    provider_response JSONB,
    
    -- Statut
    status payment_status DEFAULT 'completed',
    
    -- Infos payeur (pour USSD)
    payer_phone VARCHAR(20),
    payer_name VARCHAR(200),
    
    -- Métadonnées
    metadata JSONB DEFAULT '{}',
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT positive_amounts CHECK (amount > 0 AND commission_amount >= 0)
);

CREATE INDEX idx_payments_reference ON payments(reference);
CREATE INDEX idx_payments_tuition ON payments(tuition_account_id);
CREATE INDEX idx_payments_intent ON payments(payment_intent_id) WHERE payment_intent_id IS NOT NULL;
CREATE INDEX idx_payments_provider_tx ON payments(provider_transaction_id);
CREATE INDEX idx_payments_channel ON payments(channel);
CREATE INDEX idx_payments_date ON payments(created_at DESC);
CREATE INDEX idx_payments_status ON payments(status);

-- ----------------------------------------------------------------------------
-- AGENTS (extension users pour agents)
-- ----------------------------------------------------------------------------
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Rattachement
    school_id UUID REFERENCES schools(id), -- NULL = multi-écoles
    
    -- Identification
    agent_code VARCHAR(20) NOT NULL UNIQUE,
    
    -- Limites
    daily_limit INT DEFAULT 1000000, -- Limite journalière en FCFA
    transaction_limit INT DEFAULT 100000, -- Limite par transaction
    
    -- Statut
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agents_user ON agents(user_id);
CREATE INDEX idx_agents_school ON agents(school_id) WHERE school_id IS NOT NULL;
CREATE INDEX idx_agents_code ON agents(agent_code);

-- ----------------------------------------------------------------------------
-- RELATIONS PARENT-ÉLÈVE
-- ----------------------------------------------------------------------------
CREATE TABLE parent_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    
    relationship VARCHAR(50) DEFAULT 'parent', -- parent, tuteur, etc.
    is_primary BOOLEAN DEFAULT FALSE,
    
    -- Permissions
    can_view_payments BOOLEAN DEFAULT TRUE,
    can_make_payments BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(parent_user_id, student_id)
);

CREATE INDEX idx_parent_students_parent ON parent_students(parent_user_id);
CREATE INDEX idx_parent_students_student ON parent_students(student_id);

-- ----------------------------------------------------------------------------
-- OTP (One-Time Passwords)
-- ----------------------------------------------------------------------------
CREATE TABLE payment_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    user_id UUID REFERENCES users(id),
    phone VARCHAR(20) NOT NULL,
    
    -- OTP (hashé!)
    otp_hash VARCHAR(255) NOT NULL,
    
    purpose otp_purpose NOT NULL,
    
    -- Contexte
    payment_intent_id UUID REFERENCES payment_intents(id),
    
    -- Expiration
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Utilisation
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    
    -- Anti-fraude
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    ip_address INET,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_otps_phone ON payment_otps(phone, purpose, is_used);
CREATE INDEX idx_otps_expires ON payment_otps(expires_at) WHERE is_used = FALSE;
CREATE INDEX idx_otps_user ON payment_otps(user_id) WHERE user_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- WEBHOOKS EVENTS (logs des callbacks PSP)
-- ----------------------------------------------------------------------------
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Provider
    provider payment_provider NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    
    -- Identification
    provider_event_id VARCHAR(255), -- ID unique côté PSP
    idempotency_key VARCHAR(255) NOT NULL, -- Pour éviter doublons
    
    -- Payload
    raw_payload JSONB NOT NULL,
    headers JSONB,
    
    -- Signature
    signature_received VARCHAR(500),
    signature_valid BOOLEAN,
    
    -- Traitement
    status webhook_status DEFAULT 'received',
    processing_error TEXT,
    processed_at TIMESTAMPTZ,
    
    -- Résultat
    payment_intent_id UUID REFERENCES payment_intents(id),
    payment_id UUID REFERENCES payments(id),
    
    -- Métadonnées
    ip_address INET,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contrainte idempotence
    UNIQUE(provider, idempotency_key)
);

CREATE INDEX idx_webhooks_provider ON webhook_events(provider, event_type);
CREATE INDEX idx_webhooks_idempotency ON webhook_events(idempotency_key);
CREATE INDEX idx_webhooks_status ON webhook_events(status);
CREATE INDEX idx_webhooks_date ON webhook_events(created_at DESC);

-- ----------------------------------------------------------------------------
-- AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Acteur
    user_id UUID REFERENCES users(id),
    user_role user_role,
    ip_address INET,
    user_agent TEXT,
    device_id VARCHAR(255),
    
    -- Action
    action audit_action NOT NULL,
    resource_type VARCHAR(50) NOT NULL, -- table/entité concernée
    resource_id UUID,
    
    -- Détails
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}',
    
    -- Contexte
    request_id VARCHAR(100),
    session_id VARCHAR(100),
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at DESC);

-- Partitionnement par mois pour les logs (optionnel mais recommandé)
-- ALTER TABLE audit_logs PARTITION BY RANGE (created_at);

-- ----------------------------------------------------------------------------
-- DEVICES (anti-fraude)
-- ----------------------------------------------------------------------------
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Identification
    device_id VARCHAR(255) NOT NULL, -- Fingerprint ou ID unique
    device_type VARCHAR(50), -- mobile, web, agent
    device_name VARCHAR(200),
    
    -- Infos
    platform VARCHAR(50), -- ios, android, web
    app_version VARCHAR(20),
    os_version VARCHAR(50),
    
    -- Confiance
    is_trusted BOOLEAN DEFAULT FALSE,
    trust_score INT DEFAULT 0, -- 0-100
    
    -- Activité
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    login_count INT DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, device_id)
);

CREATE INDEX idx_devices_user ON devices(user_id);
CREATE INDEX idx_devices_device ON devices(device_id);

-- ----------------------------------------------------------------------------
-- CONFIGURATION GLOBALE
-- ----------------------------------------------------------------------------
CREATE TABLE platform_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Valeurs par défaut
INSERT INTO platform_config (key, value, description) VALUES
('default_commission_rate', '0.02', 'Taux de commission par défaut (2%)'),
('default_commission_fixed', '0', 'Commission fixe par défaut en FCFA'),
('otp_expiry_seconds', '300', 'Durée de validité OTP (5 min)'),
('otp_max_attempts', '3', 'Nombre max de tentatives OTP'),
('jwt_access_expiry_seconds', '900', 'Durée JWT access (15 min)'),
('jwt_refresh_expiry_seconds', '604800', 'Durée JWT refresh (7 jours)'),
('rate_limit_otp_per_phone', '5', 'Max OTP par téléphone par heure'),
('rate_limit_login_attempts', '5', 'Max tentatives login avant blocage'),
('lockout_duration_seconds', '1800', 'Durée de blocage (30 min)');


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Activer RLS sur toutes les tables sensibles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuition_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Helper Functions pour RLS
-- ----------------------------------------------------------------------------

-- Obtenir le rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Vérifier si l'utilisateur est admin plateforme
CREATE OR REPLACE FUNCTION auth.is_platform_admin()
RETURNS BOOLEAN AS $$
    SELECT role IN ('platform_admin', 'platform_super_admin') 
    FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Obtenir l'école de l'utilisateur (pour school_admin/accountant)
CREATE OR REPLACE FUNCTION auth.user_school_id()
RETURNS UUID AS $$
    SELECT admin_user_id FROM schools WHERE admin_user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Obtenir les IDs des étudiants du parent
CREATE OR REPLACE FUNCTION auth.parent_student_ids()
RETURNS SETOF UUID AS $$
    SELECT student_id FROM parent_students WHERE parent_user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Obtenir l'école de l'agent
CREATE OR REPLACE FUNCTION auth.agent_school_id()
RETURNS UUID AS $$
    SELECT school_id FROM agents WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ----------------------------------------------------------------------------
-- POLICIES: USERS
-- ----------------------------------------------------------------------------

-- Les utilisateurs peuvent lire leur propre profil
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (id = auth.uid());

-- Les admins plateforme peuvent tout voir
CREATE POLICY "Platform admins can view all users"
    ON users FOR SELECT
    USING (auth.is_platform_admin());

-- Les admins école peuvent voir les parents de leurs élèves
CREATE POLICY "School admins can view parents of their students"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM schools s
            JOIN students st ON st.school_id = s.id
            JOIN parent_students ps ON ps.student_id = st.id
            WHERE s.admin_user_id = auth.uid()
            AND ps.parent_user_id = users.id
        )
    );

-- Les utilisateurs peuvent mettre à jour leur profil (champs limités)
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ----------------------------------------------------------------------------
-- POLICIES: SCHOOLS
-- ----------------------------------------------------------------------------

-- Tout le monde peut voir les écoles actives (info publique)
CREATE POLICY "Anyone can view active schools"
    ON schools FOR SELECT
    USING (is_active = TRUE);

-- Les admins plateforme peuvent tout faire
CREATE POLICY "Platform admins full access on schools"
    ON schools FOR ALL
    USING (auth.is_platform_admin());

-- Les admins école peuvent mettre à jour leur école
CREATE POLICY "School admins can update their school"
    ON schools FOR UPDATE
    USING (admin_user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- POLICIES: STUDENTS
-- ----------------------------------------------------------------------------

-- Les parents voient leurs enfants
CREATE POLICY "Parents can view their children"
    ON students FOR SELECT
    USING (id IN (SELECT auth.parent_student_ids()));

-- Les admins école voient leurs élèves
CREATE POLICY "School admins view their students"
    ON students FOR SELECT
    USING (
        school_id IN (
            SELECT id FROM schools WHERE admin_user_id = auth.uid()
        )
    );

-- Les agents voient les élèves de leur école
CREATE POLICY "Agents view students of their school"
    ON students FOR SELECT
    USING (
        school_id = auth.agent_school_id()
        OR auth.agent_school_id() IS NULL -- Agent multi-écoles
    );

-- Admins plateforme voient tout
CREATE POLICY "Platform admins view all students"
    ON students FOR SELECT
    USING (auth.is_platform_admin());

-- Les admins école peuvent CRUD leurs élèves
CREATE POLICY "School admins manage their students"
    ON students FOR ALL
    USING (
        school_id IN (
            SELECT id FROM schools WHERE admin_user_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- POLICIES: TUITION_ACCOUNTS
-- ----------------------------------------------------------------------------

-- Parents voient les comptes de leurs enfants
CREATE POLICY "Parents view their children tuition accounts"
    ON tuition_accounts FOR SELECT
    USING (
        student_id IN (SELECT auth.parent_student_ids())
    );

-- École voit les comptes de ses élèves
CREATE POLICY "Schools view their students tuition accounts"
    ON tuition_accounts FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM students WHERE school_id IN (
                SELECT id FROM schools WHERE admin_user_id = auth.uid()
            )
        )
    );

-- Agents voient les comptes de leur périmètre
CREATE POLICY "Agents view tuition accounts in their scope"
    ON tuition_accounts FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM students 
            WHERE school_id = auth.agent_school_id()
               OR auth.agent_school_id() IS NULL
        )
    );

-- Admins plateforme voient tout
CREATE POLICY "Platform admins view all tuition accounts"
    ON tuition_accounts FOR SELECT
    USING (auth.is_platform_admin());

-- ----------------------------------------------------------------------------
-- POLICIES: PAYMENTS
-- ----------------------------------------------------------------------------

-- Parents voient les paiements de leurs enfants
CREATE POLICY "Parents view payments for their children"
    ON payments FOR SELECT
    USING (
        tuition_account_id IN (
            SELECT id FROM tuition_accounts
            WHERE student_id IN (SELECT auth.parent_student_ids())
        )
    );

-- Écoles voient les paiements de leurs élèves
CREATE POLICY "Schools view payments for their students"
    ON payments FOR SELECT
    USING (
        tuition_account_id IN (
            SELECT ta.id FROM tuition_accounts ta
            JOIN students s ON s.id = ta.student_id
            JOIN schools sc ON sc.id = s.school_id
            WHERE sc.admin_user_id = auth.uid()
        )
    );

-- Agents voient les paiements de leur périmètre
CREATE POLICY "Agents view payments in their scope"
    ON payments FOR SELECT
    USING (
        recorded_by = auth.uid()
        OR tuition_account_id IN (
            SELECT ta.id FROM tuition_accounts ta
            JOIN students s ON s.id = ta.student_id
            WHERE s.school_id = auth.agent_school_id()
               OR auth.agent_school_id() IS NULL
        )
    );

-- Admins plateforme voient tout
CREATE POLICY "Platform admins view all payments"
    ON payments FOR SELECT
    USING (auth.is_platform_admin());

-- ----------------------------------------------------------------------------
-- POLICIES: PAYMENT_INTENTS
-- ----------------------------------------------------------------------------

-- Utilisateurs voient leurs propres intents
CREATE POLICY "Users view own payment intents"
    ON payment_intents FOR SELECT
    USING (initiated_by = auth.uid());

-- Écoles voient les intents pour leurs élèves
CREATE POLICY "Schools view payment intents for their students"
    ON payment_intents FOR SELECT
    USING (
        tuition_account_id IN (
            SELECT ta.id FROM tuition_accounts ta
            JOIN students s ON s.id = ta.student_id
            JOIN schools sc ON sc.id = s.school_id
            WHERE sc.admin_user_id = auth.uid()
        )
    );

-- Admins plateforme voient tout
CREATE POLICY "Platform admins view all payment intents"
    ON payment_intents FOR SELECT
    USING (auth.is_platform_admin());

-- ----------------------------------------------------------------------------
-- POLICIES: WEBHOOK_EVENTS
-- ----------------------------------------------------------------------------

-- Seuls les admins plateforme voient les webhooks
CREATE POLICY "Only platform admins view webhooks"
    ON webhook_events FOR SELECT
    USING (auth.is_platform_admin());

-- ----------------------------------------------------------------------------
-- POLICIES: AUDIT_LOGS
-- ----------------------------------------------------------------------------

-- Utilisateurs voient leurs propres logs
CREATE POLICY "Users view own audit logs"
    ON audit_logs FOR SELECT
    USING (user_id = auth.uid());

-- Admins plateforme voient tout
CREATE POLICY "Platform admins view all audit logs"
    ON audit_logs FOR SELECT
    USING (auth.is_platform_admin());

-- Les logs sont append-only (pas de delete/update)
CREATE POLICY "Audit logs are append only"
    ON audit_logs FOR INSERT
    WITH CHECK (TRUE);

-- ----------------------------------------------------------------------------
-- POLICIES: DEVICES
-- ----------------------------------------------------------------------------

-- Utilisateurs voient leurs propres devices
CREATE POLICY "Users view own devices"
    ON devices FOR SELECT
    USING (user_id = auth.uid());

-- Admins plateforme voient tout
CREATE POLICY "Platform admins view all devices"
    ON devices FOR SELECT
    USING (auth.is_platform_admin());


-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur toutes les tables avec updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academic_years_updated_at BEFORE UPDATE ON academic_years
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tuition_accounts_updated_at BEFORE UPDATE ON tuition_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_intents_updated_at BEFORE UPDATE ON payment_intents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Fonction pour mettre à jour le tuition_account après paiement
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_tuition_account_on_payment()
RETURNS TRIGGER AS $$
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

CREATE TRIGGER trigger_update_tuition_on_payment
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_tuition_account_on_payment();

-- Trigger pour les remboursements
CREATE OR REPLACE FUNCTION update_tuition_account_on_refund()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'completed' AND NEW.status = 'refunded' THEN
        UPDATE tuition_accounts
        SET paid_amount = paid_amount - OLD.amount
        WHERE id = OLD.tuition_account_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tuition_on_refund
    AFTER UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_tuition_account_on_refund();

-- ----------------------------------------------------------------------------
-- Fonction d'audit automatique
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_audit_event(
    p_action audit_action,
    p_resource_type VARCHAR(50),
    p_resource_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
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

-- ----------------------------------------------------------------------------
-- Fonction pour générer une référence unique
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_payment_reference(p_prefix VARCHAR(3) DEFAULT 'PAY')
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

-- ----------------------------------------------------------------------------
-- Fonction pour calculer la commission
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_commission(
    p_amount INT,
    p_school_id UUID
)
RETURNS INT AS $$
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


-- ============================================================================
-- VUES UTILITAIRES
-- ============================================================================

-- Vue pour le dashboard école : élèves avec statut paiement
CREATE OR REPLACE VIEW v_school_students_payments AS
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

-- Vue pour les statistiques de paiement par école
CREATE OR REPLACE VIEW v_school_payment_stats AS
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


-- ============================================================================
-- INDEX ADDITIONNELS POUR PERFORMANCE
-- ============================================================================

-- Index composites pour les requêtes fréquentes
CREATE INDEX idx_students_school_class ON students(school_id, class_id) WHERE is_active = TRUE;
CREATE INDEX idx_payments_date_status ON payments(created_at DESC, status);
CREATE INDEX idx_tuition_school_year ON tuition_accounts(academic_year_id, student_id);

-- Index pour recherche full-text sur les noms (optionnel)
CREATE INDEX idx_students_name_search ON students USING gin(to_tsvector('french', first_name || ' ' || last_name));


-- ============================================================================
-- GRANTS POUR SERVICE ROLE
-- ============================================================================

-- Le service_role de Supabase a accès complet, mais on peut restreindre si besoin
-- Ces grants sont généralement gérés automatiquement par Supabase


-- ============================================================================
-- DONNÉES DE TEST (à exécuter uniquement en environnement de dev)
-- ============================================================================

-- Décommenter pour insérer des données de test
/*
INSERT INTO users (phone, first_name, last_name, role) VALUES
('+22670000001', 'Admin', 'Plateforme', 'platform_super_admin'),
('+22670000002', 'Directeur', 'École A', 'school_admin'),
('+22670000003', 'Parent', 'Test', 'parent'),
('+22670000004', 'Agent', 'Terrain', 'agent');

INSERT INTO schools (code, name, region, admin_user_id) 
SELECT 'LYCA001', 'Lycée Exemple A', 'Centre', id FROM users WHERE phone = '+22670000002';
*/
