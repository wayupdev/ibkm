import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/page-header";
import NewUserForm from "./new-user-form";
import UserActions from "./user-actions";

export default async function UsersPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "*, family:families!profiles_family_id_fkey(id, name), family_links:family_members(family:families(id, name))",
    )
    .order("role").order("last_name");
  if (error) {
    console.error(
      "[admin/users] profiles fetch failed:",
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Utilisateurs"
        subtitle="Comptes administrateurs, parents et jeunes."
        action={<NewUserForm />}
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Nom</th>
              <th className="p-3">Rôle</th>
              <th className="p-3 hidden md:table-cell">Famille</th>
              <th className="p-3 hidden md:table-cell">Créé</th>
              <th className="p-3 w-1"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(profiles ?? []).map((p) => {
              const ownFam = Array.isArray(p.family) ? p.family[0] : p.family;
              const linkedFams = (p.family_links ?? [])
                .map((l: { family: { id: string; name: string } | { id: string; name: string }[] | null }) =>
                  Array.isArray(l.family) ? l.family[0] : l.family,
                )
                .filter((f: { id: string; name: string } | null | undefined): f is { id: string; name: string } => !!f);
              const familyNames = ownFam
                ? [ownFam.name]
                : Array.from(new Set(linkedFams.map((f: { name: string }) => f.name)));
              return (
                <tr key={p.id}>
                  <td className="p-3">
                    <div className="font-medium">{p.first_name} {p.last_name}</div>
                  </td>
                  <td className="p-3 capitalize">{p.role}</td>
                  <td className="p-3 hidden md:table-cell">
                    {familyNames.length > 0 ? familyNames.join(", ") : "—"}
                  </td>
                  <td className="p-3 hidden md:table-cell text-slate-500">
                    {format(new Date(p.created_at), "PPP", { locale: fr })}
                  </td>
                  <td className="p-3">
                    <UserActions userId={p.id} />
                  </td>
                </tr>
              );
            })}
            {(profiles ?? []).length === 0 && (
              <tr><td className="p-4 text-slate-500" colSpan={5}>Aucun utilisateur.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
