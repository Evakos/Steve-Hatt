import { redirect } from "next/navigation";
import { isStaffAuthenticated } from "@/lib/staff-auth";
import AdminSidebar from "./admin-sidebar";

/**
 * Gates every page in this route group (Orders, Products) and provides the persistent sidebar —
 * a second, structural layer of defense alongside proxy.ts's matcher-based gate (see proxy.ts's
 * own "Good to know" note on why matcher coverage alone isn't trusted). /admin/login sits outside
 * this group deliberately, so it never gets wrapped in the authenticated dashboard shell.
 */
export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  if (!(await isStaffAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
