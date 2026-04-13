
CREATE TABLE public.client_intake_forms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name text NOT NULL,
  client_email text,
  client_company text,
  project_name text NOT NULL,
  project_type text NOT NULL DEFAULT 'SaaS',
  description text NOT NULL,
  target_audience text,
  key_features text,
  design_references text,
  budget_range text,
  desired_deadline text,
  tech_preferences text,
  has_existing_branding boolean DEFAULT false,
  additional_notes text,
  status text NOT NULL DEFAULT 'nouveau',
  generated_tasks jsonb,
  generated_prompt text,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.client_intake_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on client_intake_forms"
ON public.client_intake_forms
FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_client_intake_forms_updated_at
BEFORE UPDATE ON public.client_intake_forms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
