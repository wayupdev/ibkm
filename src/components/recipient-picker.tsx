"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Users, X } from "lucide-react";

export type RecipientOption = {
  id: string;
  first_name: string;
  last_name: string;
  role: "admin" | "parent" | "child";
};

const ROLE_LABEL: Record<RecipientOption["role"], string> = {
  admin: "Admin",
  parent: "Parent",
  child: "Jeune",
};

export default function RecipientPicker({
  people,
  name = "recipient_id",
  onSelectionChange,
}: {
  people: RecipientOption[];
  name?: string;
  onSelectionChange?: (count: number) => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const lastCount = useRef<number>(-1);
  useEffect(() => {
    if (!onSelectionChange) return;
    if (lastCount.current === selected.size) return;
    lastCount.current = selected.size;
    onSelectionChange(selected.size);
  }, [selected, onSelectionChange]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q),
    );
  }, [filter, people]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedList = people.filter((p) => selected.has(p.id));

  if (!enabled) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setEnabled(true)}
          className="inline-flex items-center gap-2 text-sm text-brand-600 hover:underline"
        >
          <Users className="w-4 h-4" />
          Cibler des personnes en particulier…
        </button>
        <p className="text-xs text-slate-500 mt-1">
          Si vous choisissez des personnes, elles seules (et les admins) verront ce contenu — l&apos;option de visibilité ci-dessus est ignorée.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="label !mb-0">Destinataires</span>
        <button
          type="button"
          onClick={() => {
            setEnabled(false);
            setSelected(new Set());
            setFilter("");
          }}
          className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
        >
          <X className="w-3 h-3" /> Annuler le ciblage
        </button>
      </div>

      {selectedList.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedList.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700 text-xs px-2 py-1 hover:bg-brand-100"
            >
              {p.first_name} {p.last_name}
              <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      <input
        placeholder="Rechercher une personne…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="input"
      />

      <ul className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
        {filtered.map((p) => {
          const isSel = selected.has(p.id);
          return (
            <li key={p.id}>
              <label className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => toggle(p.id)}
                  className="accent-brand-500"
                />
                <span className="text-sm font-medium flex-1">
                  {p.first_name} {p.last_name}
                </span>
                <span className="text-xs text-slate-500">{ROLE_LABEL[p.role]}</span>
              </label>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="px-3 py-3 text-sm text-slate-500">Aucun résultat.</li>
        )}
      </ul>

      {Array.from(selected).map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}

      <p className="text-xs text-slate-500">
        {selectedList.length === 0
          ? "Cochez au moins une personne, sinon la visibilité ci-dessus s'applique."
          : `${selectedList.length} destinataire${selectedList.length > 1 ? "s" : ""} sélectionné${selectedList.length > 1 ? "s" : ""}.`}
      </p>
    </div>
  );
}
