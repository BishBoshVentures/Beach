"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/projects": "Projects",
  "/dashboard/enquiries": "Enquiries",
  "/dashboard/settings": "Settings",
};

export default function DashboardHeader({
  userInitials,
}: {
  userInitials: string;
}) {
  const pathname = usePathname();
  const title = titles[pathname] || (pathname.startsWith("/dashboard/projects/") ? "Projects" : "Dashboard");
  return <Header title={title} userInitials={userInitials} />;
}
