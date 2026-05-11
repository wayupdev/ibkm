"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Send, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { TripMessage } from "@/lib/types";
import { postTripMessage, deleteTripMessage } from "../actions";
import { cn } from "@/lib/utils";

type Author = { id: string; first_name: string; last_name: string };

export default function TripMessages({
  tripId,
  isAdmin,
  initialMessages,
  authors,
}: {
  tripId: string;
  isAdmin: boolean;
  initialMessages: TripMessage[];
  authors: Author[];
}) {
  const [messages, setMessages] = useState<TripMessage[]>(initialMessages);
  const [authorMap, setAuthorMap] = useState<Record<string, Author>>(
    () => Object.fromEntries(authors.map((a) => [a.id, a])),
  );
  const authorMapRef = useRef(authorMap);
  authorMapRef.current = authorMap;
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const addMessage = (m: TripMessage) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  };

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`trip-messages:${tripId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trip_messages", filter: `trip_id=eq.${tripId}` },
        async (payload) => {
          const msg = payload.new as TripMessage;
          if (!authorMapRef.current[msg.created_by]) {
            const { data } = await supabase
              .from("profiles")
              .select("id, first_name, last_name")
              .eq("id", msg.created_by)
              .single();
            if (data) setAuthorMap((prev) => ({ ...prev, [data.id]: data as Author }));
          }
          addMessage(msg);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "trip_messages", filter: `trip_id=eq.${tripId}` },
        (payload) => {
          const old = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== old.id));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tripId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setError(null);
    setBody("");
    start(async () => {
      const res = await postTripMessage(tripId, text);
      if ("error" in res) {
        setError(res.error);
        setBody(text);
        return;
      }
      addMessage(res.message);
    });
  };

  const onDelete = (id: string) => {
    if (!confirm("Supprimer ce message ?")) return;
    start(async () => {
      await deleteTripMessage(tripId, id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    });
  };

  return (
    <div className="flex flex-col">
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {messages.map((m) => {
          const author = authorMap[m.created_by];
          const name = author ? `${author.first_name} ${author.last_name}` : "—";
          return (
            <div key={m.id} className="rounded-2xl bg-brand-50/60 border border-brand-100 px-4 py-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-ink">{name}</span>
                  <span className="text-slate-400"> · {format(new Date(m.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    className="text-slate-400 hover:text-red-600 disabled:opacity-50"
                    disabled={pending}
                    onClick={() => onDelete(m.id)}
                    aria-label="Supprimer le message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">{m.body}</div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="text-sm text-slate-500 py-6 text-center">
            Aucun message pour le moment.
          </p>
        )}
        <div ref={endRef} />
      </div>

      {isAdmin && (
        <form onSubmit={onSubmit} className="mt-3 border-t border-slate-100 pt-3">
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          <div className="flex gap-2">
            <textarea
              className={cn("input flex-1 resize-none")}
              rows={2}
              placeholder="Écrire un message aux membres du séjour…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={pending}
            />
            <button className="btn-primary self-end" type="submit" disabled={pending || !body.trim()}>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
