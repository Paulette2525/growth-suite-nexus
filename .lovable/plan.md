

## ProGest — SaaS de gestion de projets & d'équipes

### Design
- **Palette** : Cloud White (#fafbfc, #e8ecf1, #94a3b8, #3b82f6)
- **Typo** : Sora (titres) + Manrope (corps)
- **Layout** : Dashboard avec sidebar collapsible
- **Langue** : Français

### Pages & fonctionnalités

#### 1. Authentification
- Page de connexion / inscription (email + mot de passe)
- Protection des routes

#### 2. Dashboard global
- KPIs en haut : nombre de projets actifs, tâches en cours, membres d'équipe, factures en attente
- Graphique d'avancement des projets (barre de progression)
- Liste des activités récentes
- Projets nécessitant une attention

#### 3. Gestion de projets
- Liste des projets avec filtres (statut, type : plateforme/site/SaaS, priorité)
- Création de projet : nom, type, client associé, date de début/fin, description
- Page détail projet avec :
  - Vue Kanban des tâches (À faire / En cours / Terminé)
  - Barre de progression
  - Membres assignés
  - Timeline / échéances

#### 4. Gestion d'équipes
- Liste des membres avec rôles (Admin, Développeur, Designer, Chef de projet)
- Invitation par email
- Vue de la charge de travail par membre (combien de tâches assignées)
- Profil membre avec ses projets et tâches

#### 5. Suivi clients & facturation
- Liste des clients avec infos de contact
- Projets liés par client
- Création de devis/factures simples (PDF)
- Statuts : Brouillon → Envoyé → Payé

#### 6. Sidebar navigation
- Logo + nom de l'app
- Dashboard, Projets, Équipe, Clients, Facturation
- Icône de profil / déconnexion en bas
- Collapsible en mode icônes

### Backend (Lovable Cloud)
- Base de données : tables projets, tâches, membres, clients, factures
- Auth avec email/mot de passe
- RLS pour la sécurité des données

### Phase 1 (implémentation initiale)
On commence par le **dashboard**, la **sidebar**, la **gestion de projets** avec Kanban, et la **gestion d'équipe**. La facturation viendra en phase 2.

