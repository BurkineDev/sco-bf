# Application Mobile Parent - Scolarité BF 📱

Application React Native (Expo) pour les parents permettant de payer les frais de scolarité de leurs enfants.

## 🎨 Design System

### Palette de Couleurs
Inspirée du Burkina Faso : vert (forêt), or (soleil du Sahel), et tons chauds neutres.

```
Primary:  #0A6847 (Vert forêt)
Accent:   #F9A825 (Or/Jaune)
Success:  #10B981
Warning:  #F59E0B
Error:    #EF4444
```

### Typographie
Police : **Outfit** (Google Fonts) - Moderne, lisible, chaleureuse.

## 📁 Structure du Projet

```
mobile-parent/
├── app/                      # Routes Expo Router
│   ├── (auth)/               # Écrans d'authentification
│   │   ├── _layout.tsx
│   │   ├── login.tsx         # Connexion téléphone
│   │   └── otp.tsx           # Vérification OTP
│   ├── (tabs)/               # Navigation par onglets
│   │   ├── _layout.tsx
│   │   ├── index.tsx         # Accueil (liste enfants)
│   │   ├── payments.tsx      # Historique paiements
│   │   ├── notifications.tsx
│   │   └── profile.tsx
│   ├── payment/
│   │   ├── [studentId].tsx   # Modal paiement
│   │   └── status/
│   │       └── [intentId].tsx # Statut paiement
│   ├── _layout.tsx           # Layout racine
│   └── index.tsx             # Redirection initiale
│
├── components/
│   └── ui/
│       ├── Button.tsx        # Bouton avec variantes
│       ├── Input.tsx         # Inputs (Phone, OTP, Amount)
│       ├── Card.tsx          # Cards (Student, Payment)
│       └── index.tsx         # Composants additionnels
│
├── constants/
│   └── theme.ts              # Design tokens
│
├── lib/
│   ├── supabase.ts           # Client Supabase
│   └── utils.ts              # Helpers
│
├── store/
│   └── index.ts              # Zustand stores
│
├── types/
│   └── index.ts              # Types TypeScript
│
├── assets/
│   └── fonts/                # Polices Outfit
│
├── app.json                  # Config Expo
├── package.json
└── tsconfig.json
```

## 🚀 Installation

### Prérequis
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go sur votre téléphone (ou émulateur)

### Installation

```bash
# Cloner et aller dans le dossier
cd scolarite-bf/mobile-parent

# Installer les dépendances
npm install

# Télécharger les polices (si pas incluses)
# Placer Outfit-*.ttf dans assets/fonts/

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés Supabase
```

### Variables d'Environnement

Créer un fichier `.env` :

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Lancer l'application

```bash
# Démarrer le serveur de développement
npm start

# Ou directement sur un simulateur
npm run ios      # iOS Simulator
npm run android  # Android Emulator
```

## 📱 Écrans

### 1. Authentification

| Écran | Description |
|-------|-------------|
| **Login** | Saisie numéro téléphone (+226) |
| **OTP** | Vérification code 6 chiffres |

**Fonctionnalités :**
- Validation format téléphone burkinabè
- Rate limiting (5 OTP/heure)
- Timer de renvoi OTP (60s)
- Gestion erreurs (code invalide, expiré)

### 2. Accueil

- Header avec salutation dynamique
- Résumé global (total à payer, déjà payé)
- Liste des enfants avec :
  - Photo/initiales
  - École et classe
  - Barre de progression paiement
  - Montants (payé, reste)
- Actions rapides
- Banner USSD

### 3. Paiement

Modal de paiement pour un élève :
- Info élève + solde actuel
- Saisie montant + suggestions
- Choix provider (Orange Money, Moov Money)
- Récapitulatif
- Redirection vers page PSP
- Écran statut (polling)

### 4. Historique

- Stats globales (total payé, nb transactions)
- Filtres temporels (Tout, Ce mois, Cette année)
- Liste paiements avec statut

### 5. Profil

- Avatar et infos utilisateur
- Stats (nb enfants, soldés, paiements)
- Paramètres (notifications, langue, sécurité)
- Support (aide, contact, CGU)
- Déconnexion

## 🔧 Composants UI

### Button

```tsx
<Button
  title="Payer"
  onPress={handlePay}
  variant="primary"     // primary | secondary | outline | ghost | danger
  size="lg"             // sm | md | lg
  loading={isLoading}
  disabled={!isValid}
  icon={<Icon />}
  fullWidth
/>
```

### PhoneInput

```tsx
<PhoneInput
  value={phone}
  onChangeText={setPhone}
  error="Numéro invalide"
/>
```

### OtpInput

```tsx
<OtpInput
  value={otp}
  onChangeText={setOtp}
  length={6}
  error={error}
  autoFocus
/>
```

### StudentCard

```tsx
<StudentCard
  student={student}
  onPress={() => navigateToPayment(student.id)}
/>
```

### PaymentCard

```tsx
<PaymentCard
  payment={payment}
  onPress={() => showDetails(payment.id)}
/>
```

## 🗄️ State Management (Zustand)

### Stores disponibles

```tsx
// Authentification
const { user, isAuthenticated, requestOtp, verifyOtp, logout } = useAuthStore();

// Élèves
const { students, isLoading, fetchStudents, selectStudent } = useStudentsStore();

// Paiements
const { payments, createPaymentIntent, checkPaymentStatus } = usePaymentsStore();
```

## 🔐 Sécurité

- **Stockage sécurisé** : expo-secure-store pour tokens
- **JWT courts** : 15 min + refresh
- **OTP hashé** : jamais stocké en clair
- **Device fingerprint** : Anti-fraude

## 📦 Dépendances Principales

| Package | Usage |
|---------|-------|
| `expo-router` | Navigation file-based |
| `@supabase/supabase-js` | Client backend |
| `zustand` | State management |
| `expo-secure-store` | Stockage sécurisé |
| `expo-linear-gradient` | Gradients UI |
| `date-fns` | Formatage dates |
| `react-native-toast-message` | Notifications |

## 🎯 Prochaines Étapes

1. **Polices** : Ajouter les fichiers Outfit-*.ttf
2. **Assets** : Icon, splash screen, adaptive icon
3. **Tests** : Jest + Testing Library
4. **i18n** : Traduction mooré/dioula
5. **Offline** : Mode hors-ligne basique
6. **Push** : Notifications push (Expo Notifications)

## 📄 Build Production

```bash
# Installer EAS CLI
npm install -g eas-cli

# Login Expo
eas login

# Build Android APK
eas build --platform android --profile preview

# Build iOS (nécessite compte Apple Developer)
eas build --platform ios --profile preview
```

## 🐛 Debugging

```bash
# Logs en temps réel
npx expo start --dev-client

# Reset cache
npx expo start --clear

# Vérifier config
npx expo config
```

---

**Développé pour le Burkina Faso** 🇧🇫
