# 📐 DIAGRAMME ENTITÉ-RELATION - SYSTÈME SCOLARITÉ BF

## Diagramme principal (Mermaid ERD)

```mermaid
erDiagram
    USERS ||--o{ SCHOOLS : "administre"
    USERS ||--o{ AGENTS : "est_agent"
    USERS ||--o{ PARENT_STUDENTS : "est_parent"
    USERS ||--o{ PAYMENT_INTENTS : "initie"
    USERS ||--o{ PAYMENTS : "effectue"
    USERS ||--o{ DEVICES : "utilise"

    SCHOOLS ||--o{ ACADEMIC_YEARS : "contient"
    SCHOOLS ||--o{ CLASSES : "offre"
    SCHOOLS ||--o{ STUDENTS : "inscrit"
    SCHOOLS ||--o{ AGENTS : "emploie"

    ACADEMIC_YEARS ||--o{ CLASSES : "organise"
    ACADEMIC_YEARS ||--o{ TUITION_ACCOUNTS : "concerne"

    CLASSES ||--o{ STUDENTS : "regroupe"

    STUDENTS ||--o{ TUITION_ACCOUNTS : "possède"
    STUDENTS ||--o{ PARENT_STUDENTS : "lié_à"

    TUITION_ACCOUNTS ||--o{ PAYMENT_INTENTS : "pour"
    TUITION_ACCOUNTS ||--o{ PAYMENTS : "paye"

    PAYMENT_INTENTS ||--o| PAYMENTS : "devient"
    PAYMENT_INTENTS ||--o{ PAYMENT_OTPS : "nécessite"

    WEBHOOK_EVENTS ||--o| PAYMENT_INTENTS : "concerne"
    WEBHOOK_EVENTS ||--o| PAYMENTS : "confirme"

    USERS {
        uuid id PK
        varchar phone UK
        varchar email UK
        varchar first_name
        varchar last_name
        varchar display_name
        user_role role
        boolean is_active
        timestamptz created_at
    }

    SCHOOLS {
        uuid id PK
        varchar code UK
        varchar name
        varchar region
        uuid admin_user_id FK
        decimal commission_rate
        int commission_fixed
        boolean is_active
    }

    ACADEMIC_YEARS {
        uuid id PK
        uuid school_id FK
        varchar label
        date start_date
        date end_date
        academic_year_status status
        boolean is_current
    }

    CLASSES {
        uuid id PK
        uuid school_id FK
        uuid academic_year_id FK
        varchar name
        int tuition_amount
        boolean allow_installments
        int min_installment_amount
    }

    STUDENTS {
        uuid id PK
        uuid school_id FK
        uuid class_id FK
        varchar matricule
        varchar first_name
        varchar last_name
        varchar display_name
        date date_of_birth
        char gender
        uuid parent_user_id FK
        varchar parent_phone
        boolean is_active
    }

    TUITION_ACCOUNTS {
        uuid id PK
        uuid student_id FK
        uuid academic_year_id FK
        int total_amount
        int paid_amount
        int balance
        boolean is_fully_paid
        timestamptz last_payment_at
    }

    PAYMENT_INTENTS {
        uuid id PK
        varchar reference UK
        uuid tuition_account_id FK
        uuid initiated_by FK
        int amount
        payment_channel channel
        payment_provider provider
        payment_status status
        timestamptz expires_at
    }

    PAYMENTS {
        uuid id PK
        varchar reference UK
        uuid tuition_account_id FK
        uuid payment_intent_id FK
        uuid paid_by FK
        int amount
        int commission_amount
        int net_amount
        payment_channel channel
        payment_provider provider
        payment_status status
        timestamptz created_at
    }

    AGENTS {
        uuid id PK
        uuid user_id FK UK
        uuid school_id FK
        varchar agent_code UK
        int daily_limit
        int transaction_limit
        boolean is_active
    }

    PARENT_STUDENTS {
        uuid id PK
        uuid parent_user_id FK
        uuid student_id FK
        varchar relationship
        boolean is_primary
        boolean can_make_payments
    }

    PAYMENT_OTPS {
        uuid id PK
        uuid user_id FK
        varchar phone
        varchar otp_hash
        otp_purpose purpose
        uuid payment_intent_id FK
        timestamptz expires_at
        boolean is_used
    }

    WEBHOOK_EVENTS {
        uuid id PK
        payment_provider provider
        varchar event_type
        varchar idempotency_key UK
        jsonb raw_payload
        webhook_status status
        uuid payment_intent_id FK
        uuid payment_id FK
    }

    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        audit_action action
        varchar resource_type
        uuid resource_id
        jsonb old_values
        jsonb new_values
        timestamptz created_at
    }

    DEVICES {
        uuid id PK
        uuid user_id FK
        varchar device_id
        varchar platform
        boolean is_trusted
        int trust_score
        timestamptz last_used_at
    }
```

---

## Diagramme des flux de paiement

```mermaid
graph TB
    subgraph "1. Initiation"
        A[Parent/Agent] -->|Initie| B[Payment Intent]
        B -->|Génère| C[Référence unique]
    end

    subgraph "2. Vérification"
        B -->|Demande| D[OTP]
        D -->|Envoi SMS| E[Téléphone]
        E -->|Saisit code| F[Vérification]
    end

    subgraph "3. Traitement PSP"
        F -->|Valid| G[Appel API PSP]
        G -->|CinetPay/Orange/Moov| H[Traitement]
        H -->|Callback| I[Webhook]
    end

    subgraph "4. Confirmation"
        I -->|Valide| J[Créer Payment]
        J -->|Trigger| K[Mise à jour Tuition Account]
        K -->|Calcul| L[Balance + Statut]
    end

    subgraph "5. Audit & Notif"
        J -->|Log| M[Audit Log]
        J -->|Notif| N[Parent SMS]
        J -->|Reçu| O[Génération PDF]
    end

    style B fill:#f9f,stroke:#333
    style J fill:#9f9,stroke:#333
    style I fill:#ff9,stroke:#333
```

---

## Diagramme des rôles et permissions

```mermaid
graph LR
    subgraph "Super Admin"
        SA[Platform Super Admin]
        SA -->|Accès total| ALL[Toutes données]
    end

    subgraph "Admin Plateforme"
        PA[Platform Admin]
        PA -->|Gestion| SCHOOLS[Écoles]
        PA -->|Monitoring| PAYMENTS[Paiements]
        PA -->|Config| CONFIG[Configuration]
    end

    subgraph "École"
        SCHOOLADM[School Admin]
        SCHOOLACC[School Accountant]
        SCHOOLADM -->|CRUD| STUDENTS[Élèves de son école]
        SCHOOLADM -->|Lecture| TUITION[Comptes scolarité]
        SCHOOLACC -->|Lecture| PAYMENTS2[Paiements école]
        SCHOOLACC -->|Export| REPORTS[Rapports]
    end

    subgraph "Agent"
        AGT[Agent]
        AGT -->|Collecte| CASHPAY[Paiements cash/momo]
        AGT -->|Lecture| STUDATA[Données élèves]
    end

    subgraph "Parent"
        PAR[Parent]
        PAR -->|Lecture| CHILDREN[Ses enfants]
        PAR -->|Paiement| CHILDTUITION[Scolarité enfants]
        PAR -->|Historique| PAYHIST[Ses paiements]
    end

    style SA fill:#f00,color:#fff
    style PA fill:#f90,color:#fff
    style SCHOOLADM fill:#09f,color:#fff
    style AGT fill:#0c0,color:#fff
    style PAR fill:#90f,color:#fff
```

---

## Flux de données principal

```mermaid
sequenceDiagram
    participant P as Parent
    participant APP as App Mobile
    participant API as Supabase API
    participant DB as PostgreSQL
    participant PSP as CinetPay/Orange
    participant SMS as Service SMS

    P->>APP: Sélectionne enfant
    APP->>API: GET /students (RLS filtré)
    API->>DB: SELECT students WHERE parent
    DB-->>API: Données élève
    API-->>APP: Enfants + Tuition
    APP-->>P: Affiche balance

    P->>APP: Initie paiement 50k
    APP->>API: POST /payment-intents
    API->>DB: INSERT payment_intent
    DB-->>API: Intent créé
    API->>SMS: Envoie OTP
    SMS-->>P: SMS avec code

    P->>APP: Saisit OTP
    APP->>API: POST /verify-otp
    API->>DB: Vérifie OTP
    DB-->>API: OTP valide

    API->>PSP: Demande paiement
    PSP-->>API: URL paiement
    API-->>APP: Redirect PSP
    APP-->>P: Page paiement

    P->>PSP: Confirme paiement
    PSP->>API: Webhook callback
    API->>DB: INSERT payment
    DB->>DB: Trigger: UPDATE tuition_account
    DB->>DB: INSERT audit_log
    DB-->>API: Payment créé
    API->>SMS: Envoie confirmation
    SMS-->>P: SMS confirmation
```

---

## Architecture de sécurité (RLS)

```mermaid
graph TD
    subgraph "Row Level Security"
        REQ[Requête SQL]
        REQ -->|auth.uid()| CHECKUSER[Vérif utilisateur]
        CHECKUSER -->|auth.user_role()| CHECKROLE[Vérif rôle]
        CHECKROLE -->|Policies| FILTER[Filtrage RLS]

        FILTER -->|Parent| FILTERP[Ses enfants seulement]
        FILTER -->|School Admin| FILTERS[Son école seulement]
        FILTER -->|Agent| FILTERA[École agent + saisies]
        FILTER -->|Platform Admin| FILTERNONE[Aucun filtre]

        FILTERP --> RESULT[Résultat filtré]
        FILTERS --> RESULT
        FILTERA --> RESULT
        FILTERNONE --> RESULT
    end

    style CHECKUSER fill:#f9f
    style CHECKROLE fill:#ff9
    style RESULT fill:#9f9
```

---

## Schéma anti-fraude

```mermaid
graph TB
    subgraph "Détection Fraude"
        LOGIN[Tentative connexion]
        LOGIN --> CHECKDEVICE[Device fingerprint]
        CHECKDEVICE -->|Nouveau| NEWDEV[Créer device]
        CHECKDEVICE -->|Connu| CHECKTRST[Vérif trust score]

        CHECKTRST -->|Faible| OTP[OTP requis]
        CHECKTRST -->|Élevé| ALLOW[Autoriser]

        LOGIN --> CHECKLOCKOUT[Vérif lockout]
        CHECKLOCKOUT -->|Bloqué| DENY[Refuser + log]
        CHECKLOCKOUT -->|OK| CHECKFAIL[Tentatives échouées]

        CHECKFAIL -->|< 5| ALLOW2[Autoriser]
        CHECKFAIL -->|>= 5| LOCK[Bloquer 30min]

        DENY --> AUDIT[Audit log]
        LOCK --> AUDIT
    end

    subgraph "Suivi Paiements"
        PAYMENT[Paiement]
        PAYMENT --> CHECKLIMIT[Vérif limites agent]
        CHECKLIMIT -->|Dépassé| BLOCK[Bloquer]
        CHECKLIMIT -->|OK| CHECKDUP[Vérif doublon]
        CHECKDUP -->|Doublon| BLOCK
        CHECKDUP -->|Unique| PROCESS[Traiter]

        PROCESS --> LOGPAY[Log audit]
        BLOCK --> ALERT[Alerte admin]
    end

    style DENY fill:#f00,color:#fff
    style LOCK fill:#f90,color:#fff
    style ALLOW fill:#0f0,color:#fff
    style BLOCK fill:#f00,color:#fff
```

---

## Modèle de données optimisé

```mermaid
graph LR
    subgraph "Tables Hot (Fréquentes)"
        USERS[Users<br/>Index: phone, email, role]
        STUDENTS[Students<br/>Index: matricule, parent, school]
        TUITION[Tuition Accounts<br/>Index: student, balance]
        PAYMENTS[Payments<br/>Index: date, reference, status]
    end

    subgraph "Tables Warm (Moyennes)"
        SCHOOLS[Schools<br/>Index: code, region]
        CLASSES[Classes<br/>Index: school, year]
        INTENTS[Payment Intents<br/>Index: status, expires]
    end

    subgraph "Tables Cold (Archive)"
        AUDIT[Audit Logs<br/>Partitionné par mois]
        WEBHOOKS[Webhook Events<br/>Partitionné par mois]
        OTPS[Payment OTPs<br/>TTL cleanup]
    end

    subgraph "Optimisations"
        IDX[Index composites]
        PART[Partitionnement]
        CACHE[Vues matérialisées]
        TSVEC[Full-text search]
    end

    USERS -.->|Performance| IDX
    AUDIT -.->|Archive| PART
    STUDENTS -.->|Recherche| TSVEC

    style USERS fill:#f00,color:#fff
    style STUDENTS fill:#f00,color:#fff
    style TUITION fill:#f00,color:#fff
    style PAYMENTS fill:#f00,color:#fff
```

---

## Cycle de vie d'un paiement

```mermaid
stateDiagram-v2
    [*] --> Pending: Paiement initié

    Pending --> Processing: PSP accepte
    Pending --> Failed: Timeout/Refus
    Pending --> Cancelled: Annulé par user

    Processing --> Completed: Callback success
    Processing --> Failed: Callback error

    Completed --> Refunded: Remboursement

    Failed --> [*]
    Cancelled --> [*]
    Refunded --> [*]
    Completed --> [*]

    note right of Completed
        Trigger: update_tuition_account
        - paid_amount += amount
        - last_payment_at = NOW()
        - recalcul balance
    end note

    note right of Refunded
        Trigger: update_tuition_on_refund
        - paid_amount -= amount
        - recalcul balance
    end note
```

---

## Hiérarchie des données

```mermaid
graph TD
    PLATFORM[Plateforme]
    PLATFORM -->|1:N| SCHOOLS[Écoles]

    SCHOOLS -->|1:N| YEARS[Années Académiques]
    SCHOOLS -->|1:N| CLASSES[Classes]
    SCHOOLS -->|1:N| STUDENTS[Élèves]
    SCHOOLS -->|1:N| AGENTS[Agents]

    YEARS -->|1:N| CLASSES2[Classes année]
    YEARS -->|1:N| TUITION[Comptes scolarité]

    CLASSES -->|1:N| STUDENTS2[Élèves classe]

    STUDENTS -->|1:N| TUITION2[Comptes élève]
    STUDENTS -->|N:M| PARENTS[Parents]

    TUITION -->|1:N| INTENTS[Payment Intents]
    TUITION -->|1:N| PAYMENTS[Payments]

    INTENTS -->|1:1| PAYMENTS2[Payment confirmé]

    style PLATFORM fill:#f0f,color:#fff
    style SCHOOLS fill:#f90,color:#fff
    style STUDENTS fill:#09f,color:#fff
    style PAYMENTS fill:#0c0,color:#fff
```

---

## Diagramme de déploiement

```mermaid
graph TB
    subgraph "Frontend"
        MOBILE[App Mobile<br/>React Native]
        DASHBOARD[Dashboard<br/>Next.js]
        USSD[USSD Gateway<br/>*xxx#]
    end

    subgraph "Backend Supabase"
        API[REST API<br/>PostgREST]
        AUTH[Auth<br/>GoTrue]
        EDGE[Edge Functions<br/>Deno]
        REALTIME[Realtime<br/>Phoenix]
    end

    subgraph "Database"
        POSTGRES[(PostgreSQL<br/>+ Extensions)]
        REDIS[Redis Cache]
    end

    subgraph "Services Externes"
        CINETPAY[CinetPay API]
        SMS[SMS Provider]
        ORANGE[Orange Money]
        MOOV[Moov Money]
    end

    MOBILE --> API
    DASHBOARD --> API
    USSD --> EDGE

    API --> POSTGRES
    AUTH --> POSTGRES
    EDGE --> POSTGRES
    REALTIME --> POSTGRES

    API --> REDIS

    EDGE --> CINETPAY
    EDGE --> SMS
    EDGE --> ORANGE
    EDGE --> MOOV

    CINETPAY -.Webhook.-> EDGE
    ORANGE -.Callback.-> EDGE
    MOOV -.Callback.-> EDGE

    style POSTGRES fill:#336791,color:#fff
    style REDIS fill:#d82c20,color:#fff
    style API fill:#3ecf8e,color:#fff
```

---

## Légende des symboles

### Relations
- `||--o{` : Un à plusieurs (1:N)
- `||--||` : Un à un (1:1)
- `}o--o{` : Plusieurs à plusieurs (N:M)
- `-->` : Dépendance / Flux
- `-.->` : Lien faible / Optionnel

### Types de clés
- `PK` : Primary Key (Clé primaire)
- `FK` : Foreign Key (Clé étrangère)
- `UK` : Unique Key (Contrainte d'unicité)

### Couleurs
- 🔴 Rouge : Tables critiques / haute fréquence
- 🟠 Orange : Tables importantes / fréquence moyenne
- 🟢 Vert : Succès / Validation
- 🔵 Bleu : Information / Lecture
- 🟣 Violet : Administration / Config

---

**Utilisation:** Ces diagrammes peuvent être visualisés avec des outils compatibles Mermaid (GitHub, GitLab, VS Code, etc.)
