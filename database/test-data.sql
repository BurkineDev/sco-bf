-- ============================================================================
-- SCRIPT DE DONNÉES DE TEST - Dashboard School
-- ============================================================================
-- Ce script crée toutes les données nécessaires pour tester le dashboard
-- Exécuter ce script dans le SQL Editor de Supabase
-- ============================================================================

-- Nettoyer les données existantes (ATTENTION: cela supprime tout!)
-- Décommenter si vous voulez repartir de zéro
-- TRUNCATE users, schools, academic_years, classes, students, tuition_accounts, payments, agents CASCADE;

-- ============================================================================
-- 1. CRÉER UNE ÉCOLE
-- ============================================================================
INSERT INTO schools (
  id,
  code,
  name,
  short_name,
  region,
  province,
  commune,
  address,
  phone,
  email,
  commission_rate,
  commission_fixed,
  is_active
) VALUES (
  gen_random_uuid(),
  'SCL-BF-001',
  'Complexe Scolaire Excellence',
  'CS Excellence',
  'Centre',
  'Kadiogo',
  'Ouagadougou',
  'Secteur 15, Avenue Kwame Nkrumah',
  '+22670123456',
  'contact@cs-excellence.bf',
  0.02,  -- 2% de commission
  100,   -- 100 FCFA fixe
  true
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active
RETURNING id;

-- Récupérer l'ID de l'école (pour les prochaines insertions)
-- Stocker dans une variable temporaire
DO $$
DECLARE
  v_school_id uuid;
  v_year_id uuid;
  v_class_6a_id uuid;
  v_class_5b_id uuid;
  v_class_4c_id uuid;
  v_user_admin_id uuid;
  v_user_parent1_id uuid;
  v_user_parent2_id uuid;
  v_student1_id uuid;
  v_student2_id uuid;
  v_student3_id uuid;
  v_student4_id uuid;
  v_student5_id uuid;
  v_tuition1_id uuid;
  v_tuition2_id uuid;
  v_tuition3_id uuid;
  v_agent_id uuid;
BEGIN

-- ============================================================================
-- 2. RÉCUPÉRER L'ID DE L'ÉCOLE
-- ============================================================================
SELECT id INTO v_school_id FROM schools WHERE code = 'SCL-BF-001';

-- ============================================================================
-- 3. CRÉER UN UTILISATEUR ADMINISTRATEUR
-- ============================================================================
INSERT INTO users (
  id,
  phone,
  email,
  first_name,
  last_name,
  role,
  phone_verified,
  is_active
) VALUES (
  gen_random_uuid(),
  '+22670123456',
  'admin@cs-excellence.bf',
  'Amadou',
  'Traoré',
  'school_admin',
  true,
  true
)
ON CONFLICT (phone) DO UPDATE SET
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active
RETURNING id INTO v_user_admin_id;

-- Lier l'admin à l'école
UPDATE schools SET admin_user_id = v_user_admin_id WHERE id = v_school_id;

-- ============================================================================
-- 4. CRÉER UNE ANNÉE ACADÉMIQUE
-- ============================================================================
INSERT INTO academic_years (
  id,
  school_id,
  label,
  start_date,
  end_date,
  status,
  is_current
) VALUES (
  gen_random_uuid(),
  v_school_id,
  '2024-2025',
  '2024-09-01',
  '2025-07-31',
  'active',
  true
)
RETURNING id INTO v_year_id;

-- ============================================================================
-- 5. CRÉER DES CLASSES
-- ============================================================================

-- Classe 6ème A
INSERT INTO classes (
  id,
  school_id,
  academic_year_id,
  name,
  level,
  section,
  tuition_amount,
  allow_installments,
  min_installment_amount
) VALUES (
  gen_random_uuid(),
  v_school_id,
  v_year_id,
  '6ème A',
  '6ème',
  'A',
  150000,
  true,
  50000
)
RETURNING id INTO v_class_6a_id;

-- Classe 5ème B
INSERT INTO classes (
  id,
  school_id,
  academic_year_id,
  name,
  level,
  section,
  tuition_amount,
  allow_installments,
  min_installment_amount
) VALUES (
  gen_random_uuid(),
  v_school_id,
  v_year_id,
  '5ème B',
  '5ème',
  'B',
  160000,
  true,
  50000
)
RETURNING id INTO v_class_5b_id;

-- Classe 4ème C
INSERT INTO classes (
  id,
  school_id,
  academic_year_id,
  name,
  level,
  section,
  tuition_amount,
  allow_installments,
  min_installment_amount
) VALUES (
  gen_random_uuid(),
  v_school_id,
  v_year_id,
  '4ème C',
  '4ème',
  'C',
  170000,
  true,
  50000
)
RETURNING id INTO v_class_4c_id;

-- ============================================================================
-- 6. CRÉER DES UTILISATEURS PARENTS
-- ============================================================================

-- Parent 1
INSERT INTO users (
  id,
  phone,
  first_name,
  last_name,
  role,
  phone_verified,
  is_active
) VALUES (
  gen_random_uuid(),
  '+22670234567',
  'Fatimata',
  'Ouédraogo',
  'parent',
  true,
  true
)
RETURNING id INTO v_user_parent1_id;

-- Parent 2
INSERT INTO users (
  id,
  phone,
  first_name,
  last_name,
  role,
  phone_verified,
  is_active
) VALUES (
  gen_random_uuid(),
  '+22670345678',
  'Ibrahim',
  'Kaboré',
  'parent',
  true,
  true
)
RETURNING id INTO v_user_parent2_id;

-- ============================================================================
-- 7. CRÉER DES ÉLÈVES
-- ============================================================================

-- Élève 1 - 6ème A
INSERT INTO students (
  id,
  school_id,
  class_id,
  matricule,
  first_name,
  last_name,
  display_name,
  date_of_birth,
  gender,
  parent_phone,
  parent_name,
  is_active
) VALUES (
  gen_random_uuid(),
  v_school_id,
  v_class_6a_id,
  '2024-001',
  'Jean',
  'Ouédraogo',
  'Jean Ouédraogo',
  '2012-05-15',
  'M',
  '+22670234567',
  'Mme Fatimata Ouédraogo',
  true
)
RETURNING id INTO v_student1_id;

-- Élève 2 - 6ème A
INSERT INTO students (
  id,
  school_id,
  class_id,
  matricule,
  first_name,
  last_name,
  display_name,
  date_of_birth,
  gender,
  parent_phone,
  parent_name,
  is_active
) VALUES (
  gen_random_uuid(),
  v_school_id,
  v_class_6a_id,
  '2024-002',
  'Marie',
  'Kaboré',
  'Marie Kaboré',
  '2012-08-22',
  'F',
  '+22670345678',
  'M. Ibrahim Kaboré',
  true
)
RETURNING id INTO v_student2_id;

-- Élève 3 - 5ème B
INSERT INTO students (
  id,
  school_id,
  class_id,
  matricule,
  first_name,
  last_name,
  display_name,
  date_of_birth,
  gender,
  parent_phone,
  parent_name,
  is_active
) VALUES (
  gen_random_uuid(),
  v_school_id,
  v_class_5b_id,
  '2024-003',
  'Paul',
  'Sawadogo',
  'Paul Sawadogo',
  '2011-03-10',
  'M',
  '+22670456789',
  'M. André Sawadogo',
  true
)
RETURNING id INTO v_student3_id;

-- Élève 4 - 5ème B
INSERT INTO students (
  id,
  school_id,
  class_id,
  matricule,
  first_name,
  last_name,
  display_name,
  date_of_birth,
  gender,
  parent_phone,
  parent_name,
  is_active
) VALUES (
  gen_random_uuid(),
  v_school_id,
  v_class_5b_id,
  '2024-004',
  'Sophie',
  'Traoré',
  'Sophie Traoré',
  '2011-11-30',
  'F',
  '+22670567890',
  'Mme Aminata Traoré',
  true
)
RETURNING id INTO v_student4_id;

-- Élève 5 - 4ème C
INSERT INTO students (
  id,
  school_id,
  class_id,
  matricule,
  first_name,
  last_name,
  display_name,
  date_of_birth,
  gender,
  parent_phone,
  parent_name,
  is_active
) VALUES (
  gen_random_uuid(),
  v_school_id,
  v_class_4c_id,
  '2024-005',
  'Abdoulaye',
  'Diallo',
  'Abdoulaye Diallo',
  '2010-07-18',
  'M',
  '+22670678901',
  'M. Boubacar Diallo',
  true
)
RETURNING id INTO v_student5_id;

-- ============================================================================
-- 8. CRÉER DES COMPTES DE SCOLARITÉ (TUITION ACCOUNTS)
-- ============================================================================

-- Compte pour Jean Ouédraogo - Complètement payé
INSERT INTO tuition_accounts (
  id,
  student_id,
  academic_year_id,
  total_amount,
  paid_amount,
  balance,
  is_fully_paid
) VALUES (
  gen_random_uuid(),
  v_student1_id,
  v_year_id,
  150000,
  150000,
  0,
  true
)
RETURNING id INTO v_tuition1_id;

-- Compte pour Marie Kaboré - Partiellement payé
INSERT INTO tuition_accounts (
  id,
  student_id,
  academic_year_id,
  total_amount,
  paid_amount,
  balance,
  is_fully_paid
) VALUES (
  gen_random_uuid(),
  v_student2_id,
  v_year_id,
  150000,
  100000,
  50000,
  false
)
RETURNING id INTO v_tuition2_id;

-- Compte pour Paul Sawadogo - Partiellement payé
INSERT INTO tuition_accounts (
  id,
  student_id,
  academic_year_id,
  total_amount,
  paid_amount,
  balance,
  is_fully_paid
) VALUES (
  gen_random_uuid(),
  v_student3_id,
  v_year_id,
  160000,
  80000,
  80000,
  false
)
RETURNING id INTO v_tuition3_id;

-- Compte pour Sophie Traoré - Non payé
INSERT INTO tuition_accounts (
  student_id,
  academic_year_id,
  total_amount,
  paid_amount,
  balance,
  is_fully_paid
) VALUES (
  v_student4_id,
  v_year_id,
  160000,
  0,
  160000,
  false
);

-- Compte pour Abdoulaye Diallo - Partiellement payé
INSERT INTO tuition_accounts (
  student_id,
  academic_year_id,
  total_amount,
  paid_amount,
  balance,
  is_fully_paid
) VALUES (
  v_student5_id,
  v_year_id,
  170000,
  50000,
  120000,
  false
);

-- ============================================================================
-- 9. CRÉER DES PAIEMENTS
-- ============================================================================

-- Paiement 1 - Jean Ouédraogo (1er versement)
INSERT INTO payments (
  tuition_account_id,
  reference,
  amount,
  commission_amount,
  net_amount,
  currency,
  channel,
  provider,
  status,
  payer_name,
  payer_phone,
  created_at
) VALUES (
  v_tuition1_id,
  'PAY-2024-001',
  100000,
  2100,  -- 2% + 100 FCFA
  97900,
  'XOF',
  'app_mobile',
  'orange_money',
  'completed',
  'Fatimata Ouédraogo',
  '+22670234567',
  NOW() - INTERVAL '10 days'
);

-- Paiement 2 - Jean Ouédraogo (2ème versement - solde)
INSERT INTO payments (
  tuition_account_id,
  reference,
  amount,
  commission_amount,
  net_amount,
  currency,
  channel,
  provider,
  status,
  payer_name,
  payer_phone,
  created_at
) VALUES (
  v_tuition1_id,
  'PAY-2024-002',
  50000,
  1100,
  48900,
  'XOF',
  'app_mobile',
  'moov_money',
  'completed',
  'Fatimata Ouédraogo',
  '+22670234567',
  NOW() - INTERVAL '5 days'
);

-- Paiement 3 - Marie Kaboré
INSERT INTO payments (
  tuition_account_id,
  reference,
  amount,
  commission_amount,
  net_amount,
  currency,
  channel,
  provider,
  status,
  payer_name,
  payer_phone,
  created_at
) VALUES (
  v_tuition2_id,
  'PAY-2024-003',
  100000,
  2100,
  97900,
  'XOF',
  'ussd',
  'orange_money',
  'completed',
  'Ibrahim Kaboré',
  '+22670345678',
  NOW() - INTERVAL '7 days'
);

-- Paiement 4 - Paul Sawadogo
INSERT INTO payments (
  tuition_account_id,
  reference,
  amount,
  commission_amount,
  net_amount,
  currency,
  channel,
  provider,
  status,
  payer_name,
  payer_phone,
  created_at
) VALUES (
  v_tuition3_id,
  'PAY-2024-004',
  80000,
  1700,
  78300,
  'XOF',
  'app_mobile',
  'orange_money',
  'completed',
  'André Sawadogo',
  '+22670456789',
  NOW() - INTERVAL '3 days'
);

-- Paiement 5 - Abdoulaye Diallo
INSERT INTO payments (
  tuition_account_id,
  reference,
  amount,
  commission_amount,
  net_amount,
  currency,
  channel,
  provider,
  status,
  payer_name,
  payer_phone,
  created_at
) VALUES (
  (SELECT id FROM tuition_accounts WHERE student_id = v_student5_id),
  'PAY-2024-005',
  50000,
  1100,
  48900,
  'XOF',
  'agent_cash',
  'manual',
  'completed',
  'Boubacar Diallo',
  '+22670678901',
  NOW() - INTERVAL '1 day'
);

-- ============================================================================
-- 10. CRÉER UN AGENT
-- ============================================================================

-- Créer l'utilisateur de l'agent
INSERT INTO users (
  id,
  phone,
  first_name,
  last_name,
  role,
  phone_verified,
  is_active
) VALUES (
  gen_random_uuid(),
  '+22670111222',
  'Issouf',
  'Compaoré',
  'agent',
  true,
  true
)
RETURNING id INTO v_agent_id;

-- Créer l'agent
INSERT INTO agents (
  user_id,
  agent_code,
  school_id,
  daily_limit,
  transaction_limit,
  is_active
) VALUES (
  v_agent_id,
  'AGT-001',
  v_school_id,
  2000000,  -- 2M FCFA par jour
  500000,   -- 500k FCFA par transaction
  true
);

-- ============================================================================
-- RÉSUMÉ DES DONNÉES CRÉÉES
-- ============================================================================
RAISE NOTICE '✅ Données de test créées avec succès !';
RAISE NOTICE '📊 Résumé:';
RAISE NOTICE '  - École: Complexe Scolaire Excellence (%)' , v_school_id;
RAISE NOTICE '  - Admin: Amadou Traoré (+22670123456)';
RAISE NOTICE '  - Année académique: 2024-2025';
RAISE NOTICE '  - Classes: 3 (6ème A, 5ème B, 4ème C)';
RAISE NOTICE '  - Élèves: 5';
RAISE NOTICE '  - Paiements: 5 (380,000 FCFA collectés)';
RAISE NOTICE '  - Agent: Issouf Compaoré (AGT-001)';
RAISE NOTICE '';
RAISE NOTICE '🔐 Pour vous connecter au dashboard:';
RAISE NOTICE '  - Téléphone: +22670123456';
RAISE NOTICE '  - Rôle: school_admin';

END $$;
