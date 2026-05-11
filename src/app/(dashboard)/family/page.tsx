import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRight, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/page-header";

export default async function FamilyPage() {
  const me = await requireRole(["parent"]);
  const supabase = await createClient();

  const { data: links } = await supabase
    .from("family_members")
    .select("family_id, family:families(id, name)")
    .eq("profile_id", me.id);

  const familyIds = (links ?? [])
    .map((l) => l.family_id)
    .filter((id): id is string => Boolean(id));

  const { data: children } = familyIds.length
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name, birth_date, family_id")
        .eq("role", "child")
        .in("family_id", familyIds)
        .order("first_name")
    : { data: [] as { id: string; first_name: string; last_name: string; birth_date: string | null; family_id: string }[] };

  const familyNameById = new Map<string, string>();
  for (const l of links ?? []) {
    const fam = Array.isArray(l.family) ? l.family[0] : l.family;
    if (fam) familyNameById.set(fam.id, fam.name);
  }

  const childIds = (children ?? []).map((c) => c.id);
  const { data: threads } = childIds.length
    ? await supabase
        .from("child_threads")
        .select("child_id, last_msg_at")
        .in("child_id", childIds)
    : { data: [] as { child_id: string; last_msg_at: string }[] };
  const threadByChild = new Map<string, { last_msg_at: string }>();
  for (const t of threads ?? []) threadByChild.set(t.child_id, { last_msg_at: t.last_msg_at });

  const { data: unread } = childIds.length
    ? await supabase
        .from("child_thread_messages")
        .select("child_id")
        .in("child_id", childIds)
        .is("read_at", null)
        .neq("sender_id", me.id)
    : { data: [] as { child_id: string }[] };
  const unreadByChild = new Map<string, number>();
  for (const m of unread ?? []) {
    unreadByChild.set(m.child_id, (unreadByChild.get(m.child_id) ?? 0) + 1);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Famille"
        title="Mes enfants"
        subtitle="Retrouvez chaque jeune, échangez avec les responsables et partagez des documents — un fil par enfant."
      />

      {(children ?? []).length === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-400" />
          <p className="text-sm">
            Aucun jeune n&apos;est encore rattaché à votre famille. Contactez un responsable pour mettre à jour votre dossier.
          </p>
        </div>
      ) : (
        <ul className="card divide-y divide-slate-100 overflow-hidden">
          {(children ?? []).map((c) => {
            const familyName = familyNameById.get(c.family_id);
            const thread = threadByChild.get(c.id);
            const unreadCount = unreadByChild.get(c.id) ?? 0;
            return (
              <li key={c.id}>
                <Link
                  href={`/family/${c.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 transition"
                >
                  <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-display font-semibold">
                    {c.first_name[0]}{c.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{c.first_name} {c.last_name}</span>
                      {unreadCount > 0 && (
                        <span className="badge bg-brand-500 text-white">{unreadCount}</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      {familyName && <span>Famille {familyName}</span>}
                      {c.birth_date && (
                        <span>· Né(e) le {format(new Date(c.birth_date), "d MMM yyyy", { locale: fr })}</span>
                      )}
                      {thread && (
                        <span>· Dernier échange {format(new Date(thread.last_msg_at), "d MMM", { locale: fr })}</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
