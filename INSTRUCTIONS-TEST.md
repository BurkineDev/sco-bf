# Instructions pour tester le Dashboard École

## 📋 Prérequis

1. **Exécuter le script de données de test dans Supabase**
   - Ouvrez votre projet Supabase: https://app.supabase.com
   - Allez dans **SQL Editor**
   - Copiez et collez le contenu du fichier `database/test-data.sql`
   - Cliquez sur **Run** pour exécuter le script

   Ce script va créer:
   - ✅ 1 école: Complexe Scolaire Excellence
   - ✅ 1 utilisateur admin: Amadou Traoré
   - ✅ 1 année académique: 2024-2025
   - ✅ 3 classes: 6ème A, 5ème B, 4ème C
   - ✅ 5 élèves avec différents statuts de paiement
   - ✅ 5 paiements (380,000 FCFA au total)
   - ✅ 1 agent: Issouf Compaoré

## 🚀 Connexion au Dashboard

### Option 1: Login Développement (Recommandé pour les tests)

1. Démarrez le serveur de développement si ce n'est pas déjà fait:
   ```bash
   cd dashboard-school
   npm run dev
   ```

2. Ouvrez votre navigateur et allez sur:
   ```
   http://localhost:3000/login-dev
   ```

3. Utilisez les identifiants de test:
   ```
   Email: admin@test.bf
   Mot de passe: admin123
   ```

4. Cliquez sur **Se connecter**

### Option 2: Login OTP (Nécessite configuration SMS)

1. Allez sur: `http://localhost:3000/login`
2. Entrez le numéro: `+22670123456`
3. Un OTP sera envoyé (nécessite la configuration du service SMS dans Supabase)

## 📊 Pages disponibles après connexion

Une fois connecté, vous aurez accès à:

### 1. **Dashboard Principal** (`/dashboard`)
   - Statistiques en temps réel
   - Graphiques de paiements
   - Liste des derniers paiements
   - Vue d'ensemble des classes

### 2. **Élèves** (`/dashboard/students`)
   - Liste complète des élèves
   - Recherche et filtres
   - Statut de paiement
   - ➕ Ajouter/Modifier des élèves (bouton disponible)

### 3. **Classes** (`/dashboard/classes`)
   - Vue de toutes les classes
   - Statistiques par classe
   - Montants de scolarité
   - ➕ Ajouter/Modifier des classes

### 4. **Paiements** (`/dashboard/payments`)
   - Historique complet des paiements
   - Filtres par date, canal, statut
   - 📥 Export Excel
   - 📄 Export PDF
   - 🧾 Génération de reçus PDF

### 5. **Agents** (`/dashboard/agents`)
   - Liste des agents/caissiers
   - Gestion des commissions
   - Activation/désactivation
   - ➕ Ajouter/Modifier des agents

### 6. **Années Académiques** (`/dashboard/academic-years`)
   - Gestion des années scolaires
   - Année en cours
   - Dates et deadlines
   - ➕ Ajouter/Modifier des années

### 7. **Import Élèves** (`/dashboard/import`)
   - Import CSV ou Excel
   - Télécharger un modèle
   - Validation automatique
   - Rapport d'erreurs

## 🧪 Fonctionnalités à tester

### ✅ Exports
1. Allez dans **Paiements**
2. Cliquez sur "Exporter"
3. Choisissez Excel ou PDF
4. Le fichier sera téléchargé automatiquement

### ✅ Reçus PDF
1. Dans **Paiements**, trouvez un paiement
2. Cliquez sur "Télécharger Reçu"
3. Un PDF professionnel sera généré

### ✅ Import d'élèves
1. Allez dans **Import Élèves**
2. Téléchargez le modèle CSV/Excel
3. Remplissez avec vos données
4. Importez le fichier
5. Vérifiez le rapport d'import

### ✅ Modals CRUD
1. Sur n'importe quelle page, cliquez sur "Ajouter" ou "Modifier"
2. Remplissez le formulaire
3. Validez
4. La page se rafraîchit automatiquement

## 🔧 Configuration avancée (Optionnel)

### Configuration SMS pour OTP

Pour activer l'authentification OTP par SMS:

1. Allez dans votre projet Supabase
2. **Edge Functions** → Variables d'environnement
3. Ajoutez les variables pour votre fournisseur SMS:
   - Pour Orange API SMS (Burkina Faso):
     ```
     ORANGE_SMS_CLIENT_ID=votre_client_id
     ORANGE_SMS_CLIENT_SECRET=votre_client_secret
     ORANGE_SMS_SENDER=SCO-BF
     ```

### Intégration CinetPay

Quand vous aurez vos clés API CinetPay:

1. Ajoutez-les dans `.env.local`:
   ```
   CINETPAY_API_KEY=votre_api_key
   CINETPAY_SITE_ID=votre_site_id
   ```

## 📝 Notes importantes

- **Données de test**: Utilisez le script SQL fourni pour avoir des données réalistes
- **Mode développement**: La page `/login-dev` est pour les tests uniquement
- **Production**: Utilisez `/login` avec OTP pour la production
- **Sécurité**: Changez les mots de passe de test avant la mise en production

## 🆘 Problèmes courants

### "Utilisateur de test non trouvé"
→ Exécutez le script `test-data.sql` dans Supabase SQL Editor

### "School non trouvée"
→ Vérifiez que le script a créé l'école correctement

### Page blanche après login
→ Vérifiez la console du navigateur (F12) pour les erreurs

### Erreur de connexion Supabase
→ Vérifiez que les variables d'environnement dans `.env.local` sont correctes

## ✨ Bon test!

Vous avez maintenant un dashboard complet et fonctionnel pour gérer votre école!
