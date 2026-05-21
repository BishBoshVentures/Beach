import Link from "next/link";
import { createServerComponentClient } from "@/lib/supabase-server";
import type { Job } from "@/lib/types";
import AddJobModal from "@/components/AddJobModal";
import JobFilters from "@/components/JobFilters";

const stages = [
  {
    key: "enquiry",
    label: "Enquiry",
    bg: "bg-amber-50",
    badge: "bg-amber-100 text-amber-800",
    border: "border-amber-200",
  },
  {
    key: "quoted",
    label: "Quoted",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-800",
    border: "border-blue-200",
  },
  {
    key: "production",
    label: "Production",
    bg: "bg-green-50",
    badge: "bg-green-100 text-green-800",
    border: "border-green-200",
  },
  {
    key: "on_hold",
    label: "On Hold",
    bg: "bg-gray-50",
    badge: "bg-gray-100 text-gray-600",
    border: "border-gray-200",
  },
] as const;

function StageBadge({ stage }: { stage: Job["stage"] }) {
  const config = stages.find((s) => s.key === stage);
  if (!config) return null;
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}
    >
      {config.label}
    </span>
  );
}

function JobCard({ job }: { job: Job }) {
  return (
    <Link
      href={`/dashboard/projects/${job.id}`}
      className="block bg-white rounded-lg border border-gray-100 p-3 shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="text-sm font-medium text-gray-900 leading-tight">
          {job.job_number ? `#${job.job_number} ` : ""}
          {job.job_name}
        </h3>
        <StageBadge stage={job.stage} />
      </div>
      {job.brand && (
        <p className="text-xs text-gray-500 mb-1">{job.brand}</p>
      )}
      {job.molson_owner && (
        <p className="text-xs text-gray-400">
          Owner: <span className="text-gray-600">{job.molson_owner}</span>
        </p>
      )}
      {job.notes && (
        <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">
          {job.notes}
        </p>
      )}
    </Link>
  );
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const supabase = createServerComponentClient();

  let query = supabase
    .from("jobs")
    .select("*")
    .order("stage")
    .order("job_number", { ascending: true, nullsFirst: false });

  if (params.filter === "molson_coors") {
    query = query.eq("client_type", "molson_coors");
  }

  const { data: jobs } = await query;
  const allJobs = (jobs as Job[]) || [];

  const grouped = stages.map((stage) => ({
    ...stage,
    jobs: allJobs.filter((j) => j.stage === stage.key),
  }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <JobFilters />
        <AddJobModal />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {grouped.map((col) => (
          <div
            key={col.key}
            className={`rounded-xl ${col.bg} border ${col.border} p-4`}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">
                {col.label}
              </h2>
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${col.badge}`}
              >
                {col.jobs.length}
              </span>
            </div>
            <div className="space-y-2">
              {col.jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
              {col.jobs.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">
                  No jobs
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
