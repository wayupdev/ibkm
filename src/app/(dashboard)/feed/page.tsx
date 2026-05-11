import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Pin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import PageHeader from "@/components/page-header";
import NewAnnouncementForm from "./new-announcement-form";

const AUDIENCE_BADGE: Record<string, string> = {
  all: "bg-brand-50 text-brand-600",
  parents: "bg-accent-500/10 text-accent-600",
  children: "bg-amber-50 text-amber-700",
};

export default async function FeedPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        eyebrow="Espace membres"
        title={`Bonjour ${profile.first_name}`}
        subtitle="Retrouvez ici toutes les actualités de l'association."
      />

      {profile.role === "admin" && <NewAnnouncementForm />}

      <div className="space-y-3 mt-4">
        {(announcements ?? []).map((a) => (
          <article key={a.id} className="card p-5 sm:p-6">
            <header className="flex items-start justify-between gap-3 mb-3">
              <h2 className="font-display font-semibold text-lg text-ink flex items-center gap-2">
                {a.pinned && <Pin className="w-4 h-4 text-brand-500" />}
                {a.title}
              </h2>
              <span className={`badge ${AUDIENCE_BADGE[a.audience]} shrink-0`}>
                {a.audience === "all" ? "Tous" : a.audience === "parents" ? "Parents" : "Jeunes"}
              </span>
            </header>
            <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">{a.body}</p>
            <footer className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
              {format(new Date(a.created_at), "PPP 'à' HH:mm", { locale: fr })}
            </footer>
          </article>
        ))}
        {(announcements ?? []).length === 0 && (
          <div className="card p-10 text-center">
            <p className="text-sm text-slate-500">Aucune annonce pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
