

## Plan : Refonte du formulaire client avec questions stratégiques complètes

### Objectif
Collecter toutes les informations nécessaires pour créer automatiquement la première version de la plateforme du client.

### Supprimer
- Budget estimé
- Préférences techniques

### Nouvelles sections (ordre final)

**1. Vos informations** (inchangé) — nom, email, entreprise

**2. Votre activité & Offres**
- Que vendez-vous / proposez-vous ? (textarea + micro)
- Quelles sont vos offres / formules / tarifs ? (textarea + micro)
- Avez-vous un site ou réseau social existant ? (input URL)

**3. Cible & Marché** (nouveau)
- Qui est votre client idéal ? (textarea + micro)
- Quels sont vos principaux concurrents ? (textarea + micro)
- Quel est votre positionnement / différence clé ? (textarea + micro)

**4. Votre projet**
- Nom du projet, type, description détaillée (existant)
- Quelles pages souhaitez-vous ? — checkboxes : Accueil, À propos, Services/Offres, Contact, Blog, Témoignages, FAQ, Espace client, Portfolio, Boutique en ligne
- Exemples de sites qui vous plaisent ? (textarea + micro, remplace "références design")

**5. Identité visuelle**
- Upload logo (fichier image)
- Upload charte graphique (PDF/image)
- Couleurs préférées (input texte + micro)
- Style visuel : select (Moderne & épuré, Coloré & dynamique, Sobre & professionnel, Luxe & élégant)
- Ambiance / ton : select (Sérieux, Décontracté, Premium, Jeune & fun)

**6. Délais & Notes**
- Deadline souhaitée (inchangé)
- Autre chose à nous dire (textarea + micro, inchangé)

### Migration SQL
Ajouter à `client_intake_forms` :
- `primary_colors` text
- `visual_style` text
- `brand_tone` text
- `product_description` text
- `offers_description` text
- `existing_website` text
- `ideal_customer` text
- `competitors` text
- `positioning` text
- `desired_pages` jsonb
- `logo_url` text
- `brand_guide_url` text

### Storage
Créer bucket `client-assets` (public) pour logos et chartes.

### Edge Function
Mettre à jour `generate-tasks/index.ts` pour inclure tous les nouveaux champs dans le prompt IA (activité, cible, marché, identité visuelle, pages souhaitées).

### Fichiers modifiés
- `PublicIntakeForm.tsx` — refonte complète
- `generate-tasks/index.ts` — enrichissement du prompt
- 1 migration SQL

