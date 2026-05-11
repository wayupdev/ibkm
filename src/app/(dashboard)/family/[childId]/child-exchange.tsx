"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Send, Upload, FileText, Download, Trash2, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatBytes } from "@/lib/utils";
import type { ChildThreadMessage, ChildDocument, UserRole } from "@/lib/types";
import { sendChildMessage, uploadChildDocument, deleteChildDocument } from "../actions";

type Sender = { id: string; first_name: string; last_name: string; role: string };

type DocWithUrl = ChildDocument & { url: string | null };

export default function ChildExchange({
  childId,
  meId,
  meRole,
  initialMessages,
  documents,
  sendersById,
}: {
  childId: string;
  meId: string;
  meRole: UserRole;
  initialMessages: ChildThreadMessage[];
  documents: DocWithUrl[];
  sendersById: Record<string, Sender>;
}) {
  const [tab, setTab] = useState<"chat" | "docs">("chat");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-slate-100">
        <TabButton active={tab === "chat"} onClick={() => setTab("chat")} icon={<MessageCircle className="w-4 h-4" />}>
          Discussion
        </TabButton>
        <TabButton active={tab === "docs"} onClick={() => setTab("docs")} icon={<FileText className="w-4 h-4" />}>
          Documents
          {documents.length > 0 && (
            <span className="badge bg-slate-100 text-slate-600 ml-1">{documents.length}</span>
          )}
        </TabButton>
      </div>

      {tab === "chat" ? (
        <ChatPane
          childId={childId}
          meId={meId}
          initialMessages={initialMessages}
          sendersById={sendersById}
        />
      ) : (
        <DocsPane
          childId={childId}
          meId={meId}
          meRole={meRole}
          documents={documents}
          sendersById={sendersById}
        />
      )}
    </div>
  );
}

function TabButton({
  active, onClick, icon, children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition",
        active ? "border-brand-500 text-brand-600" : "border-transparent text-slate-500 hover:text-ink",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function ChatPane({
  childId, meId, initialMessages, sendersById,
}: {
  childId: string;
  meId: string;
  initialMessages: ChildThreadMessage[];
  sendersById: Record<string, Sender>;
}) {
  const [messages, setMessages] = useState<ChildThreadMessage[]>(initialMessages);
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const addMessage = (m: ChildThreadMessage) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  };

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`child-thread:${childId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "child_thread_messages", filter: `child_id=eq.${childId}` },
        (payload) => addMessage(payload.new as ChildThreadMessage),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [childId]);

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
      const res = await sendChildMessage(childId, text);
      if ("error" in res) {
        setError(res.error);
        setBody(text);
        return;
      }
      addMessage(res.message);
    });
  };

  return (
    <div className="card flex flex-col h-[65vh]">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          const sender = sendersById[m.sender_id];
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-soft",
                  mine ? "bg-brand-500 text-white rounded-br-sm" : "bg-white border border-slate-100 text-ink rounded-bl-sm",
                )}
              >
                {!mine && sender && (
                  <div className="text-[10px] font-semibold text-brand-600 mb-0.5">
                    {sender.first_name} {sender.last_name}
                    <span className="text-slate-400 font-normal"> · {sender.role}</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">{m.body}</div>
                <div className={cn("text-[10px] mt-1", mine ? "text-white/70" : "text-slate-500")}>
                  {format(new Date(m.created_at), "d MMM HH:mm", { locale: fr })}
                </div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8">
            Aucun message — écrivez le premier message pour démarrer l&apos;échange.
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

function DocsPane({
  childId, meId, meRole, documents, sendersById,
}: {
  childId: string;
  meId: string;
  meRole: UserRole;
  documents: DocWithUrl[];
  sendersById: Record<string, Sender>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    start(async () => {
      const res = await uploadChildDocument(childId, formData);
      if (res?.error) { setError(res.error); return; }
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    });
  };

  const onDelete = (docId: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    start(async () => {
      const res = await deleteChildDocument(childId, docId);
      if (res?.error) { setError(res.error); return; }
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-primary">
          <Upload className="w-4 h-4" />
          {meRole === "admin" ? "Envoyer un document à la famille" : "Envoyer un document aux responsables"}
        </button>
      ) : (
        <form ref={formRef} action={onSubmit} className="card p-5 space-y-3">
          <div>
            <label className="label">Titre</label>
            <input name="title" required className="input" />
          </div>
          <div>
            <label className="label">Description (facultatif)</label>
            <textarea name="description" rows={2} className="input" />
          </div>
          <div>
            <label className="label">Fichier</label>
            <input
              type="file"
              name="file"
              required
              accept=".pdf,image/*,.doc,.docx,.xls,.xlsx"
              className="input"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button disabled={pending} type="submit" className="btn-primary">
              {pending ? "Téléversement…" : "Envoyer"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
              Annuler
            </button>
          </div>
        </form>
      )}

      <ul className="card divide-y divide-slate-100 overflow-hidden">
        {documents.map((d) => {
          const sender = sendersById[d.sender_id];
          const fromAdmin = sender?.role === "admin";
          const canDelete = d.sender_id === meId || meRole === "admin";
          return (
            <li key={d.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/60 transition">
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                fromAdmin ? "bg-brand-50 text-brand-500" : "bg-emerald-50 text-emerald-600",
              )}>
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display font-semibold text-ink truncate">{d.title}</div>
                {d.description && <div className="text-sm text-slate-500 truncate">{d.description}</div>}
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span>{format(new Date(d.created_at), "d MMM yyyy HH:mm", { locale: fr })}</span>
                  {d.size_bytes ? <span>· {formatBytes(d.size_bytes)}</span> : null}
                  {sender && (
                    <span>
                      · Envoyé par {sender.first_name} {sender.last_name}
                      <span className="text-slate-400"> ({sender.role})</span>
                    </span>
                  )}
                </div>
              </div>
              {d.url && (
                <a href={d.url} target="_blank" rel="noreferrer" className="btn-secondary">
                  <Download className="w-4 h-4" /> Ouvrir
                </a>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(d.id)}
                  disabled={pending}
                  className="btn-secondary text-red-600 hover:text-red-700"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          );
        })}
        {documents.length === 0 && (
          <li className="p-6 text-sm text-slate-500 text-center">
            Aucun document échangé pour le moment.
          </li>
        )}
      </ul>
    </div>
  );
}
