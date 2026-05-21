import Link from "next/link";
import { createServerComponentClient } from "@/lib/supabase-server";
import type { Job } from "@/lib/types";

const stageConfig = {
  enquiry: { label: "Enquiries", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  quoted: { label: "Quoted", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  production: { label: "In Production", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
  on_hold: { label: "On Hold", color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200" },
} as const;

function StageBadge({ stage }: { stage: Job["stage"] }) {
  const config = stageConfig[stage];
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  );
}

function ClientBadge({ clientType }: { clientType: Job["client_type"] }) {
  return clientType === "molson_coors" ? (
    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
      Molson Coors
    </span>
  ) : (
    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500">
      General
    </span>
  );
}

export default async function DashboardPage() {
  const supabase = createServerComponentClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: allowedUser } = await supabase
    .from("allowed_users")
    .select("name")
    .eq("email", user?.email ?? "")
    .maybeSingle();

  const firstName = allowedUser?.name?.split(" ")[0] || "there";

  // Fetch all jobs for counts
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .order("updated_at", { ascending: false });

  const allJobs = (jobs as Job[]) || [];

  const counts = {
    enquiry: allJobs.filter((j) => j.stage === "enquiry").length,
    quoted: allJobs.filter((j) => j.stage === "quoted").length,
    production: allJobs.filter((j) => j.stage === "production").length,
    on_hold: allJobs.filter((j) => j.stage === "on_hold").length,
  };

  const molsonCount = allJobs.filter((j) => j.client_type === "molson_coors").length;
  const generalCount = allJobs.filter((j) => j.client_type === "general").length;

  const recentJobs = allJobs.slice(0, 5);

  const statCards = [
    { key: "enquiry" as const, icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01" },
    { key: "quoted" as const, icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { key: "production" as const, icon: "M5 13l4 4L19 7" },
    { key: "on_hold" as const, icon: "M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">
        Welcome back, {firstName}.
      </h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const config = stageConfig[card.key];
          return (
            <div
              key={card.key}
              className={`bg-white rounded-xl border ${config.border} p-4 sm:p-5`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={config.color}
                  >
                    <path d={card.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {counts[card.key]}
                  </p>
                  <p className="text-xs text-gray-500">{config.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Client split */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-purple-200 p-4 sm:p-5">
          <p className="text-2xl font-bold text-gray-900">{molsonCount}</p>
          <p className="text-xs text-gray-500">Molson Coors Jobs</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <p className="text-2xl font-bold text-gray-900">{generalCount}</p>
          <p className="text-xs text-gray-500">General Jobs</p>
        </div>
      </div>

      {/* Recent jobs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Recent Jobs</h3>
          <Link
            href="/dashboard/projects"
            className="text-xs text-brand-teal hover:text-brand-teal-dark font-medium transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentJobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between px-5 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {job.job_number ? `#${job.job_number} ` : ""}
                  {job.job_name}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <ClientBadge clientType={job.client_type} />
                <StageBadge stage={job.stage} />
              </div>
            </div>
          ))}
          {recentJobs.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              No jobs yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
