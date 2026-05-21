CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_number integer,
  job_name text NOT NULL,
  client_type text NOT NULL CHECK (client_type IN ('molson_coors', 'general')),
  stage text NOT NULL DEFAULT 'enquiry' CHECK (stage IN ('enquiry', 'quoted', 'production', 'on_hold')),
  brand text,
  molson_owner text,
  contact_name text,
  contact_phone text,
  contact_email text,
  install_address text,
  build_date date,
  live_date date,
  derig_date date,
  build_manager text DEFAULT 'Bob',
  tc_signed boolean DEFAULT false,
  tc_signed_date date,
  rams_status text DEFAULT 'not_required' CHECK (rams_status IN ('not_required', 'requested', 'received')),
  po_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read jobs" ON public.jobs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert jobs" ON public.jobs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update jobs" ON public.jobs
  FOR UPDATE TO authenticated USING (true);

-- Seed data: real Molson Coors jobs from the existing spreadsheet
INSERT INTO public.jobs (job_number, job_name, client_type, stage, brand, molson_owner, notes) VALUES
  (86, 'Lansdown', 'molson_coors', 'quoted', 'Pravha', 'Sophie', 'Approving quote and sending PO'),
  (46, 'Park Plaza', 'molson_coors', 'quoted', null, 'Sophie H', 'Approving quote and sending PO'),
  (107, 'King Pin', 'molson_coors', 'quoted', 'Madri', 'Courtney', 'Waiting for feedback from visuals'),
  (132, 'The White Lion', 'molson_coors', 'quoted', 'Madri', 'Amie', 'Sent quote - waiting for the go ahead'),
  (123, 'Heron & Brearley', 'molson_coors', 'quoted', 'Aspall', 'Sarah', 'Waiting for approval'),
  (135, 'Covent Garden', 'molson_coors', 'quoted', 'Aspall', 'Courtney', 'Sent quote - need to know by end of week'),
  (121, 'Digbeth Dining Club', 'molson_coors', 'quoted', 'Madri', 'Eilish', 'Waiting to hear back re tops for oil drums'),
  (136, 'Aspall Getaway', 'molson_coors', 'production', 'Aspall', 'Amie', 'Suffolk - shepherds huts x2 nights, hamper'),
  (95, 'The Ladybird Pub', 'molson_coors', 'enquiry', 'Aspall', 'Alice', 'Waiting for feedback on visuals'),
  (96, 'The White Horse', 'molson_coors', 'enquiry', 'Madri', 'Alice', 'Waiting for feedback from visuals'),
  (127, 'The Red Lion', 'molson_coors', 'enquiry', 'Aspall', 'Amie', 'Need to book a site visit'),
  (134, 'Catapillars Bar', 'molson_coors', 'enquiry', null, 'Eilish', 'Sent quote and waiting for confirmation'),
  (87, 'The Vernon', 'molson_coors', 'enquiry', 'Aspall', 'Alice', 'Graffiti wall 5.4m by 1.8m - waiting for feedback and budget'),
  (143, 'Sixes Terrace', 'molson_coors', 'enquiry', 'Madri', 'Courtney', 'Waiting for feedback from ballpark figure'),
  (130, 'Graffiti Class', 'molson_coors', 'enquiry', 'Aspall', 'Amie', 'Sent quote for graffiti - waiting for others'),
  (41, 'Boathouse', 'molson_coors', 'on_hold', 'Offshore', 'Lisa/Tom', 'Quote sent but on hold due to timings'),
  (56, 'Sixes Terrace (Xmas)', 'molson_coors', 'on_hold', 'Madri', 'Alice', 'On hold - possible Christmas install'),
  (75, 'Curzon', 'molson_coors', 'on_hold', 'Madri', 'Sophie', 'Quote sent £7825.75 - no go'),
  (104, 'The Crystal Maze', 'molson_coors', 'on_hold', 'Madri', 'Courtney', 'Going ahead with graffiti only'),
  (115, 'Leicester Tigers', 'molson_coors', 'on_hold', 'Carling', 'Amie', 'Budget got slashed');
