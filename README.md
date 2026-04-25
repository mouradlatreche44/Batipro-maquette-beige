# Landing Batiproconnect — `/formulaire-maquette/`

Landing standalone (HTML/CSS/JS vanilla) destinée à remplacer la page WordPress/Elementor existante sur `https://batiproconnect.com/formulaire-maquette/`.

---

## 📁 Structure

```
landing-batipro/
├── index.html          # Page complète
├── assets/
│   ├── css/style.css   # Styles
│   ├── js/script.js    # Multi-step form + animations
│   └── img/            # Photos chantiers (déjà fournies)
└── README.md
```

---

## 🚀 Intégration sur Hostinger / WordPress

Comme le site est sous WordPress + Elementor, il y a **3 options** pour pousser cette landing sur l'URL `/formulaire-maquette/` :

### ✅ Option 1 — Plugin "Insert Headers and Footers" + page vide (le plus simple)

1. **Désactiver Elementor sur la page** `formulaire-maquette` :
   - Dans WP, ouvrez la page → "Modifier avec Elementor" → revenez à l'éditeur classique
   - Mettre le contenu vide
   - Choisir un template **"Pleine largeur sans titre"** (Astra, GeneratePress, OceanWP) ou installer le plugin **"Page Builder by SiteOrigin"** > template "Vierge".

2. **Uploader les assets** via FTP/Hostinger File Manager :
   ```
   /wp-content/uploads/landing-batipro/
   ├── style.css
   ├── script.js
   └── img/
       ├── showcase-bso.jpeg
       ├── showcase-toiture.jpg
       ├── showcase-elec.jpeg
       ├── showcase-plomb.jpeg
       ├── showcase-reno.jpg
       └── ...
   ```

3. **Modifier les chemins** dans `index.html` :
   - `assets/css/style.css` → `https://batiproconnect.com/wp-content/uploads/landing-batipro/style.css`
   - `assets/js/script.js` → `https://batiproconnect.com/wp-content/uploads/landing-batipro/script.js`
   - `assets/img/...` → `https://batiproconnect.com/wp-content/uploads/landing-batipro/img/...`

4. **Coller le HTML** dans la page WP via un bloc HTML personnalisé (Gutenberg) ou Elementor widget "HTML".

---

### ✅ Option 2 — Page PHP custom (le plus propre, recommandé)

1. Via FTP, créez un fichier `page-formulaire-maquette.php` à la racine du thème enfant :

```php
<?php
/* Template Name: Landing Maquette */
get_header(); // optionnel — supprimer si vous voulez 0 header WP
?>
<!-- Coller ici tout le contenu entre <body>...</body> de index.html -->
<?php
get_footer(); // optionnel
```

2. Sur la page WP `formulaire-maquette`, dans les attributs de page → choisir le template **"Landing Maquette"**.
3. Uploader les assets dans `wp-content/uploads/landing-batipro/` et corriger les chemins.

---

### ✅ Option 3 — Page totalement statique hors WP (le plus rapide)

1. Uploader tout le dossier `landing-batipro/` à la racine d'Hostinger : `/public_html/formulaire-maquette/`.
2. Dans WP, désactiver/supprimer la page WP `/formulaire-maquette/` (sinon elle prend le pas).
3. La landing sera servie directement depuis `https://batiproconnect.com/formulaire-maquette/index.html`.
4. ⚠️ Vous perdez le header/footer WP et la cohérence avec le reste du site.

---

## 🔌 Configurer l'envoi du formulaire

Dans `assets/js/script.js`, cherchez `submitForm` et remplissez `ENDPOINT` :

```js
const ENDPOINT = 'https://hook.eu1.make.com/XXXXX'; // Make / Zapier / n8n / webhook Brevo / etc.
```

**Options recommandées** :
- **Brevo (formulaire intégré)** : utilisez l'API forms ou un webhook
- **Make.com / Zapier** : le plus simple, webhook → email + Brevo + Notion
- **WordPress REST API** : créer un endpoint custom `/wp-json/batipro/v1/lead`
- **Plugin "WPForms" en mode webhook** uniquement (pas le rendu)

Tant que `ENDPOINT` est vide, le formulaire affiche le message de succès en mode démo et log les données dans la console.

---

## 🎨 Personnalisation rapide

| Élément | Fichier | Sélecteur |
|---|---|---|
| Couleurs | `assets/css/style.css` | `:root` (variables CSS en haut) |
| Logo | `index.html` | `.nav-logo img` et `.footer-logo` |
| Tarif | `index.html` | `.pricing-amount` / `.pricing-ttc` |
| FAQ | `index.html` | `<details class="faq-item">` |
| Photos showcase | `assets/img/` | remplacer les fichiers en gardant les mêmes noms |

---

## ✅ Checklist avant mise en ligne

- [ ] Endpoint webhook configuré dans `script.js`
- [ ] Photos finales uploadées (ou conserver les actuelles)
- [ ] Logo Batiproconnect accessible publiquement
- [ ] Test mobile (iPhone Safari, Android Chrome, in-app Facebook/Instagram)
- [ ] Test du formulaire en bout de chaîne (réception du lead côté Brevo/Make)
- [ ] Vérification UTM : `?utm_source=landing&utm_medium=cta&utm_campaign=maquette&utm_content=...`
- [ ] Open Graph image à mettre à jour si besoin (`<meta property="og:image">`)

---

## 🛠 Tech

- HTML sémantique, accessible (aria-labels, focus visibles, navigation clavier)
- CSS pur, mobile-first, animations CSS + Intersection Observer
- JS vanilla, ~6 KB, pas de dépendance
- Compatible IE11 ❌ / Chrome/Firefox/Safari modernes ✅
- Respecte `prefers-reduced-motion`
