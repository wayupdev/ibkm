import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRight, Users, MessageCircle, FileText } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/page-header";

export default async function AdminExchangesPage() {
  const me = await requireRole(["admin"]);
  const supabase = await createClient();

  const [
    { data: families },
    { data: children },
    { data: parentLinks },
    { data: threads },
    { data: unreadMsgs },
    { data: docs },
  ] = await Promise.all([
    supabase.from("families").select("id, name").order("name"),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, family_id, birth_date")
      .eq("role", "child")
      .not("family_id", "is", null)
      .order("first_name"),
    supabase
      .from("family_members")
      .select("family_id, profile:profiles!family_members_profile_id_fkey(id, first_name, last_name)"),
    supabase.from("child_threads").select("child_id, last_msg_at"),
    supabase
      .from("child_thread_messages")
      .select("child_id")
      .is("read_at", null)
      .neq("sender_id", me.id),
    supabase.from("child_documents").select("child_id"),
  ]);

  const childrenByFamily = new Map<string, typeof children>();
  for (const c of children ?? []) {
    if (!c.family_id) continue;
    const arr = childrenByFamily.get(c.family_id) ?? [];
    arr.push(c);
    childrenByFamily.set(c.family_id, arr);
  }

  const parentsByFamily = new Map<string, { id: string; first_name: string; last_name: string }[]>();
  for (const link of parentLinks ?? []) {
    const p = Array.isArray(link.profile) ? link.profile[0] : link.profile;
    if (!p) continue;
    const arr = parentsByFamily.get(link.family_id) ?? [];
    arr.push(p);
    parentsByFamily.set(link.family_id, arr);
  }

  const threadByChild = new Map<string, string>();
  for (const t of threads ?? []) threadByChild.set(t.child_id, t.last_msg_at);

  const unreadByChild = new Map<string, number>();
  for (const m of unreadMsgs ?? []) {
    unreadByChild.set(m.child_id, (unreadByChild.get(m.child_id) ?? 0) + 1);
  }

  const docsByChild = new Map<string, number>();
  for (const d of docs ?? []) {
    docsByChild.set(d.child_id, (docsByChild.get(d.child_id) ?? 0) + 1);
  }

  const familiesWithKids = (families ?? []).filter(
    (f) => (childrenByFamily.get(f.id) ?? []).length > 0,
  );

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Échanges familles"
        subtitle="Toutes les conversations et documents avec les familles, séparés par jeune."
      />

      {familiesWithKids.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-400" />
          <p className="text-sm">Aucune famille avec un jeune rattaché pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {familiesWithKids.map((fam) => {
            const kids = childrenByFamily.get(fam.id) ?? [];
            const parents = parentsByFamily.get(fam.id) ?? [];
            const famUnread = kids.reduce((sum, k) => sum + (unreadByChild.get(k.id) ?? 0), 0);
            return (
              <section key={fam.id} className="card overflow-hidden">
                <header className="flex items-start gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-semibold text-ink">{fam.name}</span>
                      {famUnread > 0 && (
                        <span className="badge bg-brand-500 text-white">
                          {famUnread} non lu{famUnread > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {parents.length === 0
                        ? "Aucun parent rattaché"
                        : `Parents : ${parents.map((p) => `${p.first_name} ${p.last_name}`).join(", ")}`}
                    </div>
                  </div>
                  <Link href={`/admin/families/${fam.id}`} className="text-xs text-brand-600 hover:underline">
                    Gérer la famille
                  </Link>
                </header>
                <ul className="divide-y divide-slate-100">
                  {kids.map((k) => {
                    const unread = unreadByChild.get(k.id) ?? 0;
                    const docCount = docsByChild.get(k.id) ?? 0;
                    const lastMsg = threadByChild.get(k.id);
                    return (
                      <li key={k.id}>
                        <Link
                          href={`/admin/exchanges/${k.id}`}
                          className="flex items-center gap-4 p-4 hover:bg-slate-50 transition"
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-display font-semibold">
                            {k.first_name[0]}{k.last_name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-ink">{k.first_name} {k.last_name}</span>
                              {unread > 0 && (
                                <span className="badge bg-brand-500 text-white">{unread}</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                              {k.birth_date && (
                                <span>Né(e) le {format(new Date(k.birth_date), "d MMM yyyy", { locale: fr })}</span>
                              )}
                              <span className="inline-flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                {lastMsg
                                  ? `Dernier message ${format(new Date(lastMsg), "d MMM HH:mm", { locale: fr })}`
                                  : "Aucun message"}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {docCount} document{docCount > 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
