import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { markChildThreadRead } from "../actions";
import ChildExchange from "./child-exchange";

export default async function ChildExchangePage({
  params,
}: { params: Promise<{ childId: string }> }) {
  const me = await requireProfile();
  if (me.role === "child") redirect("/feed");
  const { childId } = await params;
  const supabase = await createClient();

  const { data: child } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, birth_date, role, family_id")
    .eq("id", childId)
    .single();
  if (!child || child.role !== "child") notFound();

  if (me.role === "parent") {
    if (!child.family_id) notFound();
    const { data: link } = await supabase
      .from("family_members")
      .select("profile_id")
      .eq("family_id", child.family_id)
      .eq("profile_id", me.id)
      .maybeSingle();
    if (!link) redirect("/family");
  }

  const { data: family } = child.family_id
    ? await supabase.from("families").select("id, name").eq("id", child.family_id).single()
    : { data: null };

  const { data: messages } = await supabase
    .from("child_thread_messages")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: true });

  const { data: docs } = await supabase
    .from("child_documents")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });

  const senderIds = new Set<string>();
  (messages ?? []).forEach((m) => senderIds.add(m.sender_id));
  (docs ?? []).forEach((d) => senderIds.add(d.sender_id));
  const { data: senders } = senderIds.size
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .in("id", Array.from(senderIds))
    : { data: [] as { id: string; first_name: string; last_name: string; role: string }[] };
  const sendersById = new Map((senders ?? []).map((s) => [s.id, s] as const));

  const docsWithUrls = await Promise.all(
    (docs ?? []).map(async (d) => {
      const { data: signed } = await supabase
        .storage.from("family-exchange")
        .createSignedUrl(d.storage_path, 60 * 60);
      return { ...d, url: signed?.signedUrl ?? null };
    }),
  );

  await markChildThreadRead(childId);

  const backHref = me.role === "admin" ? "/admin/exchanges" : "/family";

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link href={backHref} className="btn-secondary p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="font-display font-bold text-lg text-ink truncate">
            {child.first_name} {child.last_name}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
            {family && <span>Famille {family.name}</span>}
            {child.birth_date && (
              <span>· Né(e) le {format(new Date(child.birth_date), "d MMM yyyy", { locale: fr })}</span>
            )}
          </div>
        </div>
      </div>

      <ChildExchange
        childId={childId}
        meId={me.id}
        meRole={me.role}
        initialMessages={messages ?? []}
        documents={docsWithUrls}
        sendersById={Object.fromEntries(sendersById)}
      />
    </div>
  );
}
