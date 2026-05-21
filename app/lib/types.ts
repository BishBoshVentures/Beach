export interface Job {
  id: string;
  job_number: number | null;
  job_name: string;
  client_type: "molson_coors" | "general";
  stage: "enquiry" | "quoted" | "production" | "on_hold";
  brand: string | null;
  molson_owner: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  install_address: string | null;
  build_date: string | null;
  live_date: string | null;
  derig_date: string | null;
  build_manager: string | null;
  tc_signed: boolean;
  tc_signed_date: string | null;
  rams_status: "not_required" | "requested" | "received";
  po_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
