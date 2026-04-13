
-- Bug reports table
CREATE TABLE public.bug_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'ouvert',
  reporter_name TEXT NOT NULL,
  reporter_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on bug_reports"
  ON public.bug_reports FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_bug_reports_updated_at
  BEFORE UPDATE ON public.bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for bug screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('bug-images', 'bug-images', true);

CREATE POLICY "Anyone can upload bug images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bug-images');

CREATE POLICY "Anyone can view bug images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bug-images');
