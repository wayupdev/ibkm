import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Tent, MapPin, Plus, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import PageHeader from "@/components/page-header";

function formatRange(start: string | null, end: string | null) {
  if (!start && !end) return null;
  const s = start ? format(new Date(start), "d MMM yyyy", { locale: fr }) : "?";
  const e = end ? format(new Date(end), "d MMM yyyy", { locale: fr }) : "?";
  if (start && end && start === end) return s;
  return `${s} → ${e}`;
}

export default async function TripsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  // RLS filters this automatically: admins see everything, others see only
  // trips they are a member of.
  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .order("start_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        eyebrow="Espace membres"
        title="Séjours"
        subtitle="Retrouvez ici les informations et documents de chaque séjour."
        action={
          profile.role === "admin" ? (
            <Link href="/trips/new" className="btn-primary">
              <Plus className="w-4 h-4" /> Nouveau séjour
            </Link>
          ) : null
        }
      />

      <ul className="card divide-y divide-slate-100 overflow-hidden">
        {(trips ?? []).map((t) => {
          const range = formatRange(t.start_date, t.end_date);
          return (
            <li key={t.id}>
              <Link
                href={`/trips/${t.id}`}
                className="flex items-center gap-4 p-4 hover:bg-slate-50/60 transition"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center shrink-0">
                  <Tent className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-semibold text-ink truncate">{t.title}</div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {range && <span>{range}</span>}
                    {t.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {t.location}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </Link>
            </li>
          );
        })}
        {(trips ?? []).length === 0 && (
          <li className="p-6 text-sm text-slate-500">
            {profile.role === "admin"
              ? "Aucun séjour pour le moment. Créez le premier !"
              : "Aucun séjour ne vous est ouvert pour le moment."}
          </li>
        )}
      </ul>
    </div>
  );
}
