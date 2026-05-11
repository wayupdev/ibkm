"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteFamily } from "../actions";

export default function DeleteFamilyButton({
  familyId,
  familyName,
}: { familyId: string; familyName: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    const ok = window.confirm(
      `Supprimer la famille « ${familyName} » ?\n\n` +
        `Les jeunes seront détachés de cette famille (leur compte est conservé).\n` +
        `Les rattachements parents et les documents privés à la famille seront supprimés définitivement.`,
    );
    if (!ok) return;
    setError(null);
    start(async () => {
      const res = await deleteFamily(familyId);
      if (res?.error) setError(res.error);
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        className="btn-secondary text-red-600"
        disabled={pending}
        onClick={onClick}
      >
        <Trash2 className="w-4 h-4" /> {pending ? "Suppression…" : "Supprimer la famille"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
