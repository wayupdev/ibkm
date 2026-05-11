import Nav from "@/components/nav";
import MobileNav from "@/components/mobile-nav";
import { requireProfile } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const name = `${profile.first_name} ${profile.last_name}`;

  return (
    <div className="min-h-screen">
      <Nav role={profile.role} name={name} />
      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
      <MobileNav role={profile.role} />
    </div>
  );
}
