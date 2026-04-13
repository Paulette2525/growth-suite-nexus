
-- Make user_id nullable
ALTER TABLE public.projects ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.clients ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN user_id DROP NOT NULL;

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users manage own projects" ON public.projects;
DROP POLICY IF EXISTS "Users manage own clients" ON public.clients;
DROP POLICY IF EXISTS "Users manage own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Project members visible to project owner" ON public.project_members;
DROP POLICY IF EXISTS "Tasks visible to project owner" ON public.tasks;

-- Create open policies (no auth)
CREATE POLICY "Allow all on projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on project_members" ON public.project_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
