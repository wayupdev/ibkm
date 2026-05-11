import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, MapPin, Calendar, FileText, Download, Tent, MessageSquare } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatBytes } from "@/lib/utils";
import EditTripForm from "./edit-trip-form";
import AddMemberForm from "./add-member-form";
import RemoveMemberButton from "./remove-member-button";
import UploadTripDocForm from "./upload-doc-form";
import DeleteTripDocButton from "./delete-doc-button";
import DeleteTripButton from "./delete-trip-button";
import TripMessages from "./trip-messages";
import type { TripMessage } from "@/lib/types";

function formatRange(start: string | null, end: string | null) {
  if (!start && !end) return null;
  const s = start ? format(new Date(start), "d MMM yyyy", { locale: fr }) : "?";
  const e = end ? format(new Date(end), "d MMM yyyy", { locale: fr }) : "?";
  if (start && end && start === end) return s;
  return `${s} → ${e}`;
}

export default async function TripDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const supabase = await createClient();
  const isAdmin = profile.role === "admin";

  const { data: trip } = await supabase.from("trips").select("*").eq("id", id).single();
  if (!trip) notFound();

  const [{ data: memberRows }, { data: docs }, { data: tripMessages }] = await Promise.all([
    supabase
      .from("trip_members")
      .select("profile_id, profiles(id, first_name, last_name, role)")
      .eq("trip_id", id),
    supabase
      .from("trip_documents")
      .select("*")
      .eq("trip_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("trip_messages")
      .select("*")
      .eq("trip_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const messages = (tripMessages ?? []) as TripMessage[];
  const authorIds = Array.from(new Set(messages.map((m) => m.created_by)));
  const { data: authorRows } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", authorIds)
    : { data: [] as { id: string; first_name: string; last_name: string }[] };
  const authors = authorRows ?? [];

  const members = (memberRows ?? [])
    .map((r) => (Array.isArray(r.profiles) ? r.profiles[0] : r.profiles))
    .filter((p): p is { id: string; first_name: string; last_name: string; role: string } => !!p);

  let availableProfiles: { id: string; first_name: string; last_name: string; role: string }[] = [];
  if (isAdmin) {
    const { data: all } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, role")
      .order("role")
      .order("last_name");
    const memberIds = new Set(members.map((m) => m.id));
    availableProfiles = (all ?? []).filter((p) => !memberIds.has(p.id));
  }

  const items = await Promise.all(
    (docs ?? []).map(async (d) => {
      const { data: signed } = await supabase
        .storage.from("documents")
        .createSignedUrl(d.storage_path, 60 * 60);
      return { ...d, url: signed?.signedUrl ?? null };
    }),
  );

  const range = formatRange(trip.start_date, trip.end_date);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link href="/trips" className="btn-secondary p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="font-display font-bold text-xl flex-1 truncate flex items-center gap-2">
          <Tent className="w-5 h-5 text-brand-500 shrink-0" />
          {trip.title}
        </h1>
        {isAdmin && <DeleteTripButton tripId={trip.id} tripTitle={trip.title} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 mb-3">
            {range && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-4 h-4 text-brand-500" /> {range}
              </span>
            )}
            {trip.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-4 h-4 text-brand-500" /> {trip.location}
              </span>
            )}
          </div>
          {trip.description ? (
            <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">{trip.description}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">Aucune description.</p>
          )}
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-500" />
            Messages
          </h2>
          <TripMessages
            tripId={trip.id}
            isAdmin={isAdmin}
            initialMessages={messages}
            authors={authors}
          />
        </section>

        {isAdmin && (
          <section className="card p-5 lg:col-span-2">
            <h2 className="font-semibold mb-3">Modifier les informations</h2>
            <EditTripForm trip={trip} />
          </section>
        )}

        <section className="card p-5">
          <h2 className="font-semibold mb-3">Documents</h2>
          {isAdmin && (
            <div className="mb-3">
              <UploadTripDocForm tripId={trip.id} />
            </div>
          )}
          <ul className="divide-y divide-slate-100">
            {items.map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{d.title}</div>
                  {d.description && (
                    <div className="text-xs text-slate-500 truncate">{d.description}</div>
                  )}
                  <div className="text-xs text-slate-400">
                    {format(new Date(d.created_at), "d MMM yyyy", { locale: fr })}
                    {d.size_bytes ? ` · ${formatBytes(d.size_bytes)}` : ""}
                  </div>
                </div>
                {d.url && (
                  <a href={d.url} target="_blank" rel="noreferrer" className="btn-secondary">
                    <Download className="w-4 h-4" />
                  </a>
                )}
                {isAdmin && <DeleteTripDocButton tripId={trip.id} docId={d.id} />}
              </li>
            ))}
            {items.length === 0 && (
              <li className="py-3 text-sm text-slate-500">Aucun document.</li>
            )}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold mb-3">
            Accès ({members.length})
          </h2>
          {isAdmin && (
            <div className="mb-3">
              <AddMemberForm tripId={trip.id} profiles={availableProfiles} />
            </div>
          )}
          <ul className="divide-y divide-slate-100">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium text-sm">{m.first_name} {m.last_name}</div>
                  <div className="text-xs text-slate-500 capitalize">{m.role}</div>
                </div>
                {isAdmin && (
                  <RemoveMemberButton tripId={trip.id} profileId={m.id} />
                )}
              </li>
            ))}
            {members.length === 0 && (
              <li className="py-3 text-sm text-slate-500">
                {isAdmin
                  ? "Aucun membre. Ajoutez les personnes qui peuvent voir ce séjour."
                  : "Vous êtes le seul membre listé."}
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
