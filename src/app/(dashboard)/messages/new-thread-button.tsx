"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { openThread } from "./actions";

type Recipient = { id: string; first_name: string; last_name: string; role: string };

export default function NewThreadButton({ recipients }: { recipients: Recipient[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [filter, setFilter] = useState("");

  const filtered = recipients.filter((r) =>
    `${r.first_name} ${r.last_name}`.toLowerCase().includes(filter.toLowerCase()),
  );

  const startThread = (otherId: string) => {
    start(async () => {
      const res = await openThread(otherId);
      if (res?.threadId) {
        router.push(`/messages/${res.threadId}`);
      }
    });
  };

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" /> Nouveau message
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-30 bg-black/30 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-5">
        <h2 className="font-semibold mb-3">Démarrer une conversation</h2>
        <input
          autoFocus placeholder="Rechercher…"
          className="input mb-3"
          value={filter} onChange={(e) => setFilter(e.target.value)}
        />
        <ul className="max-h-72 overflow-y-auto divide-y">
          {filtered.map((r) => (
            <li key={r.id}>
              <button
                disabled={pending}
                onClick={() => startThread(r.id)}
                className="w-full text-left py-2 px-2 hover:bg-slate-50 rounded"
              >
                <span className="font-medium">{r.first_name} {r.last_name}</span>
                <span className="ml-2 text-xs text-slate-500 capitalize">{r.role}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="py-4 text-sm text-slate-500">Aucun contact.</li>
          )}
        </ul>
        <div className="mt-4 flex justify-end">
          <button className="btn-secondary" onClick={() => setOpen(false)}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
