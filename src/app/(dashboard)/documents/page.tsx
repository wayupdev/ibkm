import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Download, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { formatBytes } from "@/lib/utils";
import PageHeader from "@/components/page-header";
import type { RecipientOption } from "@/components/recipient-picker";
import UploadDocumentForm from "./upload-form";

export default async function DocumentsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: docs } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  const docIds = (docs ?? []).map((d) => d.id);
  const { data: recipientsRows } = docIds.length
    ? await supabase
        .from("document_recipients")
        .select("document_id, profile_id, profile:profiles!document_recipients_profile_id_fkey(id, first_name, last_name, role)")
        .in("document_id", docIds)
    : { data: [] as { document_id: string; profile: RecipientOption | RecipientOption[] | null }[] };

  const recipientsByDoc = new Map<string, RecipientOption[]>();
  for (const row of recipientsRows ?? []) {
    const p = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    if (!p) continue;
    const list = recipientsByDoc.get(row.document_id) ?? [];
    list.push(p);
    recipientsByDoc.set(row.document_id, list);
  }

  let people: RecipientOption[] = [];
  if (profile.role === "admin") {
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, role")
      .neq("id", profile.id)
      .order("role")
      .order("last_name");
    people = (data ?? []) as RecipientOption[];
  }

  // Sign URLs (1h) so children/parents can download.
  const items = await Promise.all(
    (docs ?? []).map(async (d) => {
      const { data: signed } = await supabase
        .storage.from("documents")
        .createSignedUrl(d.storage_path, 60 * 60);
      return {
        ...d,
        url: signed?.signedUrl ?? null,
        recipients: recipientsByDoc.get(d.id) ?? [],
      };
    }),
  );

  return (
    <div>
      <PageHeader
        eyebrow="Partager"
        title="Documents"
        subtitle="Règlements, autorisations, fiches d'inscription… téléchargeables à tout moment."
      />

      {profile.role === "admin" && <UploadDocumentForm people={people} />}

      <ul className="card divide-y divide-slate-100 mt-4 overflow-hidden">
        {items.map((d) => {
          const targeted = d.recipients.length > 0;
          return (
            <li key={d.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/60 transition">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display font-semibold text-ink truncate">{d.title}</div>
                {d.description && <div className="text-sm text-slate-500 truncate">{d.description}</div>}
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span>{format(new Date(d.created_at), "d MMM yyyy", { locale: fr })}</span>
                  {d.size_bytes ? <span>· {formatBytes(d.size_bytes)}</span> : null}
                  <span>· </span>
                  {targeted ? (
                    <span className="inline-flex items-center gap-1 text-brand-600">
                      <Users className="w-3 h-3" />
                      {profile.role === "admin"
                        ? `${d.recipients.length} destinataire${d.recipients.length > 1 ? "s" : ""}`
                        : "envoyé à vous"}
                    </span>
                  ) : (
                    <span className="capitalize">
                      {d.audience === "all" ? "tous" : d.audience === "parents" ? "parents" : "jeunes"}
                    </span>
                  )}
                </div>
                {targeted && profile.role === "admin" && (
                  <div className="text-xs text-slate-500 mt-1 truncate">
                    {d.recipients
                      .map((r: RecipientOption) => `${r.first_name} ${r.last_name}`)
                      .join(", ")}
                  </div>
                )}
              </div>
              {d.url && (
                <a href={d.url} target="_blank" rel="noreferrer" className="btn-secondary">
                  <Download className="w-4 h-4" /> Ouvrir
                </a>
              )}
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="p-6 text-sm text-slate-500">Aucun document pour le moment.</li>
        )}
      </ul>
    </div>
  );
}
