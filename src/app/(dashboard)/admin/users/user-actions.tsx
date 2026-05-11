"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Trash2 } from "lucide-react";
import { resetPassword, deleteUser } from "./actions";

export default function UserActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const reset = () => start(async () => {
    const res = await resetPassword(userId);
    if (res?.tempPassword) alert(`Nouveau mot de passe : ${res.tempPassword}`);
    else if (res?.error) alert(res.error);
  });

  const remove = () => {
    if (!confirm("Supprimer ce compte ? Cette action est irréversible.")) return;
    start(async () => {
      const res = await deleteUser(userId);
      if (res?.error) { alert(res.error); return; }
      router.refresh();
    });
  };

  return (
    <div className="flex gap-1">
      <button title="Réinitialiser le mot de passe" className="btn-secondary p-2" onClick={reset} disabled={pending}>
        <KeyRound className="w-4 h-4" />
      </button>
      <button title="Supprimer" className="btn-danger p-2" onClick={remove} disabled={pending}>
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
