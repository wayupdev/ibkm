import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import EditFamilyForm from "./edit-family-form";
import LinkParentForm from "./link-parent-form";
import AssignChildren from "./assign-children";
import UnlinkButton from "./unlink-button";
import DeleteFamilyButton from "./delete-family-button";

export default async function FamilyDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  await requireRole(["admin"]);
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: family },
    { data: children },
    { data: links },
    { data: parents },
  ] = await Promise.all([
    supabase.from("families").select("*").eq("id", id).single(),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, birth_date, family_id")
      .eq("role", "child")
      .order("first_name"),
    supabase
      .from("family_members")
      .select("profile_id, relation, profiles(id, first_name, last_name, role)")
      .eq("family_id", id),
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("role", "parent")
      .order("first_name"),
  ]);

  if (!family) notFound();

  const linkedParentIds = new Set((links ?? []).map((l) => l.profile_id));
  const availableParents = (parents ?? []).filter((p) => !linkedParentIds.has(p.id));

  const familyKids = (children ?? []).filter((c) => c.family_id === id);
  const otherKids = (children ?? []).filter((c) => c.family_id !== id);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin/families" className="btn-secondary p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold flex-1">{family.name}</h1>
        <DeleteFamilyButton familyId={id} familyName={family.name} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="card p-5">
          <h2 className="font-semibold mb-3">Informations</h2>
          <EditFamilyForm family={family} />
        </section>

        <section className="card p-5">
          <h2 className="font-semibold mb-3">Parents</h2>
          <ul className="divide-y mb-3">
            {(links ?? []).map((l) => {
              const p = Array.isArray(l.profiles) ? l.profiles[0] : l.profiles;
              if (!p) return null;
              return (
                <li key={l.profile_id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">{p.first_name} {p.last_name}</div>
                    {l.relation && <div className="text-xs text-slate-500">{l.relation}</div>}
                  </div>
                  <UnlinkButton familyId={id} profileId={l.profile_id} />
                </li>
              );
            })}
            {(links ?? []).length === 0 && (
              <li className="text-sm text-slate-500 py-2">Aucun parent rattaché.</li>
            )}
          </ul>
          <LinkParentForm familyId={id} parents={availableParents} />
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="font-semibold mb-3">Jeunes de la famille</h2>
          <AssignChildren
            familyId={id}
            familyKids={familyKids}
            otherKids={otherKids}
          />
        </section>
      </div>
    </div>
  );
}
