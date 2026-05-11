"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, X } from "lucide-react";
import { assignChildToFamily } from "../actions";

type Child = { id: string; first_name: string; last_name: string; birth_date: string | null; family_id: string | null };

export default function AssignChildren({
  familyId,
  familyKids,
  otherKids,
}: { familyId: string; familyKids: Child[]; otherKids: Child[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const change = (childId: string, target: string | null) => {
    start(async () => {
      await assignChildToFamily(childId, target);
      router.refresh();
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Dans la famille ({familyKids.length})</h3>
        <ul className="divide-y border rounded-lg">
          {familyKids.map((c) => (
            <li key={c.id} className="flex items-center justify-between p-3">
              <div>
                <div className="font-medium">{c.first_name} {c.last_name}</div>
                {c.birth_date && (
                  <div className="text-xs text-slate-500">
                    Né(e) le {format(new Date(c.birth_date), "PPP", { locale: fr })}
                  </div>
                )}
              </div>
              <button className="btn-secondary" disabled={pending} onClick={() => change(c.id, null)}>
                <X className="w-4 h-4" /> Détacher
              </button>
            </li>
          ))}
          {familyKids.length === 0 && (
            <li className="p-3 text-sm text-slate-500">Aucun jeune rattaché.</li>
          )}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Disponibles ({otherKids.length})</h3>
        <ul className="divide-y border rounded-lg max-h-96 overflow-y-auto">
          {otherKids.map((c) => (
            <li key={c.id} className="flex items-center justify-between p-3">
              <div>
                <div className="font-medium">{c.first_name} {c.last_name}</div>
                {c.family_id && <div className="text-xs text-slate-500">Déjà dans une autre famille</div>}
              </div>
              <button className="btn-primary" disabled={pending} onClick={() => change(c.id, familyId)}>
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </li>
          ))}
          {otherKids.length === 0 && (
            <li className="p-3 text-sm text-slate-500">Aucun autre jeune à rattacher.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
