

## Plan : Optimisation du formulaire client pour création automatique

### Objectif
Transformer le formulaire public `/formulaire` pour collecter toutes les informations nécessaires à la création automatique d'une première version de la plateforme, sans avoir à recontacter le client.

### Changements

#### 1. Supprimer du formulaire
- **Budget estimé** (select)
- **Préférences techniques** (input)

#### 2. Nouvelles questions stratégiques à ajouter

**Section "Identité visuelle"** (remplace l'ancien toggle branding) :
- **Upload logo** : champ fichier pour uploader un logo (stocké dans le bucket `bug-images` ou un nouveau bucket `client-assets`)
- **Upload charte graphique** : champ fichier pour uploader un PDF ou images de charte
- **Couleurs préférées** : input texte — "Quelles couleurs souhaitez-vous ? (ex: bleu foncé, doré, blanc)" + micro
- **Style visuel souhaité** : select avec options (Moderne & épuré, Coloré & dynamique, Sobre & professionnel, Luxe & élégant, Autre)
- **Ambiance / ton** : select (Sérieux, Décontracté, Premium, Jeune & fun)

**Section "Votre activité"** (nouvelle) :
- **Que vendez-vous / proposez-vous ?** : textarea + micro — produits, services, offres
- **Quelles sont vos offres / formules ?** : textarea + micro — détail des prix, packs, abonnements
- **Avez-vous un site ou réseau social existant ?** : input — URL du site actuel, Instagram, etc.

**Section "Structure souhaitée"** (nouvelle) :
- **Quelles pages souhaitez-vous ?** : checkboxes multiples (Accueil, À propos, Services/Offres, Contact, Blog, Témoignages, FAQ, Espace client, Portfolio, Boutique en ligne, Autre)
- **Avez-vous des exemples de sites qui vous plaisent ?** : textarea (déplace les "références design" ici) + micro

#### 3. Réorganisation des sections
1. **Vos informations** — nom, email, entreprise (inchangé)
2. **Votre activité** — produit/service, offres, site existant, cible
3. **Votre projet** — nom, type, description détaillée, pages souhaitées
4. **Identité visuelle** — logo upload, charte upload, couleurs, style, ambiance, exemples de sites
5. **Délais & Notes** — deadline, "autre chose à nous dire"

#### 4. Migration SQL
Ajouter les colonnes à `client_intake_forms` :
- `primary_colors` text
- `visual_style` text
- `brand_tone` text
- `product_description` text
- `offers_description` text
- `existing_website` text
- `desired_pages` jsonb (array de strings)
- `logo_url` text
- `brand_guide_url` text

#### 5. Bucket storage
Créer un bucket `client-assets` (public) pour les uploads de logos et chartes graphiques.

#### 6. Mise à jour de l'edge function
Mettre à jour `generate-tasks/index.ts` pour inclure les nouveaux champs dans le `formSummary` envoyé à l'IA, afin que les tâches et le prompt générés soient plus précis.

#### 7. Micro (VoiceInput)
Ajouter le micro sur tous les nouveaux champs textarea : produit/service, offres, couleurs préférées.

### Technique
- 1 migration SQL (nouvelles colonnes + bucket)
- Modifications : `PublicIntakeForm.tsx` (refonte complète du formulaire), `generate-tasks/index.ts` (nouveaux champs dans le prompt IA)
- Pas de nouvelles dépendances

