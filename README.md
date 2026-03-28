# Simulateur de budget mensuel

Application web statique pour planifier un budget mensuel, visualiser la repartition des depenses, suivre le ratio de loyer et exporter les donnees en PDF/Excel.

## Apercu

- Edition rapide du salaire, du loyer et des categories
- Calcul automatique des totaux et du solde restant
- Indicateur visuel du ratio loyer/salaire
- Graphique en anneau (Chart.js) avec legendes
- Export en PDF et en fichier Excel
- Interface responsive (desktop/mobile)

Site publie: https://gourguesnicolas.github.io/simulateur-budget-mensuel/

## Stack technique

- HTML5
- CSS3
- JavaScript (Vanilla)
- Chart.js
- jsPDF + AutoTable
- ExcelJS (+ XLSX)

## Structure du projet

- index.html : structure de la page
- style.css : styles, responsive et composants UI
- functions.js : logique applicative, calculs, graphique et exports

## Lancer le projet en local

Comme il s'agit d'un site statique, deux options:

1. Ouvrir index.html directement dans le navigateur
2. Ou lancer un petit serveur local

Exemple avec Python:

python -m http.server 5500

Puis ouvrir:

http://localhost:5500

## Deploiement GitHub Pages

Le projet est deploye via la branche main:

1. Aller dans les settings du depot GitHub
2. Ouvrir la section Pages
3. Source: Deploy from a branch
4. Branch: main
5. Folder: / (root)
6. Save

Une fois active, chaque push sur main met a jour le site automatiquement.

## Fonctionnalites detaillees

- Edition inline:
	- Salaire mensuel
	- Montant du loyer
	- Pourcentage de loyer
	- Noms et montants des categories
- Gestion des categories:
	- Ajout de categories
	- Suppression de categories
- Alerte budget:
	- Message d'avertissement si depenses trop elevees
- Exports:
	- PDF avec tableau recapitulatif
	- Excel avec donnees budget

## Roadmap (idees)

- Sauvegarde locale automatique (LocalStorage)
- Presets de budgets (etudiant, famille, etc.)
- Mode impression plus detaille
- Ajout d'un mode multidevises

## Auteur

Nicolas Gourgues

- Site: https://nicolasgourgues.com/
- GitHub: https://github.com/gourguesnicolas
