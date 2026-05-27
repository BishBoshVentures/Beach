import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  if (!email) {
    redirect("/login");
  }

  const sql = getDb();
  const rows = (await sql`
    SELECT name FROM allowed_users WHERE email = ${email} LIMIT 1
  `) as { name: string | null }[];

  if (rows.length === 0) {
    // Authenticated with Clerk but not in our allowlist —
    // /login page will show the not_authorised message; user can sign out from there.
    redirect("/login?error=not_authorised");
  }

  const name = rows[0].name || email.split("@")[0];
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-brand-bg">
      <Sidebar userEmail={email} />
      <div className="lg:ml-60">
        <Header title="Dashboard" userInitials={initials} />
        <main className="p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
