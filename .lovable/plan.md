

## Plan : Abonnements + Pages de détail Client & Membre

### 1. Table `subscriptions` (migration SQL)

Nouvelle table pour suivre les abonnements liés aux projets :

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | |
| project_id | uuid FK projects | Projet lié |
| name | text | Nom (ex: "Domaine OVH", "API OpenAI") |
| type | text | "mensuel" ou "annuel" |
| amount | numeric | Coût |
| start_date | date | Début |
| renewal_date | date | Prochaine échéance |
| status | text | "actif", "expiré", "annulé" |
| category | text | "api", "domaine", "hébergement", "autre" |
| notes | text | Notes libres |
| created_at, updated_at | timestamptz | |

RLS : Allow all (comme les autres tables du projet).

### 2. Refonte de `Billing.tsx`

Ajouter un système d'onglets (Tabs) : **Factures** | **Abonnements**

**Onglet Abonnements :**
- CRUD complet (ajouter, modifier, supprimer)
- Tableau avec : nom, projet, type (mensuel/annuel), montant, échéance, statut, catégorie
- **Alertes visuelles** : badge rouge/orange si l'échéance est dans moins de 2 semaines
- Stats en haut : Total dépenses abonnements/mois, nombre d'abonnements actifs, prochaine échéance

**Stats enrichies (cards en haut) :**
- Ajouter une 4e card : "Dépenses abonnements" (somme mensuelle des abonnements actifs)
- Garder les 3 cards existantes (Total facturé, Payé, En attente)

### 3. Page `ClientDetail.tsx` (nouvelle)

Route : `/clients/:id`

Contenu :
- **En-tête** : nom, entreprise, email, téléphone, statut, date d'ajout
- **Stats cards** : Total payé, Factures en attente, Nombre de projets
- **Liste des projets** du client (depuis table `projects` via `client_id`)
- **Historique des factures** du client (depuis `invoices` via `client_id`)
- Bouton retour vers `/clients`

Rendre les cards cliquables dans `Clients.tsx` (navigate vers `/clients/:id`).

### 4. Page `TeamMemberDetail.tsx` (nouvelle)

Route : `/equipe/:id`

Contenu :
- **En-tête** : avatar, nom, email, rôle, date d'ajout
- **Stats cards** : Tâches terminées, Taux de complétion, Projets assignés
- **Projets** auxquels il participe (via `project_members`)
- **Tâches assignées** groupées par statut (todo, in_progress, done)
- **Performance** : graphique simple ou indicateurs (tâches faites ce mois, charge actuelle)
- Bouton retour vers `/equipe`

Rendre les cards cliquables dans `Team.tsx`.

### 5. Routes (App.tsx)

Ajouter :
- `/clients/:id` → `ClientDetail`
- `/equipe/:id` → `TeamMemberDetail`

### Fichiers

- 1 migration SQL (table `subscriptions`)
- Nouveau : `src/pages/ClientDetail.tsx`, `src/pages/TeamMemberDetail.tsx`
- Modifiés : `src/pages/Billing.tsx` (onglets + abonnements), `src/pages/Clients.tsx` (cards cliquables), `src/pages/Team.tsx` (cards cliquables), `src/App.tsx` (routes)

