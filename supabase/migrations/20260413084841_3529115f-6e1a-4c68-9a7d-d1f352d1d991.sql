
-- Remove FK constraint on profiles.id referencing auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Remove the trigger that creates profiles on auth user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Also remove FK on tasks.assignee_id and project_members.profile_id pointing to profiles, then re-add without issues
-- (these should be fine since they reference profiles.id which stays uuid, but let's ensure they exist properly)
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.project_members DROP CONSTRAINT IF EXISTS project_members_profile_id_fkey;
ALTER TABLE public.project_members ADD CONSTRAINT project_members_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
