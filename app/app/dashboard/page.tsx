import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";

export default async function DashboardPage() {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const sql = getDb();
  const rows = (await sql`
    SELECT name FROM allowed_users WHERE email = ${email} LIMIT 1
  `) as { name: string | null }[];

  const firstName = rows[0]?.name?.split(" ")[0] || "there";

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center max-w-md mx-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          Welcome back, {firstName}.
        </h2>
        <p className="text-sm text-gray-400">More coming soon.</p>
      </div>
    </div>
  );
}
