# Guide de Démarrage - Application Mobile Parent 📱

Application React Native (Expo) pour les parents permettant de payer les frais de scolarité.

## ✅ Configuration terminée

- ✅ Dépendances installées (1214 packages)
- ✅ Fichier `.env` créé avec les credentials Supabase
- ✅ Structure complète de l'application
- ✅ Toutes les pages implémentées

## 🚀 Démarrer l'application

### Option 1: Expo Go (Recommandé pour tests rapides)

1. **Installer Expo Go sur votre téléphone**
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
   - iOS: https://apps.apple.com/app/expo-go/id982107779

2. **Lancer le serveur de développement**
   ```bash
   cd /home/user/sco-bf/mobile-parent
   npm start
   ```

3. **Scanner le QR code**
   - Android: Scanner avec l'app Expo Go
   - iOS: Scanner avec l'app Appareil Photo

### Option 2: Émulateur Android

```bash
cd /home/user/sco-bf/mobile-parent
npm run android
```

### Option 3: Simulateur iOS (Mac uniquement)

```bash
cd /home/user/sco-bf/mobile-parent
npm run ios
```

## 📱 Structure de l'Application

### Écrans d'Authentification

**Login (app/(auth)/login.tsx)**
- Saisie du numéro de téléphone (+226)
- Format burkinabè validé
- Envoi OTP via Supabase Edge Function

**OTP (app/(auth)/otp.tsx)**
- Code 6 chiffres
- Timer 60s pour renvoi
- Vérification et connexion

### Écrans Principaux (Tabs)

**1. Accueil (app/(tabs)/index.tsx)**
- Liste des enfants du parent
- Statistiques globales (total à payer, déjà payé)
- Barre de progression par enfant
- Bouton rapide "Payer" pour chaque enfant

**2. Paiements (app/(tabs)/payments.tsx)**
- Historique complet des paiements
- Filtres par période
- Statuts (complété, en attente, échoué)
- Montants et dates

**3. Notifications (app/(tabs)/notifications.tsx)**
- Alertes de paiements
- Rappels de deadlines
- Confirmations de reçus

**4. Profil (app/(tabs)/profile.tsx)**
- Informations utilisateur
- Statistiques du compte
- Paramètres
- Déconnexion

### Écrans de Paiement

**Modal Paiement (app/payment/[studentId].tsx)**
- Informations élève et solde
- Saisie montant avec suggestions
- Choix provider:
  - 🟠 Orange Money
  - 🔵 Moov Money
- Validation et création intent

**Statut Paiement (app/payment/status/[intentId].tsx)**
- Polling status toutes les 3s
- États: pending → processing → completed/failed
- Redirection automatique

## 🎨 Design System

### Couleurs
```
Primary (Vert Burkina):  #0A6847
Accent (Or):             #F9A825
Success:                 #10B981
Warning:                 #F59E0B
Error:                   #EF4444
```

### Composants UI

Tous les composants sont dans `components/ui/`:

**Button**
```tsx
<Button
  title="Payer"
  variant="primary"
  size="lg"
  onPress={handlePay}
  loading={isLoading}
/>
```

**StudentCard**
```tsx
<StudentCard
  student={student}
  onPress={() => navigateToPayment(student.id)}
/>
```

**PaymentCard**
```tsx
<PaymentCard
  payment={payment}
  onPress={() => showDetails(payment)}
/>
```

**PhoneInput**
```tsx
<PhoneInput
  value={phone}
  onChangeText={setPhone}
  error="Numéro invalide"
/>
```

**OtpInput**
```tsx
<OtpInput
  value={otp}
  onChangeText={setOtp}
  length={6}
  autoFocus
/>
```

**AmountInput**
```tsx
<AmountInput
  value={amount}
  onChangeText={setAmount}
  placeholder="Montant"
  maxAmount={balance}
/>
```

## 🗄️ State Management (Zustand)

### Auth Store
```tsx
const {
  user,
  isAuthenticated,
  requestOtp,    // Demander un OTP
  verifyOtp,     // Vérifier et se connecter
  logout,        // Se déconnecter
} = useAuthStore();
```

### Students Store
```tsx
const {
  students,       // Liste des enfants
  selectedStudent,
  isLoading,
  fetchStudents,  // Charger les enfants
  selectStudent,  // Sélectionner un enfant
  refreshStudent, // Rafraîchir un enfant
} = useStudentsStore();
```

### Payments Store
```tsx
const {
  payments,             // Historique paiements
  createPaymentIntent,  // Créer intent paiement
  checkPaymentStatus,   // Vérifier statut
  isLoading,
} = usePaymentsStore();
```

## 🔧 Configuration

### Variables d'environnement (.env)

Le fichier `.env` est déjà configuré avec:
```env
EXPO_PUBLIC_SUPABASE_URL=https://avdbsaukigngsnklceat.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Supabase Edge Functions requises

L'app utilise ces Edge Functions:

1. **auth-otp/request** - Demander un OTP
2. **auth-otp/verify** - Vérifier un OTP
3. **parent-students** - Liste des enfants du parent
4. **create-payment-intent** - Créer une intention de paiement
5. **check-payment-status** - Vérifier le statut d'un paiement

## 📊 Données de Test

### Se connecter comme parent

Pour tester l'app, vous devez d'abord créer un utilisateur parent dans Supabase:

```sql
-- 1. Créer un utilisateur parent
INSERT INTO users (phone, role, first_name, last_name, is_active)
VALUES ('+22670000001', 'parent', 'Marie', 'Ouédraogo', true)
RETURNING id;

-- 2. Lier les élèves à ce parent (utilisez l'id retourné ci-dessus)
UPDATE students
SET parent_phone = '+22670000001'
WHERE id IN (
  SELECT id FROM students LIMIT 2  -- Les 2 premiers élèves
);
```

### Flux de paiement

1. **Login**: +22670000001
2. **OTP**: (code envoyé par SMS ou visible dans logs Supabase)
3. **Accueil**: Voir les 2 enfants liés
4. **Payer**: Cliquer sur un enfant
5. **Montant**: Entrer montant (min 1000 FCFA)
6. **Provider**: Choisir Orange ou Moov
7. **Confirmer**: Redirection vers provider
8. **Statut**: Attendre confirmation

## 🔐 Sécurité

- **Secure Store**: Tokens stockés de manière sécurisée (expo-secure-store)
- **OTP**: Codes hashés côté serveur
- **JWT**: Tokens avec expiration courte (15 min)
- **Device Info**: Fingerprint pour anti-fraude

## 🐛 Debug

### Logs en temps réel
```bash
npm start
# Puis appuyez sur 'd' pour ouvrir les Developer Tools
```

### Reset cache
```bash
npm start -- --clear
```

### Vérifier la configuration
```bash
npx expo config
```

### Voir les logs Supabase Edge Functions
1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. **Edge Functions** → **Logs**

## 📦 Build Production

### Installer EAS CLI
```bash
npm install -g eas-cli
```

### Login
```bash
eas login
```

### Build Android APK
```bash
eas build --platform android --profile preview
```

### Build iOS (nécessite Apple Developer)
```bash
eas build --platform ios --profile preview
```

## 🎯 Fonctionnalités Implémentées

✅ **Authentification**
- Login avec téléphone
- OTP 6 chiffres
- Session persistante
- Déconnexion

✅ **Gestion des Enfants**
- Liste des enfants du parent
- Informations école et classe
- Statut de paiement en temps réel
- Barre de progression

✅ **Paiements**
- Saisie montant avec validation
- Suggestions intelligentes (1/4, 1/2, 3/4, total)
- Choix provider (Orange Money, Moov Money)
- Intent payment avec CinetPay
- Suivi statut en temps réel

✅ **Historique**
- Liste complète des paiements
- Filtres temporels
- Statuts et montants
- Export possible

✅ **UI/UX**
- Design Burkina Faso (vert/or)
- Animations fluides
- Pull-to-refresh
- Loading states
- Error handling
- Toasts informatifs

## 📋 Prochaines Étapes

### Configuration SMS
Pour l'OTP, configurez un service SMS dans Supabase Edge Functions.

### Push Notifications
```bash
npm install expo-notifications
```

### Mode Offline
Implémenter la synchronisation hors ligne.

### Traductions
Ajouter mooré et dioula.

## 🆘 Support

Pour toute question:
1. Vérifiez les logs avec `npm start`
2. Consultez la documentation Expo: https://docs.expo.dev
3. Vérifiez Supabase Dashboard pour les erreurs Edge Functions

---

**Développé pour le Burkina Faso** 🇧🇫
