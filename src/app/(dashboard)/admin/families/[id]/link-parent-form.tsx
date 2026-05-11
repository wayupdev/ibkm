"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { linkParent } from "../actions";

type Parent = { id: string; first_name: string; last_name: string };

export default function LinkParentForm({
  familyId,
  parents,
}: { familyId: string; parents: Parent[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    const parentId = String(formData.get("parent_id") ?? "");
    const relation = String(formData.get("relation") ?? "").trim() || null;
    if (!parentId) return;
    setError(null);
    start(async () => {
      const res = await linkParent(familyId, parentId, relation);
      if (res?.error) { setError(res.error); return; }
      router.refresh();
    });
  };

  return (
    <form action={onSubmit} className="flex flex-col sm:flex-row gap-2">
      <select name="parent_id" required className="input flex-1">
        <option value="">Sélectionner un parent…</option>
        {parents.map((p) => (
          <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
        ))}
      </select>
      <input name="relation" placeholder="Lien (Mère, Père…)" className="input sm:w-40" />
      <button className="btn-primary" disabled={pending || parents.length === 0}>Rattacher</button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </form>
  );
}
