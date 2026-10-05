# Legaleo — banc typo éditeur

Page statique pour choisir la typographie de la zone d'édition des contrats et modèles
(`.rte-editor-area` / `.rte-wrapper.page-layout .ProseMirror`, toutes les pages éditeur).

**En ligne :** https://alexandre-legaleo.github.io/legaleo-typo-showcase/

## Ce qui est reproduit

Copie des règles de `components/rich-editor/styles/editor.css` et de la config
`PaginationPlus` (`hooks/useRichEditor.ts`) :

- page A4 794 × 1123 px, marges 60 px, fond `#f8fafd`, texte `#111827` ;
- corps 11pt, interlignage 1.6, paragraphes `0 0 0.75em` ;
- titres h1–h6 : 20 / 16 / 14 / 12 / 11 / 10pt (h1 en 700, les autres en 600) ;
- listes, tableau, citation, filet, chips de variables `{{…}}`.

Aujourd'hui l'éditeur n'impose aucune police : il hérite de **Manrope** (`app/layout.tsx`),
d'où sa présence comme référence.

## Utilisation

- **Page** : le texte sur une page, éditable directement. `←` / `→` font défiler les polices.
- **Comparer** : les polices cochées côte à côte, mêmes réglages.
- **Aperçu** : un extrait par police, clic pour l'ouvrir en page.
- **Copier le CSS** : les règles à coller dans `editor.css`, avec l'import `next/font/google` correspondant.
- **Copier le lien** : l'URL porte tous les réglages (pas le texte).
- **Remplacer le texte** : HTML (copié depuis l'éditeur) ou texte brut (`#` titre, `- ` puce).
  Le texte perso reste dans le navigateur (`localStorage`) et n'est envoyé nulle part.

⚠️ Repo public : ne pas y committer de texte issu d'un vrai contrat client.

## Ajouter une police

Une entrée dans `FONTS` en tête de `app.js` (`italic: false` si la famille n'a pas d'italique
sur Google Fonts, sinon la requête de la police échoue).

## En local

```bash
python3 -m http.server 8000
# http://localhost:8000
```
