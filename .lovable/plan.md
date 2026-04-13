

## Plan : Transformation en Automax-dev

### Contexte
Renommer l'app, corriger le bug du logo sidebar, et créer un flux complet : formulaire client → IA génère les tâches → IA génère le prompt Lovable.

### Changements prévus

#### 1. Renommage "ProGest" → "Automax-dev"
- `index.html` : titre, meta descriptions, og:title
- `AppSidebar.tsx` : logo "A" + nom "Automax-dev"
- `Index.tsx` : texte du dashboard
- `mem://index.md` : mise à jour du nom

#### 2. Fix UX sidebar logo en mode collapsed
- Le logo "A" dans son carré bleu reste visible quand la sidebar est réduite, mais le texte "Automax-dev" disparait proprement (c'est déjà le cas mais on vérifie l'alignement et le spacing)

#### 3. Nouvelle table `client_intake_forms`
Migration SQL pour stocker les soumissions du formulaire d'entrée :
- `id`, `client_id` (FK → clients, nullable au départ), `project_name`, `project_type` (Site/SaaS/Plateforme/App mobile), `description`, `target_audience`, `key_features` (text), `design_references` (text), `budget_range`, `desired_deadline`, `tech_preferences` (text), `has_existing_branding` (boolean), `additional_notes`, `status` (nouveau/traité), `generated_tasks` (jsonb), `generated_prompt` (text), `created_at`
- RLS public (comme les autres tables)

#### 4. Page / formulaire d'intake client
- Nouvelle route `/intake` (ou accessible depuis la page Clients)
- Formulaire complet demandant : nom du projet, type, description détaillée, audience cible, fonctionnalités clés souhaitées, références de design, budget, deadline souhaitée, préférences techniques, branding existant, notes
- À la soumission : le client est créé dans `clients` + le formulaire est sauvé dans `client_intake_forms` + un projet est créé dans `projects`

#### 5. Intégration IA (OpenRouter)
- Edge function `supabase/functions/generate-tasks/index.ts` qui appelle OpenRouter avec le contenu du formulaire
- Modèle gratuit : `nvidia/nemotron-3-super-120b-a12b:free` (puissant, gratuit sur OpenRouter)
- **Étape 1 — Génération de tâches** : L'IA analyse le formulaire et retourne une liste de tâches avec titre, description, priorité (Haute/Moyenne/Basse), et ordre suggéré. Les tâches sont insérées dans la table `tasks` liées au projet
- **Étape 2 — Génération du prompt Lovable** : L'IA génère un prompt structuré pour démarrer le projet dans Lovable.dev. Affiché dans l'interface pour copier-coller
- Secret nécessaire : `OPENROUTER_API_KEY` — je te demanderai de la fournir

#### 6. UX dans l'app
- Depuis la page Clients ou Projets, bouton "Nouveau projet client" ouvre le formulaire d'intake
- Après soumission, redirection vers la page du projet avec les tâches IA pré-générées
- Sur la page projet, section affichant le prompt Lovable généré avec bouton "Copier"
- L'équipe peut ensuite modifier les tâches, ajouter deadlines et assignations

### Ce qui n'est PAS inclus dans cette étape
- Gestion d'erreurs/bugs avec formulaire text + image (prochaine étape)
- Envoi d'emails
- Validation de maquette

### Technique
- 1 migration SQL (table `client_intake_forms`)
- 1 edge function (OpenRouter)
- 1 nouvelle page (`ClientIntakeForm.tsx`)
- Modifications : `AppSidebar.tsx`, `index.html`, `App.tsx`, `ProjectDetail.tsx` (section prompt)
- Secret à demander : `OPENROUTER_API_KEY`

