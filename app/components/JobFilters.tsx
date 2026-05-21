"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function JobFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") || "all";

  const setFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("filter");
    } else {
      params.set("filter", value);
    }
    router.push(`/dashboard/projects?${params.toString()}`);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setFilter("all")}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          filter === "all"
            ? "bg-brand-teal text-white"
            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
        }`}
      >
        All Jobs
      </button>
      <button
        onClick={() => setFilter("molson_coors")}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          filter === "molson_coors"
            ? "bg-brand-teal text-white"
            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
        }`}
      >
        Molson Coors
      </button>
    </div>
  );
}
