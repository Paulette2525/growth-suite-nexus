

## Étape 1 — Création des tables de base de données

On commence par créer toute la structure backend avant de toucher au code. Voici les tables à créer :

### Tables

1. **profiles** — Infos utilisateur (nom, email, rôle, avatar)
   - `id` (uuid, FK → auth.users), `full_name`, `email`, `role` (Admin/Développeur/Designer/Chef de projet), `avatar_url`, `created_at`

2. **clients** — Fiches clients
   - `id`, `user_id` (propriétaire), `name`, `email`, `phone`, `status` (Actif/Inactif), `created_at`

3. **projects** — Projets
   - `id`, `user_id`, `name`, `type` (Site/SaaS/Plateforme), `status` (En cours/Terminé/En pause/En retard), `priority` (Haute/Moyenne/Basse), `client_id` (FK → clients), `description`, `start_date`, `deadline`, `created_at`

4. **project_members** — Liaison projets ↔ membres
   - `id`, `project_id`, `profile_id`

5. **tasks** — Tâches d'un projet
   - `id`, `project_id`, `title`, `status` (todo/in_progress/done), `priority`, `assignee_id` (FK → profiles), `created_at`

6. **invoices** — Factures
   - `id`, `user_id`, `client_id`, `project_id`, `invoice_number`, `amount`, `status` (Brouillon/Envoyé/Payé), `date`, `created_at`

### Sécurité
- RLS activé sur toutes les tables
- Politiques basées sur `user_id = auth.uid()` pour les tables principales
- `profiles` accessible en lecture pour les membres de la même équipe

### Authentification
- Inscription/connexion par email + mot de passe
- Page Auth avec formulaire login/signup
- Routes protégées (redirection vers /auth si non connecté)
- Profil créé automatiquement via trigger `on_auth_user_created`

---

**Cette étape 1 se concentre uniquement sur :**
1. Migration SQL (tables + RLS + trigger profil)
2. Page d'authentification (login/signup)
3. Protection des routes
4. Suppression des données mockées (les pages afficheront des listes vides)

Les étapes suivantes connecteront chaque page (Projets, Équipe, Clients, Facturation) une par une à la base de données avec les formulaires de création fonctionnels.

