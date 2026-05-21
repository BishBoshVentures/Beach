import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase-server";
import type { Job } from "@/lib/types";
import JobDetail from "@/components/JobDetail";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServerComponentClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (!job) {
    notFound();
  }

  const typedJob = job as Job;

  return (
    <div>
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-teal transition-colors mb-4"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Projects
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {typedJob.job_name}
        </h1>
        {typedJob.job_number && (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
            Job #{typedJob.job_number}
          </span>
        )}
        {typedJob.client_type === "molson_coors" ? (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-teal/10 text-brand-teal">
            Molson Coors
          </span>
        ) : (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            General
          </span>
        )}
      </div>

      <JobDetail job={typedJob} />
    </div>
  );
}
