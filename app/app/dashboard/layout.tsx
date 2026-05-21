import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase-server";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  // Get user name from allowed_users
  const { data: allowedUser, error: lookupError } = await supabase
    .from("allowed_users")
    .select("name")
    .eq("email", user.email)
    .single();

  if (lookupError || !allowedUser) {
    redirect("/login?error=not_authorised");
  }

  const name = allowedUser.name || user.email.split("@")[0];
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-brand-bg">
      <Sidebar userEmail={user.email} />
      <div className="lg:ml-60">
        <DashboardHeader userInitials={initials} />
        <main className="p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
