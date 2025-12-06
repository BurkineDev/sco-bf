# 📄 Guide de Conversion PDF

## Méthodes pour convertir les guides Markdown en PDF

---

## 🎯 Vue d'ensemble

Nous avons créé plusieurs guides en Markdown qui doivent être convertis en PDF pour distribution :

| Document | Taille | Pages | Audience |
|----------|--------|-------|----------|
| **GUIDE-ADMIN-ECOLE.md** | ~8,000 mots | 30+ | Administrateurs école |
| **GUIDE-PARENT.md** | ~5,000 mots | 20+ | Parents d'élèves |
| **SCHEMA-DATABASE-COMPLET.md** | ~10,000 mots | 88 | Développeurs |
| **GUIDE-MIGRATION.md** | ~8,000 mots | 30+ | DevOps |
| **README-MIGRATION.md** | ~3,000 mots | 15 | Tous |

---

## ✅ Méthode 1 : Script automatique (Recommandé)

### Prérequis

**Ubuntu/Debian :**
```bash
sudo apt-get update
sudo apt-get install -y pandoc texlive-xetex texlive-fonts-recommended texlive-lang-french
```

**macOS :**
```bash
brew install pandoc
brew install --cask basictex
```

**Windows :**
```bash
# Avec Chocolatey
choco install pandoc miktex

# Ou télécharger manuellement:
# https://pandoc.org/installing.html
# https://miktex.org/download
```

### Utilisation

```bash
cd /home/user/sco-bf

# Rendre le script exécutable
chmod +x convert-to-pdf.sh

# Exécuter la conversion
./convert-to-pdf.sh
```

### Résultat

```
📁 docs/pdf/
├── Guide-Administrateur-Ecole.pdf    (~2 MB, 35 pages)
├── Guide-Parent-Application.pdf      (~1.5 MB, 22 pages)
├── Schema-Base-Donnees.pdf           (~3 MB, 90 pages)
├── Guide-Migration-Database.pdf      (~2.5 MB, 32 pages)
└── README-Migration.pdf              (~1 MB, 16 pages)
```

---

## 🐳 Méthode 2 : Docker (Sans installation locale)

### Avec Docker

```bash
cd /home/user/sco-bf

# Créer l'image Docker
cat > Dockerfile.pdf <<EOF
FROM pandoc/latex:latest

WORKDIR /data

COPY . .

RUN apk add --no-cache bash

CMD ["bash", "convert-to-pdf.sh"]
EOF

# Build et exécution
docker build -f Dockerfile.pdf -t scolarite-pdf .
docker run -v $(pwd)/docs:/data/docs scolarite-pdf
```

Les PDFs seront dans `docs/pdf/`

---

## 🌐 Méthode 3 : Outils en ligne (Sans installation)

### Option A : GitHub Rendering + Print to PDF

1. **Pousser sur GitHub** (déjà fait ✅)
2. **Ouvrir chaque fichier .md sur GitHub**
3. GitHub rend automatiquement le Markdown
4. **Imprimer en PDF** :
   - Chrome/Edge : Ctrl+P → "Enregistrer au format PDF"
   - Safari : Cmd+P → PDF → "Enregistrer au format PDF"

**Avantages :**
- ✅ Pas d'installation
- ✅ Préserve les diagrammes Mermaid

**Inconvénients :**
- ❌ Mise en page moins professionnelle
- ❌ Pas de table des matières automatique

### Option B : Services en ligne

#### 1. **Markdown to PDF** (https://md2pdf.netlify.app)

```bash
# 1. Ouvrir le site
# 2. Copier-coller le contenu du .md
# 3. Cliquer "Convert"
# 4. Télécharger le PDF
```

#### 2. **Dillinger** (https://dillinger.io)

```bash
# 1. Importer le fichier .md
# 2. Prévisualiser
# 3. Export as → PDF
```

#### 3. **HackMD** (https://hackmd.io)

```bash
# 1. Créer un nouveau document
# 2. Copier-coller le contenu
# 3. Menu → Export → PDF
```

---

## 📝 Méthode 4 : VS Code (Si vous l'utilisez)

### Extension Markdown PDF

1. **Installer l'extension** :
   - Ouvrir VS Code
   - Extensions → Rechercher "Markdown PDF"
   - Installer "yzane.markdown-pdf"

2. **Convertir** :
   - Ouvrir le fichier .md
   - Clic droit → "Markdown PDF: Export (pdf)"

### Extension Markdown All in One

1. **Installer** : "yzhang.markdown-all-in-one"
2. **Convertir** : Cmd/Ctrl+Shift+P → "Markdown: Print to PDF"

---

## 🎨 Méthode 5 : Conversion personnalisée avec style

### Template personnalisé Pandoc

Créer un fichier `docs/custom-template.latex` :

```latex
\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[french]{babel}
\usepackage{graphicx}
\usepackage{hyperref}
\usepackage{fancyhdr}
\usepackage{lastpage}

% En-tête et pied de page
\pagestyle{fancy}
\fancyhead[L]{ScolaritéBF - $title$}
\fancyhead[R]{\thepage\ / \pageref{LastPage}}
\fancyfoot[C]{Système de Gestion des Paiements Scolaires}

\begin{document}

% Page de garde
\begin{titlepage}
    \centering
    \vspace*{2cm}
    {\Huge\bfseries $title$\par}
    \vspace{1cm}
    {\Large $subtitle$\par}
    \vspace{2cm}
    {\large $author$\par}
    \vspace{1cm}
    {\large $date$\par}
    \vfill
    {\large Burkina Faso\par}
\end{titlepage}

$body$

\end{document}
```

Puis convertir :

```bash
pandoc GUIDE-ADMIN-ECOLE.md \
    -o docs/pdf/Guide-Admin-Custom.pdf \
    --template=docs/custom-template.latex \
    --pdf-engine=xelatex \
    -V title="Guide Administrateur" \
    -V subtitle="Système ScolaritéBF" \
    -V author="Équipe ScolaritéBF"
```

---

## 📦 Méthode 6 : Script Python (Alternative)

### Avec markdown-pdf (Python)

```bash
# Installation
pip install markdown-pdf

# Conversion
cd /home/user/sco-bf

markdown-pdf \
    --output docs/pdf/Guide-Admin.pdf \
    --stylesheet docs/custom.css \
    GUIDE-ADMIN-ECOLE.md
```

### Avec weasyprint (Meilleur rendu)

```bash
# Installation
pip install markdown weasyprint

# Script Python
cat > convert_md_to_pdf.py <<'EOF'
import markdown
from weasyprint import HTML, CSS
import sys

def convert_md_to_pdf(md_file, pdf_file):
    # Lire Markdown
    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()

    # Convertir en HTML
    html_content = markdown.markdown(
        md_content,
        extensions=['extra', 'codehilite', 'toc']
    )

    # CSS personnalisé
    css = CSS(string='''
        @page {
            margin: 2cm;
            @top-center {
                content: "ScolaritéBF - Documentation";
            }
        }
        body {
            font-family: "DejaVu Sans", sans-serif;
            font-size: 11pt;
            line-height: 1.6;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        code {
            background: #f4f4f4;
            padding: 2px 5px;
            border-radius: 3px;
        }
    ''')

    # Générer PDF
    HTML(string=html_content).write_pdf(
        pdf_file,
        stylesheets=[css]
    )
    print(f"✅ Généré: {pdf_file}")

if __name__ == "__main__":
    convert_md_to_pdf(sys.argv[1], sys.argv[2])
EOF

# Utilisation
python convert_md_to_pdf.py GUIDE-ADMIN-ECOLE.md docs/pdf/Guide-Admin.pdf
```

---

## 🎯 Recommandations par cas d'usage

### Pour distribution rapide
**→ Méthode 1 (Script automatique)**
- ✅ Professionnel
- ✅ Table des matières
- ✅ Numérotation automatique

### Pour test rapide
**→ Méthode 3A (GitHub + Print)**
- ✅ Pas d'installation
- ✅ Rapide
- ❌ Moins professionnel

### Pour personnalisation avancée
**→ Méthode 5 (Template personnalisé)**
- ✅ Logo de l'école
- ✅ En-têtes personnalisés
- ✅ Style de marque

### Sans accès serveur
**→ Méthode 3B (Services en ligne)**
- ✅ Depuis n'importe où
- ✅ Pas d'installation

---

## 📋 Checklist de qualité PDF

Avant distribution, vérifier :

- [ ] ✅ Table des matières cliquable
- [ ] ✅ Liens hypertextes fonctionnels
- [ ] ✅ Numéros de page corrects
- [ ] ✅ Pas de débordement de texte
- [ ] ✅ Images/diagrammes lisibles
- [ ] ✅ Code source bien formaté
- [ ] ✅ Taille de fichier raisonnable (<5 MB)
- [ ] ✅ Compatible avec tous les lecteurs PDF
- [ ] ✅ Recherche de texte fonctionnelle
- [ ] ✅ Imprimable (marges correctes)

---

## 🔧 Dépannage

### Problème : "pdflatex not found"

**Solution :**
```bash
# Ubuntu
sudo apt-get install texlive-xetex

# macOS
brew install --cask basictex
sudo tlmgr update --self
sudo tlmgr install xetex
```

### Problème : "Font 'DejaVu Sans' not found"

**Solution :**
```bash
# Ubuntu
sudo apt-get install fonts-dejavu

# macOS
brew tap homebrew/cask-fonts
brew install --cask font-dejavu
```

### Problème : Caractères français mal affichés

**Solution :** Utiliser XeLaTeX au lieu de pdflatex :
```bash
pandoc fichier.md -o fichier.pdf --pdf-engine=xelatex
```

### Problème : PDF trop volumineux

**Solution :** Compresser avec Ghostscript :
```bash
gs -sDEVICE=pdfwrite \
   -dCompatibilityLevel=1.4 \
   -dPDFSETTINGS=/ebook \
   -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile=output-compressed.pdf \
   input.pdf
```

---

## 📊 Comparaison des méthodes

| Méthode | Qualité | Rapidité | Complexité | Personnalisation |
|---------|---------|----------|------------|------------------|
| **Script auto** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Docker** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **GitHub Print** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **En ligne** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **VS Code** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Template custom** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Python** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎓 Exemple complet

### Conversion complète avec le script

```bash
cd /home/user/sco-bf

# 1. Rendre exécutable
chmod +x convert-to-pdf.sh

# 2. Exécuter
./convert-to-pdf.sh

# 3. Vérifier
ls -lh docs/pdf/

# 4. Tester un PDF
xdg-open docs/pdf/Guide-Administrateur-Ecole.pdf  # Linux
open docs/pdf/Guide-Administrateur-Ecole.pdf      # macOS
start docs/pdf/Guide-Administrateur-Ecole.pdf     # Windows
```

---

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifier les logs** d'erreur du script
2. **Tester avec un petit fichier** .md d'abord
3. **Essayer une méthode alternative** (en ligne)
4. **Contacter le support** avec le message d'erreur

---

**Prêt à convertir vos guides en PDF professionnel !** 📄✨
