# Générateur d'Étiquettes

Application web pour générer des étiquettes avec codes-barres, QR codes et validation IMEI pour appareils mobiles.

## Fonctionnalités

- Création d'étiquettes personnalisées avec modèle et couleur d'appareil
- Génération de codes-barres pour IMEI 1 et IMEI 2 avec validation (exactement 15 chiffres)
- Code QR intégrant les informations principales
- Support pour numéro de série au format D/N
- Logo circulaire avec lettre personnalisable
- Export PDF optimisé (20 étiquettes par page A4)
- Mode hors ligne (PWA) pour utilisation sur mobile
- Interface responsive

## Technologies utilisées

- React + Vite
- TailwindCSS pour le styling
- html2canvas pour la capture des éléments
- jsPDF pour la génération de PDF
- jsBarcode pour les codes-barres
- react-qr-code pour les QR codes

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/votre-nom/generateur-etiquettes.git
cd generateur-etiquettes

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

## Déploiement

L'application est configurée comme une Progressive Web App (PWA) et peut être utilisée hors ligne après installation :

```bash
# Construire l'application pour la production
npm run build

# Prévisualiser la version de production
npm run preview
```

## Auteur

Conçu avec soin par KOFFI GUILLAUME - 0708997069
