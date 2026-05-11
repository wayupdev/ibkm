"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";
import { sendMessage } from "../actions";
import { cn } from "@/lib/utils";

export default function Thread({
  threadId,
  meId,
  initialMessages,
}: {
  threadId: string;
  meId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const addMessage = (m: Message) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  };

  // Realtime: receive messages from the other party (or this device, deduped by id)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`thread:${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
        (payload) => addMessage(payload.new as Message),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [threadId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setError(null);
    setBody("");
    start(async () => {
      const res = await sendMessage(threadId, text);
      if ("error" in res) {
        setError(res.error);
        setBody(text); // restore input on failure
        return;
      }
      addMessage(res.message); // optimistic — realtime arrival will be deduped by id
    });
  };

  return (
    <div className="card flex flex-col h-[70vh]">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm shadow-soft",
                  mine ? "bg-brand-500 text-white rounded-br-sm" : "bg-white border border-slate-100 text-ink rounded-bl-sm",
                )}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{m.body}</div>
                <div className={cn("text-[10px] mt-1", mine ? "text-white/70" : "text-slate-500")}>
                  {format(new Date(m.created_at), "HH:mm", { locale: fr })}
                </div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8">
            Aucun message — écrivez le premier.
          </p>
        )}
        <div ref={endRef} />
      </div>
      {error && <p className="px-4 pb-2 text-xs text-red-600">{error}</p>}
      <form onSubmit={onSubmit} className="border-t border-slate-100 p-3 flex gap-2">
        <input
          className="input flex-1"
          placeholder="Votre message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={pending}
        />
        <button className="btn-primary" type="submit" disabled={pending || !body.trim()}>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
