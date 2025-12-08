# Configuration de la Base de Données

Guide pour configurer votre base de données Supabase avec le dashboard.

## 📋 Prérequis

1. Un compte Supabase (gratuit): https://supabase.com
2. Un projet Supabase créé

## 🔧 Étape 1: Obtenir vos Credentials Supabase

### 1.1 Créer un projet Supabase

1. Allez sur https://supabase.com
2. Connectez-vous ou créez un compte
3. Cliquez sur "New Project"
4. Remplissez les informations:
   - **Name**: `scolarite-bf` (ou votre nom)
   - **Database Password**: Choisissez un mot de passe fort
   - **Region**: Choisissez la région la plus proche (ex: Frankfurt pour l'Afrique)
5. Cliquez sur "Create new project"

### 1.2 Récupérer vos clés API

1. Dans votre projet Supabase, allez dans **Settings** (icône engrenage en bas à gauche)
2. Cliquez sur **API**
3. Vous verrez deux informations importantes:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: Une longue clé commençant par `eyJhbG...`

## 🔑 Étape 2: Configurer les Variables d'Environnement

### 2.1 Créer le fichier .env.local

Dans le dossier `dashboard-school`, créez un fichier `.env.local`:

```bash
cd dashboard-school
cp .env.example .env.local
```

### 2.2 Éditer le fichier .env.local

Ouvrez `.env.local` et remplacez les valeurs:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon_très_longue

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Exemple avec de vraies valeurs:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🗄️ Étape 3: Créer les Tables dans Supabase

### 3.1 Ouvrir l'éditeur SQL

1. Dans votre projet Supabase, cliquez sur **SQL Editor** dans le menu de gauche
2. Cliquez sur **New query**

### 3.2 Exécuter le schéma

1. Ouvrez le fichier `database/schema.sql` de votre projet local
2. Copiez TOUT le contenu du fichier
3. Collez-le dans l'éditeur SQL de Supabase
4. Cliquez sur **Run** (ou appuyez sur Ctrl+Enter)

Le script va créer:
- ✅ Toutes les tables nécessaires (users, schools, students, payments, etc.)
- ✅ Les types énumérés
- ✅ Les index et contraintes
- ✅ Les fonctions et triggers

### 3.3 Vérifier les tables

1. Allez dans **Table Editor** dans Supabase
2. Vous devriez voir toutes les tables créées:
   - users
   - schools
   - students
   - classes
   - teachers
   - payments
   - etc.

## 🧪 Étape 4: Tester la Connexion

### 4.1 Redémarrer le serveur

```bash
# Si le serveur tourne déjà, arrêtez-le (Ctrl+C)
npm run dev
```

### 4.2 Accéder à la page de test

1. Ouvrez votre navigateur
2. Allez sur: http://localhost:3000/dashboard/test-db
3. Cliquez sur **"Tester la Connexion"**

### 4.3 Résultats possibles

✅ **Succès**: Vous verrez un message vert avec les tables détectées

❌ **Échec**: Vérifiez que:
- Le fichier `.env.local` existe bien
- Les credentials sont corrects (copiez-collez depuis Supabase)
- Les tables ont été créées dans Supabase
- Le serveur a été redémarré après avoir créé `.env.local`

## 🔬 Étape 5: Tester les Opérations CRUD

Une fois la connexion établie, testez:

1. **Test Insertion**: Cliquez sur "Test Insertion"
   - Insère une école de test dans la base de données

2. **Test Requête**: Cliquez sur "Test Requête"
   - Récupère les écoles depuis la base de données

## 🐛 Dépannage

### Erreur: "Invalid API key"
- Vérifiez que vous avez copié la clé **anon** (pas la clé service_role)
- Vérifiez qu'il n'y a pas d'espaces avant/après la clé

### Erreur: "relation does not exist"
- Les tables n'ont pas été créées
- Retournez à l'étape 3 et exécutez le schema.sql

### Erreur: "Failed to fetch"
- Vérifiez votre connexion internet
- Vérifiez que l'URL du projet est correcte

### Le serveur ne voit pas les variables d'environnement
- Assurez-vous que le fichier s'appelle exactement `.env.local` (avec le point au début)
- Redémarrez complètement le serveur (arrêtez et relancez `npm run dev`)

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

## 🆘 Besoin d'aide ?

Si vous rencontrez des problèmes, vérifiez:
1. Les logs dans la console du navigateur (F12 > Console)
2. Les logs du serveur Next.js dans votre terminal
3. Les logs dans Supabase (Logs dans le menu)
