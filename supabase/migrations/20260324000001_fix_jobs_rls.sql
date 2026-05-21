-- Drop existing policies on jobs and recreate them cleanly
DROP POLICY IF EXISTS "Authenticated users can read jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can update jobs" ON public.jobs;

-- Recreate with explicit grants
CREATE POLICY "Authenticated users can read jobs" ON public.jobs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert jobs" ON public.jobs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update jobs" ON public.jobs
  FOR UPDATE TO authenticated USING (true);

-- Ensure the table has SELECT grant for authenticated role
GRANT SELECT, INSERT, UPDATE ON public.jobs TO authenticated;
