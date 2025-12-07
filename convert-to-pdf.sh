#!/bin/bash

# ============================================================================
# SCRIPT DE CONVERSION MARKDOWN → PDF
# Système de Paiement Scolarité Burkina Faso
# ============================================================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Dossier de sortie
OUTPUT_DIR="docs/pdf"
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   CONVERSION MARKDOWN → PDF                        ║${NC}"
echo -e "${BLUE}║   ScolaritéBF Documentation                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# Fonction de vérification de Pandoc
# ============================================================================
check_pandoc() {
    if ! command -v pandoc &> /dev/null; then
        echo -e "${RED}❌ Pandoc n'est pas installé !${NC}"
        echo ""
        echo "Installation:"
        echo ""
        echo "  Ubuntu/Debian:"
        echo "    sudo apt-get update"
        echo "    sudo apt-get install pandoc texlive-xetex texlive-fonts-recommended texlive-lang-french"
        echo ""
        echo "  macOS:"
        echo "    brew install pandoc"
        echo "    brew install --cask basictex"
        echo ""
        echo "  Windows:"
        echo "    choco install pandoc miktex"
        echo ""
        exit 1
    else
        echo -e "${GREEN}✅ Pandoc détecté: $(pandoc --version | head -n1)${NC}"
    fi
}

# ============================================================================
# Fonction de conversion
# ============================================================================
convert_to_pdf() {
    local input_file=$1
    local output_file=$2
    local title=$3
    local author=$4

    echo ""
    echo -e "${YELLOW}📄 Conversion: $(basename $input_file)${NC}"
    echo -e "   → ${output_file}"

    pandoc "$input_file" \
        -o "$output_file" \
        --pdf-engine=xelatex \
        --toc \
        --toc-depth=3 \
        --number-sections \
        --highlight-style=tango \
        -V geometry:margin=2.5cm \
        -V papersize:a4 \
        -V fontsize=11pt \
        -V mainfont="DejaVu Sans" \
        -V monofont="DejaVu Sans Mono" \
        -V documentclass=report \
        -V lang=fr \
        -V title="$title" \
        -V author="$author" \
        -V date="$(date +'%d %B %Y')" \
        -V colorlinks=true \
        -V linkcolor=blue \
        -V urlcolor=blue \
        -V toccolor=black \
        --metadata-file=docs/pdf-metadata.yaml 2>/dev/null || true

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Converti avec succès !${NC}"

        # Taille du fichier
        size=$(du -h "$output_file" | cut -f1)
        echo -e "   Taille: ${size}"

        # Nombre de pages (si pdfinfo disponible)
        if command -v pdfinfo &> /dev/null; then
            pages=$(pdfinfo "$output_file" 2>/dev/null | grep "Pages:" | awk '{print $2}')
            echo -e "   Pages: ${pages}"
        fi
    else
        echo -e "${RED}❌ Erreur de conversion${NC}"
        return 1
    fi
}

# ============================================================================
# Création du fichier de métadonnées
# ============================================================================
create_metadata() {
    cat > docs/pdf-metadata.yaml <<EOF
---
title: Documentation ScolaritéBF
subtitle: Système de Gestion des Paiements Scolaires
author:
  - ScolaritéBF
  - Burkina Faso
date: $(date +'%d %B %Y')
lang: fr
toc: true
toc-title: Table des matières
lof: false
lot: false
fontsize: 11pt
geometry: margin=2.5cm
papersize: a4
documentclass: report
classoption:
  - oneside
colorlinks: true
linkcolor: RoyalBlue
urlcolor: RoyalBlue
toccolor: Black
---
EOF
}

# ============================================================================
# MAIN - Conversion des documents
# ============================================================================

check_pandoc
create_metadata

echo ""
echo -e "${BLUE}📚 Documents à convertir:${NC}"
echo ""

# 1. Guide Admin École
if [ -f "GUIDE-ADMIN-ECOLE.md" ]; then
    convert_to_pdf \
        "GUIDE-ADMIN-ECOLE.md" \
        "$OUTPUT_DIR/Guide-Administrateur-Ecole.pdf" \
        "Guide d'utilisation - Administrateur École" \
        "ScolaritéBF"
else
    echo -e "${RED}⚠️  GUIDE-ADMIN-ECOLE.md introuvable${NC}"
fi

# 2. Guide Parent
if [ -f "mobile-parent/GUIDE-PARENT.md" ]; then
    convert_to_pdf \
        "mobile-parent/GUIDE-PARENT.md" \
        "$OUTPUT_DIR/Guide-Parent-Application.pdf" \
        "Guide d'utilisation - Application Parent" \
        "ScolaritéBF"
else
    echo -e "${RED}⚠️  mobile-parent/GUIDE-PARENT.md introuvable${NC}"
fi

# 3. Schéma base de données
if [ -f "SCHEMA-DATABASE-COMPLET.md" ]; then
    convert_to_pdf \
        "SCHEMA-DATABASE-COMPLET.md" \
        "$OUTPUT_DIR/Schema-Base-Donnees.pdf" \
        "Documentation Technique - Base de Données" \
        "ScolaritéBF - Équipe Technique"
else
    echo -e "${RED}⚠️  SCHEMA-DATABASE-COMPLET.md introuvable${NC}"
fi

# 4. Guide de migration
if [ -f "GUIDE-MIGRATION.md" ]; then
    convert_to_pdf \
        "GUIDE-MIGRATION.md" \
        "$OUTPUT_DIR/Guide-Migration-Database.pdf" \
        "Guide de Migration - Base de Données" \
        "ScolaritéBF - Équipe Technique"
else
    echo -e "${RED}⚠️  GUIDE-MIGRATION.md introuvable${NC}"
fi

# 5. README Migration
if [ -f "README-MIGRATION.md" ]; then
    convert_to_pdf \
        "README-MIGRATION.md" \
        "$OUTPUT_DIR/README-Migration.pdf" \
        "Documentation Migration - Vue d'ensemble" \
        "ScolaritéBF - Équipe Technique"
else
    echo -e "${RED}⚠️  README-MIGRATION.md introuvable${NC}"
fi

# ============================================================================
# Récapitulatif
# ============================================================================

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   CONVERSION TERMINÉE                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

if [ -d "$OUTPUT_DIR" ]; then
    echo -e "${GREEN}📁 Fichiers PDF générés dans: ${OUTPUT_DIR}${NC}"
    echo ""
    ls -lh "$OUTPUT_DIR"/*.pdf 2>/dev/null || echo "Aucun PDF généré"
    echo ""

    # Taille totale
    total_size=$(du -sh "$OUTPUT_DIR" 2>/dev/null | cut -f1)
    echo -e "${BLUE}📊 Taille totale: ${total_size}${NC}"
fi

echo ""
echo -e "${GREEN}✅ Conversion terminée avec succès !${NC}"
echo ""
echo "Les PDFs sont prêts pour distribution."
echo ""
