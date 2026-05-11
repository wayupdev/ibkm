import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { markRead } from "../actions";
import Thread from "./thread";

export default async function ThreadPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const me = await requireProfile();
  const { id } = await params;
  const supabase = await createClient();

  const { data: thread } = await supabase
    .from("message_threads")
    .select("*")
    .eq("id", id).single();
  if (!thread) notFound();

  const otherId = thread.user_a === me.id ? thread.user_b : thread.user_a;
  const { data: other } = await supabase
    .from("profiles").select("id, first_name, last_name, role")
    .eq("id", otherId).single();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  await markRead(id);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link href="/messages" className="btn-secondary p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="font-semibold">{other?.first_name} {other?.last_name}</div>
          <div className="text-xs text-slate-500 capitalize">{other?.role}</div>
        </div>
      </div>
      <Thread
        threadId={id}
        meId={me.id}
        initialMessages={messages ?? []}
      />
    </div>
  );
}
