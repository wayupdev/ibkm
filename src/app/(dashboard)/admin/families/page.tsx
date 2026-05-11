import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { Pencil, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/page-header";
import NewFamilyForm from "./new-family-form";

export default async function FamiliesPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: families } = await supabase
    .from("families")
    .select("id, name, notes, created_at")
    .order("name");

  const ids = (families ?? []).map((f) => f.id);
  const [{ data: children }, { data: parentLinks }] = ids.length
    ? await Promise.all([
        supabase.from("profiles").select("id, family_id, first_name, last_name").eq("role", "child").in("family_id", ids),
        supabase.from("family_members").select("family_id, profile_id").in("family_id", ids),
      ])
    : [
        { data: [] as { id: string; family_id: string; first_name: string; last_name: string }[] },
        { data: [] as { family_id: string; profile_id: string }[] },
      ];

  const childrenByFamily = new Map<string, { id: string; first_name: string; last_name: string }[]>();
  (children ?? []).forEach((c) => {
    const arr = childrenByFamily.get(c.family_id!) ?? [];
    arr.push(c);
    childrenByFamily.set(c.family_id!, arr);
  });

  const parentCount = new Map<string, number>();
  (parentLinks ?? []).forEach((p) => {
    parentCount.set(p.family_id, (parentCount.get(p.family_id) ?? 0) + 1);
  });

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Familles"
        subtitle="Regroupements de jeunes et de parents."
        action={<NewFamilyForm />}
      />

      <ul className="card divide-y">
        {(families ?? []).map((f) => {
          const kids = childrenByFamily.get(f.id) ?? [];
          return (
            <li key={f.id} className="p-4 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{f.name}</span>
                  <span className="text-xs text-slate-500">
                    · {kids.length} jeune{kids.length > 1 ? "s" : ""} · {parentCount.get(f.id) ?? 0} parent{(parentCount.get(f.id) ?? 0) > 1 ? "s" : ""}
                  </span>
                </div>
                {kids.length > 0 && (
                  <div className="text-sm text-slate-600 mt-1">
                    {kids.map((k) => `${k.first_name} ${k.last_name}`).join(", ")}
                  </div>
                )}
                {f.notes && <div className="text-xs text-slate-500 mt-1">{f.notes}</div>}
                <div className="text-xs text-slate-400 mt-1">
                  Créée le {format(new Date(f.created_at), "PPP", { locale: fr })}
                </div>
              </div>
              <Link href={`/admin/families/${f.id}`} className="btn-secondary">
                <Pencil className="w-4 h-4" /> Gérer
              </Link>
            </li>
          );
        })}
        {(families ?? []).length === 0 && (
          <li className="p-6 text-sm text-slate-500">Aucune famille pour le moment.</li>
        )}
      </ul>
    </div>
  );
}
