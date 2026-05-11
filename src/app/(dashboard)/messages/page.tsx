import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import PageHeader from "@/components/page-header";
import NewThreadButton from "./new-thread-button";

export default async function MessagesPage() {
  const me = await requireProfile();
  const supabase = await createClient();

  // Threads I'm in
  const { data: threads } = await supabase
    .from("v_my_threads")
    .select("*")
    .order("last_msg_at", { ascending: false });

  // Names of the counterparts
  const otherIds = (threads ?? []).map((t) => t.other_id).filter(Boolean);
  const { data: others } = otherIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name, role").in("id", otherIds)
    : { data: [] as { id: string; first_name: string; last_name: string; role: string }[] };
  const othersById = new Map(others?.map((o) => [o.id, o]) ?? []);

  // Recipients available to start a new thread
  let recipientsQuery = supabase.from("profiles").select("id, first_name, last_name, role");
  recipientsQuery =
    me.role === "child"
      ? recipientsQuery.eq("role", "admin")
      : me.role === "parent"
      ? recipientsQuery.in("role", ["admin"]) // parents <-> admins for now
      : recipientsQuery.neq("id", me.id);
  const { data: recipients } = await recipientsQuery;

  return (
    <div>
      <PageHeader
        eyebrow="Comprendre"
        title="Messagerie"
        subtitle={
          me.role === "child"
            ? "Tu peux échanger avec les responsables de l'association."
            : me.role === "parent"
            ? "Échangez en direct avec les responsables de l'association."
            : "Conversations avec les familles et les jeunes."
        }
        action={<NewThreadButton recipients={recipients ?? []} />}
      />

      <ul className="card divide-y">
        {(threads ?? []).map((t) => {
          const o = othersById.get(t.other_id);
          if (!o) return null;
          return (
            <li key={t.id}>
              <Link
                href={`/messages/${t.id}`}
                className="flex items-center gap-3 p-4 hover:bg-slate-50"
              >
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-display font-semibold">
                  {o.first_name[0]}{o.last_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{o.first_name} {o.last_name}</span>
                    {t.unread_count > 0 && (
                      <span className="badge bg-brand-500 text-white">{t.unread_count}</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {format(new Date(t.last_msg_at), "PPP", { locale: fr })} · {o.role}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
        {(threads ?? []).length === 0 && (
          <li className="flex flex-col items-center justify-center p-10 text-center text-slate-500">
            <MessageCircle className="w-10 h-10 mb-3" />
            <p className="text-sm">Aucune conversation pour le moment.</p>
          </li>
        )}
      </ul>
    </div>
  );
}
