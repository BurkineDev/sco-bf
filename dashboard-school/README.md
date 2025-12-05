# Scolarité BF - Dashboard

Système de gestion scolaire pour les établissements au Burkina Faso.

## Fonctionnalités

- 📊 Tableau de bord avec statistiques en temps réel
- 👨‍🎓 Gestion des élèves
- 👨‍🏫 Gestion des enseignants
- 📚 Gestion des classes
- 📅 Suivi des présences
- 📝 Gestion des notes
- 💰 Gestion financière
- 📈 Statistiques et rapports

## Technologies

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, Tailwind CSS
- **Base de données**: Supabase
- **Graphiques**: Recharts
- **Icônes**: Lucide React
- **État**: Zustand
- **Notifications**: React Hot Toast

## Installation

### Prérequis

- Node.js 18+
- npm ou yarn

### Étapes

1. Cloner le repository:
```bash
git clone <repository-url>
cd dashboard-school
```

2. Installer les dépendances:
```bash
npm install
# ou
yarn install
```

3. Configurer les variables d'environnement:
```bash
cp .env.example .env.local
```

Remplir les variables dans `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Lancer le serveur de développement:
```bash
npm run dev
# ou
yarn dev
```

5. Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Structure du Projet

```
dashboard-school/
├── app/
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx            # Page d'accueil
│   ├── globals.css         # Styles globaux
│   └── dashboard/
│       ├── layout.tsx      # Layout du dashboard
│       ├── page.tsx        # Page principale du dashboard
│       ├── students/       # Gestion des élèves
│       ├── teachers/       # Gestion des enseignants
│       ├── classes/        # Gestion des classes
│       └── settings/       # Paramètres
├── components/
│   ├── Sidebar.tsx         # Barre de navigation latérale
│   ├── Header.tsx          # En-tête du dashboard
│   └── ui/                 # Composants UI réutilisables
├── lib/
│   ├── supabase.ts         # Configuration Supabase
│   ├── store.ts            # État global (Zustand)
│   └── utils.ts            # Fonctions utilitaires
└── types/
    └── index.ts            # Types TypeScript
```

## Pages Disponibles

- `/` - Page d'accueil
- `/dashboard` - Tableau de bord principal
- `/dashboard/students` - Gestion des élèves
- `/dashboard/teachers` - Gestion des enseignants
- `/dashboard/classes` - Gestion des classes
- `/dashboard/settings` - Paramètres

## Scripts

```bash
npm run dev      # Lancer en mode développement
npm run build    # Construire pour la production
npm run start    # Lancer en production
npm run lint     # Vérifier le code avec ESLint
```

## Déploiement

Le projet peut être déployé sur [Vercel](https://vercel.com/) en quelques clics:

1. Push le code sur GitHub
2. Importer le projet sur Vercel
3. Configurer les variables d'environnement
4. Déployer

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou soumettre une pull request.

## Licence

MIT
